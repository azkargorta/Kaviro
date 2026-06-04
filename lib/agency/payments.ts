import { generatePretravelToken } from "@/lib/agency/pretravel-defaults";

export type PaymentPhase = "deposit" | "final";
export type PaymentLineStatus = "pending" | "paid" | "cancelled";

export type ParticipantPaymentSummary = {
  depositStatus: PaymentLineStatus;
  finalStatus: PaymentLineStatus;
  overall: "pending" | "deposit_paid" | "paid" | "cancelled";
};

export function computePaymentAmounts(pricePerPerson: number, depositPercent: number) {
  const price = Math.max(0, pricePerPerson);
  const pct = Math.min(100, Math.max(0, depositPercent));
  const deposit = Math.round(price * (pct / 100) * 100) / 100;
  const final = Math.round((price - deposit) * 100) / 100;
  return { deposit, final, total: price };
}

export function summarizeParticipantPayment(row: {
  deposit_status: string;
  final_status: string;
}): ParticipantPaymentSummary {
  const depositStatus = row.deposit_status as PaymentLineStatus;
  const finalStatus = row.final_status as PaymentLineStatus;

  if (depositStatus === "cancelled" || finalStatus === "cancelled") {
    return { depositStatus, finalStatus, overall: "cancelled" };
  }
  if (depositStatus === "paid" && finalStatus === "paid") {
    return { depositStatus, finalStatus, overall: "paid" };
  }
  if (depositStatus === "paid") {
    return { depositStatus, finalStatus, overall: "deposit_paid" };
  }
  return { depositStatus, finalStatus, overall: "pending" };
}

export const PAYMENT_OVERALL_LABELS: Record<ParticipantPaymentSummary["overall"], string> = {
  pending: "Pendiente",
  deposit_paid: "Señal pagada",
  paid: "Pagado",
  cancelled: "Cancelado",
};

export const PAYMENT_OVERALL_COLORS: Record<ParticipantPaymentSummary["overall"], string> = {
  pending: "bg-amber-500/15 text-amber-900 dark:text-amber-200",
  deposit_paid: "bg-sky-500/15 text-sky-900 dark:text-sky-200",
  paid: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  cancelled: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export function generatePayToken() {
  return generatePretravelToken();
}

export function payPublicPath(token: string) {
  return `/pay/${token}`;
}

export function formatMoney(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(amount);
}

export function tripPaymentsSummary(
  rows: Array<{
    deposit_status: string;
    final_status: string;
    deposit_amount: number;
    final_amount: number;
  }>
) {
  let collected = 0;
  let pending = 0;
  const counts = { pending: 0, deposit_paid: 0, paid: 0, cancelled: 0 };

  for (const r of rows) {
    const s = summarizeParticipantPayment(r);
    counts[s.overall] += 1;
    if (r.deposit_status === "paid") collected += Number(r.deposit_amount);
    else if (r.deposit_status !== "cancelled") pending += Number(r.deposit_amount);
    if (r.final_status === "paid") collected += Number(r.final_amount);
    else if (r.final_status !== "cancelled" && r.deposit_status === "paid") pending += Number(r.final_amount);
  }

  return { collected: Math.round(collected * 100) / 100, pending: Math.round(pending * 100) / 100, counts };
}
