import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  safeInsertAudit: vi.fn(async () => undefined),
  requireTripAccessApi: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json" },
      }),
  },
}));

vi.mock("@/lib/audit", () => ({ safeInsertAudit: mocks.safeInsertAudit }));

vi.mock("@/lib/trip-access-api", async () => {
  const { NextResponse } = await import("next/server");
  return {
    requireTripAccessApi: mocks.requireTripAccessApi,
    forbidUnlessCanManageMap: (
      access: { can_manage_map?: boolean },
      message = "No tienes permisos para gestionar el mapa y las rutas."
    ) => {
      if (access.can_manage_map) return null;
      return NextResponse.json({ error: message, code: "FORBIDDEN" }, { status: 403 });
    },
  };
});

function makeSupabaseMock() {
  const from = vi.fn((table: string) => {
    if (table === "trip_routes") {
      return {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({ data: { id: "r1", title: "Ruta 1" }, error: null })),
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

function gateWithAccess(access: Record<string, unknown>, supabase = makeSupabaseMock()) {
  return { ok: true as const, access, supabase };
}

async function readJson(resp: Response) {
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

describe("POST /api/trip-routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 403 si no tiene can_manage_map", async () => {
    mocks.requireTripAccessApi.mockResolvedValueOnce(
      gateWithAccess({
        userId: "u1",
        participantId: "p1",
        tripId: "t1",
        role: "viewer",
        can_manage_map: false,
        can_manage_trip: false,
        can_manage_participants: false,
        can_manage_expenses: false,
        can_manage_plan: false,
        can_manage_resources: false,
      })
    );

    const { POST } = await import("../trip-routes/route");
    const req = new Request("http://localhost/api/trip-routes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tripId: "t1", title: "Ruta 1" }),
    });

    const resp = await POST(req);
    expect(resp.status).toBe(403);
    const payload = await readJson(resp);
    expect(String(payload?.error || "")).toMatch(/permisos/i);
    expect(mocks.safeInsertAudit).not.toHaveBeenCalled();
  });

  it("inserta ruta y llama a safeInsertAudit cuando hay permisos", async () => {
    mocks.requireTripAccessApi.mockResolvedValueOnce(
      gateWithAccess({
        userId: "u1",
        participantId: "p1",
        tripId: "t1",
        role: "editor",
        can_manage_map: true,
        can_manage_trip: false,
        can_manage_participants: false,
        can_manage_expenses: true,
        can_manage_plan: true,
        can_manage_resources: true,
      })
    );

    const { POST } = await import("../trip-routes/route");
    const req = new Request("http://localhost/api/trip-routes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tripId: "t1", title: "Ruta 1" }),
    });

    const resp = await POST(req);
    expect(resp.status).toBe(200);
    const payload = await readJson(resp);
    expect(payload?.route?.id).toBe("r1");
    expect(mocks.safeInsertAudit).toHaveBeenCalledTimes(1);
  });
});
