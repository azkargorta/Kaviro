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
vi.mock("@/lib/supabase-admin", () => ({
  createSupabaseAdmin: vi.fn(() => ({ from: adminFrom })),
}));

vi.mock("@/lib/travel-mates", () => ({
  upsertTravelMatePair: vi.fn(async () => undefined),
}));

vi.mock("@/lib/onboarding/createDemoTrip", () => ({
  ensureDemoTripForUser: vi.fn(async () => undefined),
}));

vi.mock("@/lib/server/web-push", () => ({
  sendPushToUserIds: vi.fn(async () => undefined),
}));

vi.mock("@/lib/push-notification-preferences", () => ({
  filterUserIdsByPushPreferences: vi.fn(async (ids: string[]) => ids),
}));

vi.mock("@/lib/server/user-notifications", () => ({
  createUserNotification: vi.fn(async () => undefined),
}));

async function readJson(resp: Response) {
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

describe("POST /api/trip-member-invites/[inviteId]/respond", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockReset();
    adminFrom.mockReset();
  });

  it("devuelve 400 si action es inválida", async () => {
    const { POST } = await import("../trip-member-invites/[inviteId]/respond/route");
    const resp = await POST(
      new Request("http://localhost/api/trip-member-invites/inv-1/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "maybe" }),
      }),
      { params: { inviteId: "inv-1" } }
    );
    expect(resp.status).toBe(400);
  });

  it("devuelve 404 si la invitación no existe", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null });
    adminFrom.mockImplementation((table: string) => {
      if (table === "trip_member_invites") {
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

    const { POST } = await import("../trip-member-invites/[inviteId]/respond/route");
    const resp = await POST(
      new Request("http://localhost/api/trip-member-invites/inv-1/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      }),
      { params: { inviteId: "inv-1" } }
    );
    expect(resp.status).toBe(404);
  });

  it("declina invitación pendiente", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u2" } }, error: null });
    const inviteRow = {
      id: "inv-1",
      trip_id: "t1",
      inviter_user_id: "u1",
      invitee_user_id: "u2",
      status: "pending",
      role: "viewer",
    };
    adminFrom.mockImplementation((table: string) => {
      if (table === "trip_member_invites") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: inviteRow, error: null })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        };
      }
      return {};
    });

    const { POST } = await import("../trip-member-invites/[inviteId]/respond/route");
    const resp = await POST(
      new Request("http://localhost/api/trip-member-invites/inv-1/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      }),
      { params: { inviteId: "inv-1" } }
    );
    expect(resp.status).toBe(200);
    const payload = await readJson(resp);
    expect(payload.status).toBe("declined");
  });
});
