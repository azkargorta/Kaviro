import { describe, expect, it } from "vitest";
import { buildParticipantPaymentBreakdown } from "@/lib/agency/payment-breakdown";

describe("buildParticipantPaymentBreakdown", () => {
  it("detecta Stripe en pagos históricos sin payment_method", () => {
    const breakdown = buildParticipantPaymentBreakdown({
      deposit_amount: 300,
      final_amount: 700,
      deposit_status: "paid",
      final_status: "pending",
      deposit_stripe_session_id: "cs_test_123",
      final_stripe_session_id: null,
    });

    expect(breakdown.collected).toBe(300);
    expect(breakdown.pending).toBe(700);
    expect(breakdown.lines[0]?.paymentMethod).toBe("stripe");
    expect(breakdown.lines[0]?.isPaid).toBe(true);
  });
});
