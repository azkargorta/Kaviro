import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => {
      const res = new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json" },
      });
      (res as Response & { cookies: { set: ReturnType<typeof vi.fn> } }).cookies = { set: vi.fn() };
      return res;
    },
  },
}));

const getUser = vi.fn();
const cookieGetAll = vi.fn(() => []);
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: cookieGetAll })),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser },
  })),
}));

const adminFrom = vi.fn();
vi.mock("@/lib/supabase-admin", () => ({
  createSupabaseAdmin: vi.fn(() => ({ from: adminFrom })),
}));

vi.mock("@/lib/profile-username", () => ({
  syncProfileUsernameIfMissing: vi.fn(async () => "testuser"),
  resolveProfileUsername: vi.fn(() => "testuser"),
}));

async function readJson(resp: Response) {
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve ok:false sin usuario", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { GET } = await import("../auth/me/route");
    const resp = await GET();
    const payload = await readJson(resp);
    expect(payload.ok).toBe(false);
    expect(payload.userId).toBeNull();
  });

  it("devuelve usuario y username cuando hay sesión", async () => {
    getUser.mockResolvedValueOnce({
      data: { user: { id: "u1", email: "a@b.com" } },
      error: null,
    });
    adminFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: { username: "testuser", email: "a@b.com" }, error: null })),
            })),
          })),
        };
      }
      return {};
    });

    const { GET } = await import("../auth/me/route");
    const resp = await GET();
    const payload = await readJson(resp);
    expect(payload.ok).toBe(true);
    expect(payload.userId).toBe("u1");
    expect(payload.username).toBe("testuser");
  });
});
