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

const signUp = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { signUp },
  })),
}));

const adminFrom = vi.fn();
vi.mock("@/lib/supabase-admin", () => ({
  createSupabaseAdmin: vi.fn(() => ({ from: adminFrom })),
}));

async function readJson(resp: Response) {
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            })),
          })),
          upsert: vi.fn(async () => ({ error: null })),
        };
      }
      return {};
    });
    signUp.mockResolvedValue({
      data: { user: { id: "u-new" } },
      error: null,
    });
  });

  it("devuelve 400 si el username es inválido", async () => {
    const { POST } = await import("../auth/signup/route");
    const resp = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "x", email: "a@b.com", password: "12345678" }),
      })
    );
    expect(resp.status).toBe(400);
    expect(signUp).not.toHaveBeenCalled();
  });

  it("devuelve 400 si el email es inválido", async () => {
    const { POST } = await import("../auth/signup/route");
    const resp = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "viajero", email: "mal", password: "12345678" }),
      })
    );
    expect(resp.status).toBe(400);
    expect(signUp).not.toHaveBeenCalled();
  });

  it("devuelve 409 si el username ya existe", async () => {
    adminFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: { id: "other" }, error: null })),
            })),
          })),
        };
      }
      return {};
    });

    const { POST } = await import("../auth/signup/route");
    const resp = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "viajero", email: "a@b.com", password: "12345678" }),
      })
    );
    expect(resp.status).toBe(409);
    const payload = await readJson(resp);
    expect(String(payload?.error || "")).toMatch(/usuario/i);
    expect(signUp).not.toHaveBeenCalled();
  });

  it("crea cuenta y perfil cuando los datos son válidos", async () => {
    const { POST } = await import("../auth/signup/route");
    const resp = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "viajero", email: "a@b.com", password: "12345678" }),
      })
    );
    expect(resp.status).toBe(200);
    const payload = await readJson(resp);
    expect(payload?.ok).toBe(true);
    expect(payload?.needsEmailConfirmation).toBe(true);
    expect(signUp).toHaveBeenCalledTimes(1);
  });
});
