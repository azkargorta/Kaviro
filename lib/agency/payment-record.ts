import type { PaymentPhase } from "@/lib/agency/payments";

export type AgencyPaymentMethod = "stripe" | "transfer" | "cash" | "bizum" | "other";

export const AGENCY_PAYMENT_METHOD_LABELS: Record<AgencyPaymentMethod, string> = {
  stripe: "Stripe (tarjeta)",
  transfer: "Transferencia",
  cash: "Efectivo",
  bizum: "Bizum",
  other: "Otro",
};

export type AgencyPaymentReceiptInfo = {
  paymentMethod: AgencyPaymentMethod | null;
  receiptPath: string | null;
  receiptName: string | null;
  receiptMime: string | null;
  receiptUrl: string | null;
  manualNotes: string | null;
  paidAt: string | null;
  recordedBy: string | null;
};

export function receiptFieldsForPhase(phase: PaymentPhase) {
  if (phase === "deposit") {
    return {
      method: "deposit_payment_method",
      path: "deposit_receipt_path",
      name: "deposit_receipt_name",
      mime: "deposit_receipt_mime",
      notes: "deposit_manual_notes",
      paidAt: "deposit_paid_at",
      recordedBy: "deposit_recorded_by",
      status: "deposit_status",
    } as const;
  }
  return {
    method: "final_payment_method",
    path: "final_receipt_path",
    name: "final_receipt_name",
    mime: "final_receipt_mime",
    notes: "final_manual_notes",
    paidAt: "final_paid_at",
    recordedBy: "final_recorded_by",
    status: "final_status",
  } as const;
}

export function installmentToReceiptInfo(
  inst: {
    paymentMethod?: AgencyPaymentMethod | null;
    receiptPath?: string | null;
    receiptName?: string | null;
    receiptMime?: string | null;
    manualNotes?: string | null;
    paidAt?: string | null;
    recordedBy?: string | null;
  },
  receiptUrl?: string | null
): AgencyPaymentReceiptInfo {
  return {
    paymentMethod: inst.paymentMethod ?? null,
    receiptPath: inst.receiptPath ?? null,
    receiptName: inst.receiptName ?? null,
    receiptMime: inst.receiptMime ?? null,
    receiptUrl: receiptUrl ?? null,
    manualNotes: inst.manualNotes ?? null,
    paidAt: inst.paidAt ?? null,
    recordedBy: inst.recordedBy ?? null,
  };
}

export function extractReceiptInfo(
  row: Record<string, unknown>,
  phase: PaymentPhase,
  receiptUrl?: string | null
): AgencyPaymentReceiptInfo {
  const f = receiptFieldsForPhase(phase);
  return {
    paymentMethod: (row[f.method] as AgencyPaymentMethod | null) ?? null,
    receiptPath: (row[f.path] as string | null) ?? null,
    receiptName: (row[f.name] as string | null) ?? null,
    receiptMime: (row[f.mime] as string | null) ?? null,
    receiptUrl: receiptUrl ?? null,
    manualNotes: (row[f.notes] as string | null) ?? null,
    paidAt: (row[f.paidAt] as string | null) ?? null,
    recordedBy: (row[f.recordedBy] as string | null) ?? null,
  };
}
