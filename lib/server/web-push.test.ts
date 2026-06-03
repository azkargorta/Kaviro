import { describe, expect, it } from "vitest";
import { latestPushSubscriptionPerUser } from "@/lib/server/web-push";

describe("latestPushSubscriptionPerUser", () => {
  it("keeps only the newest subscription per user", () => {
    const rows = latestPushSubscriptionPerUser([
      {
        user_id: "u1",
        endpoint: "https://old",
        p256dh: "a",
        auth: "b",
        updated_at: "2020-01-01T00:00:00Z",
      },
      {
        user_id: "u1",
        endpoint: "https://new",
        p256dh: "a",
        auth: "b",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        user_id: "u2",
        endpoint: "https://u2",
        p256dh: "x",
        auth: "y",
        updated_at: "2025-01-01T00:00:00Z",
      },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.user_id === "u1")?.endpoint).toBe("https://new");
    expect(rows.find((r) => r.user_id === "u2")?.endpoint).toBe("https://u2");
  });

  it("skips rows without keys", () => {
    const rows = latestPushSubscriptionPerUser([
      { user_id: "u1", endpoint: "https://x", p256dh: null, auth: "b" },
      {
        user_id: "u1",
        endpoint: "https://ok",
        p256dh: "a",
        auth: "b",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].endpoint).toBe("https://ok");
  });
});
