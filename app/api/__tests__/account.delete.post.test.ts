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
const signOut = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser, signOut },
  })),
}));

const deleteUser = vi.fn();
vi.mock("@/lib/supabase-admin", () => ({
  createSupabaseAdmin: vi.fn(() => ({
    auth: { admin: { deleteUser } },
  })),
}));

async function readJson(resp: Response) {
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

describe("POST /api/account/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 400 sin confirmación ELIMINAR", async () => {
    const { POST } = await import("../account/delete/route");
    const resp = await POST(
      new Request("http://localhost/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: "borrar" }),
      })
    );
    expect(resp.status).toBe(400);
  });

  it("devuelve 401 sin sesión", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import("../account/delete/route");
    const resp = await POST(
      new Request("http://localhost/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: "ELIMINAR" }),
      })
    );
    expect(resp.status).toBe(401);
  });

  it("elimina cuenta y hace signOut", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null });
    deleteUser.mockResolvedValueOnce({ error: null });
    signOut.mockResolvedValueOnce({ error: null });

    const { POST } = await import("../account/delete/route");
    const resp = await POST(
      new Request("http://localhost/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: "ELIMINAR" }),
      })
    );
    expect(resp.status).toBe(200);
    const payload = await readJson(resp);
    expect(payload.ok).toBe(true);
    expect(deleteUser).toHaveBeenCalledWith("u1");
    expect(signOut).toHaveBeenCalled();
  });
});
