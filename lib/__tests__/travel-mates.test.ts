import { describe, expect, it } from "vitest";
import { memberInvitePermissions } from "@/lib/travel-mates";

describe("travel-mates helpers", () => {
  it("memberInvitePermissions normaliza rol viewer", () => {
    const perms = memberInvitePermissions("viewer");
    expect(perms).toBeTruthy();
    expect(typeof perms).toBe("object");
  });
});
