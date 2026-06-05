import type { AgencyPaymentMethod } from "@/lib/agency/payment-record";
import type { PaymentLineStatus } from "@/lib/agency/payments";
import { computePaymentAmounts } from "@/lib/agency/payments";

export type PaymentInstallment = {
  id: string;
  label: string;
  amount: number;
  dueAt: string | null;
  status: PaymentLineStatus;
  paidAt?: string | null;
  paymentMethod?: AgencyPaymentMethod | null;
  receiptPath?: string | null;
  receiptName?: string | null;
  receiptMime?: string | null;
  manualNotes?: string | null;
  recordedBy?: string | null;
  stripeSessionId?: string | null;
};

export type PaymentScheduleRow = {
  price_per_person?: number | string | null;
  deposit_percent?: number | string | null;
  deposit_amount?: number | string | null;
  final_amount?: number | string | null;
  deposit_status?: string | null;
  final_status?: string | null;
  deposit_due_at?: string | null;
  final_due_at?: string | null;
  deposit_paid_at?: string | null;
  final_paid_at?: string | null;
  deposit_payment_method?: string | null;
  final_payment_method?: string | null;
  deposit_stripe_session_id?: string | null;
  final_stripe_session_id?: string | null;
  deposit_receipt_path?: string | null;
  deposit_receipt_name?: string | null;
  deposit_receipt_mime?: string | null;
  deposit_manual_notes?: string | null;
  deposit_recorded_by?: string | null;
  final_receipt_path?: string | null;
  final_receipt_name?: string | null;
  final_receipt_mime?: string | null;
  final_manual_notes?: string | null;
  final_recorded_by?: string | null;
  payment_schedule?: unknown;
};

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

function newInstallmentId() {
  return crypto.randomUUID();
}

export function defaultInstallmentsFromAmounts(opts: {
  pricePerPerson: number;
  depositPercent: number;
  depositDueAt?: string | null;
  finalDueAt?: string | null;
}): PaymentInstallment[] {
  const { deposit, final } = computePaymentAmounts(opts.pricePerPerson, opts.depositPercent);
  return [
    {
      id: newInstallmentId(),
      label: "Señal",
      amount: deposit,
      dueAt: opts.depositDueAt?.slice(0, 10) ?? null,
      status: "pending",
    },
    {
      id: newInstallmentId(),
      label: "Pago final",
      amount: final,
      dueAt: opts.finalDueAt?.slice(0, 10) ?? null,
      status: "pending",
    },
  ];
}

function legacyInstallments(row: PaymentScheduleRow): PaymentInstallment[] {
  return [
    {
      id: "legacy-deposit",
      label: "Señal",
      amount: Number(row.deposit_amount) || 0,
      dueAt: row.deposit_due_at?.slice(0, 10) ?? null,
      status: (row.deposit_status as PaymentLineStatus) || "pending",
      paidAt: row.deposit_paid_at ?? null,
      paymentMethod: (row.deposit_payment_method as AgencyPaymentMethod) ?? null,
      receiptPath: row.deposit_receipt_path ?? null,
      receiptName: row.deposit_receipt_name ?? null,
      receiptMime: row.deposit_receipt_mime ?? null,
      manualNotes: row.deposit_manual_notes ?? null,
      recordedBy: row.deposit_recorded_by ?? null,
      stripeSessionId: row.deposit_stripe_session_id ?? null,
    },
    {
      id: "legacy-final",
      label: "Pago final",
      amount: Number(row.final_amount) || 0,
      dueAt: row.final_due_at?.slice(0, 10) ?? null,
      status: (row.final_status as PaymentLineStatus) || "pending",
      paidAt: row.final_paid_at ?? null,
      paymentMethod: (row.final_payment_method as AgencyPaymentMethod) ?? null,
      receiptPath: row.final_receipt_path ?? null,
      receiptName: row.final_receipt_name ?? null,
      receiptMime: row.final_receipt_mime ?? null,
      manualNotes: row.final_manual_notes ?? null,
      recordedBy: row.final_recorded_by ?? null,
      stripeSessionId: row.final_stripe_session_id ?? null,
    },
  ];
}

function parseScheduleJson(raw: unknown): PaymentInstallment[] | null {
  if (!raw || typeof raw !== "object") return null;
  const installments = (raw as { installments?: unknown }).installments;
  if (!Array.isArray(installments) || !installments.length) return null;

  const parsed: PaymentInstallment[] = [];
  for (const item of installments) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const amount = Number(o.amount);
    if (!Number.isFinite(amount) || amount < 0) continue;
    parsed.push({
      id: typeof o.id === "string" && o.id ? o.id : newInstallmentId(),
      label: typeof o.label === "string" && o.label.trim() ? o.label.trim() : `Cuota ${parsed.length + 1}`,
      amount: roundMoney(amount),
      dueAt: typeof o.dueAt === "string" ? o.dueAt.slice(0, 10) : null,
      status: (o.status as PaymentLineStatus) || "pending",
      paidAt: typeof o.paidAt === "string" ? o.paidAt : null,
      paymentMethod: (o.paymentMethod as AgencyPaymentMethod) ?? null,
      receiptPath: typeof o.receiptPath === "string" ? o.receiptPath : null,
      receiptName: typeof o.receiptName === "string" ? o.receiptName : null,
      receiptMime: typeof o.receiptMime === "string" ? o.receiptMime : null,
      manualNotes: typeof o.manualNotes === "string" ? o.manualNotes : null,
      recordedBy: typeof o.recordedBy === "string" ? o.recordedBy : null,
      stripeSessionId: typeof o.stripeSessionId === "string" ? o.stripeSessionId : null,
    });
  }
  return parsed.length ? parsed : null;
}

