import { describe, expect, it } from "vitest";
import { eventEnabledForSettings, isAgencyEmailEvent } from "@/lib/agency/email-events";

describe("isAgencyEmailEvent", () => {
  it("accepts deposit_reminder", () => {
    expect(isAgencyEmailEvent("deposit_reminder")).toBe(true);
  });
});

describe("eventEnabledForSettings", () => {
  it("respects nps toggle", () => {
    expect(
      eventEnabledForSettings("nps_invite", {
        remindDeposit: true,
        remindFinal: true,
        pretravelInvite: true,
        npsInvite: false,
        signatureInvite: true,
      })
    ).toBe(false);
  });
});
