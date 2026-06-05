import { describe, expect, it } from "vitest";
import {
  getPaymentInstallments,
  legacyPatchFromInstallments,
  mergePlanWithExisting,
  scheduleTotal,
} from "@/lib/agency/payment-schedule";

describe("payment-schedule", () => {
  it("deriva cuotas legacy desde columnas deposit/final", () => {
    const installments = getPaymentInstallments({
      deposit_amount: 400,
      final_amount: 600,
      deposit_status: "paid",
      final_status: "pending",
      deposit_due_at: "2026-03-01",
      final_due_at: "2026-06-01",
    });
    expect(installments).toHaveLength(2);
    expect(installments[0]?.amount).toBe(400);
    expect(installments[0]?.status).toBe("paid");
    expect(scheduleTotal(installments)).toBe(1000);
  });

  it("sincroniza columnas legacy al guardar plan con tres cuotas", () => {
    const merged = mergePlanWithExisting(
      [
        {
          id: "a",
          label: "Señal",
          amount: 300,
          dueAt: "2026-01-01",
          status: "paid",
          paidAt: "2026-01-02",
          paymentMethod: "transfer",
        },
        {
          id: "b",
          label: "Cuota 2",
          amount: 350,
          dueAt: "2026-04-01",
          status: "pending",
        },
        {
          id: "c",
          label: "Cuota 3",
          amount: 350,
          dueAt: "2026-06-01",
          status: "pending",
        },
      ],
      [
        { id: "a", label: "Señal", amount: 500, dueAt: "2026-01-01" },
        { id: "b", label: "Cuota 2", amount: 350, dueAt: "2026-04-01" },
        { id: "c", label: "Cuota 3", amount: 350, dueAt: "2026-06-01" },
      ]
    );

    const patch = legacyPatchFromInstallments(merged);
    expect(patch.price_per_person).toBe(1200);
    expect(patch.deposit_amount).toBe(500);
    expect(patch.final_amount).toBe(700);
    expect(patch.deposit_status).toBe("paid");
    expect(patch.final_status).toBe("pending");
    expect((patch.payment_schedule as { installments: unknown[] }).installments).toHaveLength(3);
  });
});
