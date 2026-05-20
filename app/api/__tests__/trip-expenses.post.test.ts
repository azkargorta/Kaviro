import { beforeEach, describe, expect, it, vi } from "vitest";

// Minimal NextResponse mock for route handlers.
vi.mock("next/server", () => {
  return {
    NextResponse: {
      json: (data: any, init?: ResponseInit) =>
        new Response(JSON.stringify(data), {
          status: init?.status ?? 200,
          headers: { "content-type": "application/json" },
        }),
    },
  };
});

const safeInsertAudit = vi.fn(async () => undefined);
vi.mock("@/lib/audit", () => ({ safeInsertAudit }));

const requireTripAccessApi = vi.fn();
vi.mock("@/lib/trip-access-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/trip-access-api")>();
  return { ...actual, requireTripAccessApi };
});

function makeSupabaseMock(params: {
  insertOk?: boolean;
}) {
  const insertOk = params.insertOk ?? true;
  const from = vi.fn((table: string) => {
    if (table === "trip_expenses") {
      return {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () =>
              insertOk
                ? { data: { id: "e1", title: "Comida" }, error: null }
                : { data: null, error: { message: "insert failed" } }
            ),
          })),
        })),
      };
    }
    if (table === "trip_audit_log") {
      return { insert: vi.fn(async () => ({ data: null, error: null })) };
    }
    return {};
  });

  return {
    from,
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "u1", email: "a@b.com" } } })) },
  };
}

function gateWithAccess(access: Record<string, unknown>, supabase = makeSupabaseMock({ insertOk: true })) {
  return { ok: true as const, access, supabase };
}

async function readJson(resp: Response) {
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

describe("POST /api/trip-expenses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 403 si no tiene can_manage_expenses", async () => {
    requireTripAccessApi.mockResolvedValueOnce(
      gateWithAccess({
        userId: "u1",
        participantId: "p1",
        tripId: "t1",
        role: "viewer",
        can_manage_expenses: false,
        can_manage_trip: false,
        can_manage_participants: false,
        can_manage_plan: false,
        can_manage_map: false,
        can_manage_resources: false,
      })
    );

    const { POST } = await import("../trip-expenses/route");
    const req = new Request("http://localhost/api/trip-expenses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tripId: "t1", title: "Comida", amount: 10, currency: "EUR" }),
    });

    const resp = await POST(req);
    expect(resp.status).toBe(403);
    const payload = await readJson(resp);
    expect(String(payload?.error || "")).toMatch(/permisos/i);
    expect(safeInsertAudit).not.toHaveBeenCalled();
  });

  it("inserta gasto y llama a safeInsertAudit cuando hay permisos", async () => {
    requireTripAccessApi.mockResolvedValueOnce(
      gateWithAccess({
        userId: "u1",
        participantId: "p1",
        tripId: "t1",
        role: "editor",
        can_manage_expenses: true,
        can_manage_trip: false,
        can_manage_participants: false,
        can_manage_plan: true,
        can_manage_map: true,
        can_manage_resources: true,
      })
    );

    const { POST } = await import("../trip-expenses/route");
    const req = new Request("http://localhost/api/trip-expenses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tripId: "t1", title: "Comida", amount: 10, currency: "EUR" }),
    });

    const resp = await POST(req);
    expect(resp.status).toBe(201);
    const payload = await readJson(resp);
    expect(payload?.expense?.id).toBe("e1");
    expect(safeInsertAudit).toHaveBeenCalledTimes(1);
  });
});

