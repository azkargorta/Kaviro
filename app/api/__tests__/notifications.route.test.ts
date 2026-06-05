import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
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

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  })),
}));

function notificationsTableMock(rows: Array<Record<string, unknown>> = []) {
  mocks.from.mockImplementation((table: string) => {
    if (table !== "user_notifications") return {};
    return {
      select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head) {
          return {
            eq: vi.fn(() => ({
              is: vi.fn(async () => ({
                count: rows.filter((r) => !r.read_at).length,
                error: null,
              })),
            })),
          };
        }
        return {
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(async () => ({ data: rows, error: null })),
            })),
            is: vi.fn(async () => ({ error: null })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(async () => ({ error: null })),
              })),
            })),
          })),
        };
      }),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn(async () => ({ error: null })),
          eq: vi.fn(() => ({
            is: vi.fn(async () => ({ error: null })),
          })),
        })),
      })),
    };
  });
}

async function readJson(resp: Response) {
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

describe("/api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET devuelve 401 sin sesión", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null } });

    const { GET } = await import("../notifications/route");
    const resp = await GET();
    expect(resp.status).toBe(401);
  });

  it("GET devuelve notificaciones y contador sin leer", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    notificationsTableMock([
      { id: "n1", title: "Hola", read_at: null },
      { id: "n2", title: "Leída", read_at: "2026-01-01T00:00:00Z" },
    ]);

    const { GET } = await import("../notifications/route");
    const resp = await GET();
    expect(resp.status).toBe(200);
    const payload = await readJson(resp);
    expect(payload?.notifications).toHaveLength(2);
    expect(payload?.unreadCount).toBe(1);
  });

  it("PATCH mark_all_read responde ok", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    notificationsTableMock([]);

    const { PATCH } = await import("../notifications/route");
    const resp = await PATCH(
      new Request("http://localhost/api/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      })
    );
    expect(resp.status).toBe(200);
    const payload = await readJson(resp);
    expect(payload?.ok).toBe(true);
    expect(payload?.unreadCount).toBe(0);
  });

  it("PATCH devuelve 400 si falta id en mark_read", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    notificationsTableMock([]);

    const { PATCH } = await import("../notifications/route");
    const resp = await PATCH(
      new Request("http://localhost/api/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "mark_read" }),
      })
    );
    expect(resp.status).toBe(400);
  });
});
