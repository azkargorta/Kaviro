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

const ensureUserCanCreateTrip = vi.fn();
vi.mock("@/lib/trips/tripCreationLimits", () => ({
  ensureUserCanCreateTrip,
}));

const createTripWithOwner = vi.fn();
vi.mock("@/lib/trips/createTripWithOwner", () => ({
  createTripWithOwner,
}));

async function readJson(resp: Response) {
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

describe("POST /api/trips", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 401 sin sesión", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import("../trips/route");
    const resp = await POST(
      new Request("http://localhost/api/trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Viaje" }),
      })
    );
    expect(resp.status).toBe(401);
  });

  it("devuelve 402 cuando se alcanza el límite de viajes", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null });
    ensureUserCanCreateTrip.mockResolvedValueOnce({ error: "Límite alcanzado", code: "TRIP_LIMIT" });

    const { POST } = await import("../trips/route");
    const resp = await POST(
      new Request("http://localhost/api/trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Viaje" }),
      })
    );
    expect(resp.status).toBe(402);
    const payload = await readJson(resp);
    expect(payload.code).toBe("TRIP_LIMIT");
  });

  it("devuelve 400 sin nombre", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null });
    ensureUserCanCreateTrip.mockResolvedValueOnce({ ok: true });

    const { POST } = await import("../trips/route");
    const resp = await POST(
      new Request("http://localhost/api/trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(resp.status).toBe(400);
  });

  it("crea viaje con 201", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "u1", email: "a@b.com" } }, error: null });
    ensureUserCanCreateTrip.mockResolvedValueOnce({ ok: true });
    createTripWithOwner.mockResolvedValueOnce({ tripId: "trip-1" });

    const { POST } = await import("../trips/route");
    const resp = await POST(
      new Request("http://localhost/api/trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Roma 2026", start_date: "2026-06-01", end_date: "2026-06-05" }),
      })
    );
    expect(resp.status).toBe(201);
    const payload = await readJson(resp);
    expect(payload.tripId).toBe("trip-1");
  });
});
