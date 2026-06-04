import { describe, expect, it } from "vitest";
import { computePaymentAmounts, summarizeParticipantPayment } from "@/lib/agency/payments";

describe("computePaymentAmounts", () => {
  it("splits deposit and final", () => {
    expect(computePaymentAmounts(1000, 30)).toEqual({ deposit: 300, final: 700, total: 1000 });
  });
});

describe("summarizeParticipantPayment", () => {
  it("detects deposit_paid", () => {
    expect(
      summarizeParticipantPayment({ deposit_status: "paid", final_status: "pending" }).overall
    ).toBe("deposit_paid");
  });
});
