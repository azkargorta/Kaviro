import {
  AGENCY_PAYMENT_METHOD_LABELS,
  type AgencyPaymentMethod,
} from "@/lib/agency/payment-record";
import type { PaymentLineStatus } from "@/lib/agency/payments";
import { formatMoney } from "@/lib/agency/payments";
import { getPaymentInstallments, type PaymentScheduleRow } from "@/lib/agency/payment-schedule";

export type PaymentLineDetail = {
  installmentId: string;
  label: string;
  amount: number;
  dueAt: string | null;
  status: PaymentLineStatus;
  paymentMethod: AgencyPaymentMethod | null;
  paymentMethodLabel: string | null;
  paidAt: string | null;
  isPaid: boolean;
};

export type ParticipantPaymentBreakdown = {
  collected: number;
  pending: number;
  total: number;
  lines: PaymentLineDetail[];
};

function resolveInstallmentPaymentMethod(inst: {
  status: PaymentLineStatus;
  paymentMethod?: AgencyPaymentMethod | null;
  stripeSessionId?: string | null;
}): AgencyPaymentMethod | null {
  if (inst.paymentMethod) return inst.paymentMethod;
  if (inst.status === "paid" && inst.stripeSessionId) return "stripe";
  return null;
}

export function buildParticipantPaymentBreakdown(row: PaymentScheduleRow): ParticipantPaymentBreakdown {
  const installments = getPaymentInstallments(row);
  let collected = 0;
  let pending = 0;

  const lines: PaymentLineDetail[] = installments.map((inst) => {
    const isPaid = inst.status === "paid";
    const isCancelled = inst.status === "cancelled";
    if (isPaid) collected += inst.amount;
    else if (!isCancelled) pending += inst.amount;

    const paymentMethod = resolveInstallmentPaymentMethod(inst);

    return {
      installmentId: inst.id,
      label: inst.label,
      amount: inst.amount,
      dueAt: inst.dueAt,
      status: inst.status,
      paymentMethod,
      paymentMethodLabel: paymentMethod ? AGENCY_PAYMENT_METHOD_LABELS[paymentMethod] : null,
      paidAt: inst.paidAt ?? null,
      isPaid,
    };
  });

  return {
    collected: Math.round(collected * 100) / 100,
    pending: Math.round(pending * 100) / 100,
    total: Math.round((collected + pending) * 100) / 100,
    lines,
  };
}

export function formatCollectedSummary(breakdown: ParticipantPaymentBreakdown, currency: string) {
  if (breakdown.collected <= 0 && breakdown.pending <= 0) return null;
  const parts: string[] = [];
  if (breakdown.total > 0) {
    parts.push(`Total ${formatMoney(breakdown.total, currency)}`);
  }
  if (breakdown.collected > 0) {
    parts.push(`Cobrado ${formatMoney(breakdown.collected, currency)}`);
  }
  if (breakdown.pending > 0) {
    parts.push(`Pendiente ${formatMoney(breakdown.pending, currency)}`);
  }
  return parts.join(" · ");
}
