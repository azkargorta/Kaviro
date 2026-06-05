import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json" },
      }),
  },
}));

vi.mock("@/lib/trip-access", () => ({
  getTripAccessForApi: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: vi.fn(),
}));

const { getTripAccessForApi } = await import("@/lib/trip-access");

async function readJson(resp: Response) {
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

describe("GET /api/trip-shares", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 400 si falta tripId", async () => {
    const { GET } = await import("../trip-shares/route");
    const resp = await GET(new Request("http://localhost/api/trip-shares"));
    expect(resp.status).toBe(400);
  });

  it("devuelve 403 si el usuario no puede compartir", async () => {
    vi.mocked(getTripAccessForApi).mockResolvedValueOnce({
      ok: true,
      access: {
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
      },
    });

    const { GET } = await import("../trip-shares/route");
    const resp = await GET(new Request("http://localhost/api/trip-shares?tripId=t1"));
    expect(resp.status).toBe(403);
    const payload = await readJson(resp);
    expect(String(payload?.error || "")).toMatch(/permisos/i);
  });
});
