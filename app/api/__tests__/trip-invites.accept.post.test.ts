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

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
  })),
}));

const adminFrom = vi.fn();
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: vi.fn(() => ({ from: adminFrom })),
}));

vi.mock("@/lib/onboarding/createDemoTrip", () => ({
  ensureDemoTripForUser: vi.fn(async () => undefined),
}));

async function readJson(resp: Response) {
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

describe("POST /api/trip-invites/accept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 400 si falta el token", async () => {
    const { POST } = await import("../trip-invites/accept/route");
    const resp = await POST(
      new Request("http://localhost/api/trip-invites/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(resp.status).toBe(400);
    const payload = await readJson(resp);
    expect(String(payload?.error || "")).toMatch(/token/i);
  });

  it("devuelve 401 si el usuario no está autenticado", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const { POST } = await import("../trip-invites/accept/route");
    const resp = await POST(
      new Request("http://localhost/api/trip-invites/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "abc123" }),
      })
    );
    expect(resp.status).toBe(401);
    const payload = await readJson(resp);
    expect(String(payload?.error || "")).toMatch(/sesión/i);
    expect(adminFrom).not.toHaveBeenCalled();
  });

  it("devuelve 404 si la invitación no existe", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null });
    adminFrom.mockImplementation((table: string) => {
      if (table === "trip_invites") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            })),
          })),
        };
      }
      return {};
    });

    const { POST } = await import("../trip-invites/accept/route");
    const resp = await POST(
      new Request("http://localhost/api/trip-invites/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "missing" }),
      })
    );
    expect(resp.status).toBe(404);
    const payload = await readJson(resp);
    expect(String(payload?.error || "")).toMatch(/no encontrada/i);
  });
});
