import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json" },
      }),
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { setSession: vi.fn(async () => ({ error: null })) },
  })),
}));

const goTruePasswordGrant = vi.fn();
vi.mock("@/lib/supabase/goTruePasswordGrant", () => ({ goTruePasswordGrant }));

async function readJson(resp: Response) {
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

describe("POST /api/auth/login", () => {
  const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origKey;
  });

  it("devuelve 400 si faltan credenciales", async () => {
    const { POST } = await import("../auth/login/route");
    const resp = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "", password: "" }),
      })
    );
    expect(resp.status).toBe(400);
    const payload = await readJson(resp);
    expect(String(payload?.error || "")).toMatch(/obligatorios/i);
    expect(goTruePasswordGrant).not.toHaveBeenCalled();
  });

  it("devuelve 400 si el email no es válido", async () => {
    const { POST } = await import("../auth/login/route");
    const resp = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "no-es-email", password: "secret" }),
      })
    );
    expect(resp.status).toBe(400);
    const payload = await readJson(resp);
    expect(String(payload?.error || "")).toMatch(/válido/i);
    expect(goTruePasswordGrant).not.toHaveBeenCalled();
  });

  it("devuelve 503 si Supabase no está configurado", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { POST } = await import("../auth/login/route");
    const resp = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "user@example.com", password: "secret" }),
      })
    );
    expect(resp.status).toBe(503);
    expect(goTruePasswordGrant).not.toHaveBeenCalled();
  });

  it("devuelve 401 si GoTrue rechaza las credenciales", async () => {
    goTruePasswordGrant.mockResolvedValueOnce({
      ok: false,
      status: 401,
      message: "Credenciales incorrectas",
    });

    const { POST } = await import("../auth/login/route");
    const resp = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "user@example.com", password: "wrong" }),
      })
    );
    expect(resp.status).toBe(401);
    const payload = await readJson(resp);
    expect(payload?.error).toBe("Credenciales incorrectas");
  });
});
