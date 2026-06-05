import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
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

vi.mock("@/lib/trip-access-api", async () => {
  const { NextResponse } = await import("next/server");
  return {
    requireTripAccessApi: mocks.requireTripAccessApi,
    forbidUnlessCanManageResources: (
      access: { can_manage_resources?: boolean },
      message = "No tienes permisos para gestionar recursos y documentos."
    ) => {
      if (access.can_manage_resources) return null;
      return NextResponse.json({ error: message, code: "FORBIDDEN" }, { status: 403 });
    },
  };
});

function makeSupabaseMock() {
  const from = vi.fn((table: string) => {
    if (table === "trip_resources") {
      return {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({ data: { id: "res1", title: "Documento" }, error: null })),
          })),
        })),
      };
    }
    if (table === "trip_participants") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn(async () => ({ data: [{ user_id: "u1", role: "owner" }], error: null })),
          })),
        })),
      };
    }
    return {};
  });

  return {
    from,
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(async () => ({ data: null, error: { message: "no file" } })),
      })),
    },
  };
}

function gateWithAccess(access: Record<string, unknown>) {
  return {
    ok: true as const,
    access,
    supabase: makeSupabaseMock(),
  };
}

async function readJson(resp: Response) {
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

describe("POST /api/trip-resources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 403 si no tiene can_manage_resources", async () => {
    mocks.requireTripAccessApi.mockResolvedValueOnce(
      gateWithAccess({
        userId: "u1",
        participantId: "p1",
        tripId: "t1",
        role: "viewer",
        can_manage_resources: false,
        can_manage_trip: false,
        can_manage_participants: false,
        can_manage_expenses: false,
        can_manage_plan: false,
        can_manage_map: false,
      })
    );

    const { POST } = await import("../trip-resources/route");
    const req = new Request("http://localhost/api/trip-resources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tripId: "t1", title: "Documento", resource_type: "document" }),
    });

    const resp = await POST(req);
    expect(resp.status).toBe(403);
    const payload = await readJson(resp);
    expect(String(payload?.error || "")).toMatch(/permisos/i);
  });

  it("inserta recurso cuando hay permisos", async () => {
    mocks.requireTripAccessApi.mockResolvedValueOnce(
      gateWithAccess({
        userId: "u1",
        participantId: "p1",
        tripId: "t1",
        role: "editor",
        can_manage_resources: true,
        can_manage_trip: false,
        can_manage_participants: false,
        can_manage_expenses: true,
        can_manage_plan: true,
        can_manage_map: true,
      })
    );

    const { POST } = await import("../trip-resources/route");
    const req = new Request("http://localhost/api/trip-resources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tripId: "t1", title: "Documento", resource_type: "document" }),
    });

    const resp = await POST(req);
    expect(resp.status).toBe(201);
    const payload = await readJson(resp);
    expect(payload?.resource?.id).toBe("res1");
  });
});