export function getPaymentInstallments(row: PaymentScheduleRow): PaymentInstallment[] {
  const fromJson = parseScheduleJson(row.payment_schedule);
  if (fromJson) return fromJson;
  return legacyInstallments(row);
}

export function scheduleTotal(installments: PaymentInstallment[]) {
  return roundMoney(installments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0));
}

/** Sincroniza columnas legacy (señal + pago final Stripe) desde el plan de cuotas. */
export function legacyPatchFromInstallments(installments: PaymentInstallment[]) {
  const first = installments[0];
  const rest = installments.slice(1);
  const price = scheduleTotal(installments);

  const depositAmount = first ? roundMoney(first.amount) : 0;
  const finalAmount = roundMoney(rest.reduce((s, i) => s + i.amount, 0));

  const depositStatus = first?.status ?? "pending";
  const finalStatus =
    rest.length === 0
      ? "paid"
      : rest.every((i) => i.status === "paid")
        ? "paid"
        : rest.some((i) => i.status === "cancelled")
          ? "cancelled"
          : "pending";

  return {
    price_per_person: price,
    deposit_amount: depositAmount,
    final_amount: finalAmount,
    deposit_status: depositStatus,
    final_status: finalStatus,
    deposit_due_at: first?.dueAt ?? null,
    final_due_at: rest[rest.length - 1]?.dueAt ?? rest[0]?.dueAt ?? null,
    deposit_paid_at: first?.paidAt ?? null,
    final_paid_at:
      rest.length && rest.every((i) => i.status === "paid")
        ? rest[rest.length - 1]?.paidAt ?? null
        : null,
    deposit_payment_method: first?.paymentMethod ?? null,
    final_payment_method:
      rest.length === 1 ? rest[0]?.paymentMethod ?? null : rest.find((i) => i.paymentMethod)?.paymentMethod ?? null,
    deposit_stripe_session_id: first?.stripeSessionId ?? null,
    final_stripe_session_id: rest.length === 1 ? rest[0]?.stripeSessionId ?? null : null,
    deposit_receipt_path: first?.receiptPath ?? null,
    deposit_receipt_name: first?.receiptName ?? null,
    deposit_receipt_mime: first?.receiptMime ?? null,
    deposit_manual_notes: first?.manualNotes ?? null,
    deposit_recorded_by: first?.recordedBy ?? null,
    final_receipt_path: rest.length === 1 ? rest[0]?.receiptPath ?? null : null,
    final_receipt_name: rest.length === 1 ? rest[0]?.receiptName ?? null : null,
    final_receipt_mime: rest.length === 1 ? rest[0]?.receiptMime ?? null : null,
    final_manual_notes: rest.length === 1 ? rest[0]?.manualNotes ?? null : null,
    final_recorded_by: rest.length === 1 ? rest[0]?.recordedBy ?? null : null,
    payment_schedule: { installments },
  };
}

export function findInstallment(
  installments: PaymentInstallment[],
  opts: { installmentId?: string; phase?: "deposit" | "final" }
) {
  if (opts.installmentId) {
    return installments.find((i) => i.id === opts.installmentId) ?? null;
  }
  if (opts.phase === "deposit") return installments[0] ?? null;
  if (opts.phase === "final") return installments[1] ?? installments[installments.length - 1] ?? null;
  return null;
}

export type PlanInstallmentInput = {
  id?: string;
  label: string;
  amount: number;
  dueAt?: string | null;
};

export function mergePlanWithExisting(
  existing: PaymentInstallment[],
  inputs: PlanInstallmentInput[]
): PaymentInstallment[] {
  const byId = new Map(existing.map((i) => [i.id, i]));

  return inputs.map((input, index) => {
    const prev = input.id ? byId.get(input.id) : undefined;
    const amount = roundMoney(Number(input.amount));
    return {
      id: input.id && byId.has(input.id) ? input.id : newInstallmentId(),
      label: input.label.trim() || `Cuota ${index + 1}`,
      amount,
      dueAt: input.dueAt?.slice(0, 10) ?? null,
      status: prev?.status ?? "pending",
      paidAt: prev?.paidAt ?? null,
      paymentMethod: prev?.paymentMethod ?? null,
      receiptPath: prev?.receiptPath ?? null,
      receiptName: prev?.receiptName ?? null,
      receiptMime: prev?.receiptMime ?? null,
      manualNotes: prev?.manualNotes ?? null,
      recordedBy: prev?.recordedBy ?? null,
      stripeSessionId: prev?.stripeSessionId ?? null,
    };
  });
}

export function summarizeInstallments(installments: PaymentInstallment[]) {
  const cancelled = installments.some((i) => i.status === "cancelled");
  const paidCount = installments.filter((i) => i.status === "paid").length;
  const total = installments.length;

  if (cancelled) {
    return {
      overall: "cancelled" as const,
      depositStatus: (installments[0]?.status ?? "pending") as PaymentLineStatus,
      finalStatus: (installments[1]?.status ?? "pending") as PaymentLineStatus,
    };
  }
  if (paidCount === total && total > 0) {
    return {
      overall: "paid" as const,
      depositStatus: "paid" as const,
      finalStatus: "paid" as const,
    };
  }
  if (paidCount > 0) {
    return {
      overall: "deposit_paid" as const,
      depositStatus: (installments[0]?.status ?? "pending") as PaymentLineStatus,
      finalStatus: (installments[1]?.status ?? "pending") as PaymentLineStatus,
    };
  }
  return {
    overall: "pending" as const,
    depositStatus: "pending" as const,
    finalStatus: "pending" as const,
  };
}
