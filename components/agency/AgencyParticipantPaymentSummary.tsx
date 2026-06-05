"use client";

import type { ParticipantPaymentBreakdown } from "@/lib/agency/payment-breakdown";
import { formatCollectedSummary } from "@/lib/agency/payment-breakdown";
import { formatMoney } from "@/lib/agency/payments";
import { CreditCard } from "lucide-react";

export default function AgencyParticipantPaymentSummary({
  breakdown,
  currency,
}: {
  breakdown: ParticipantPaymentBreakdown;
  currency: string;
}) {
  const headline = formatCollectedSummary(breakdown, currency);
  if (!headline && breakdown.lines.every((l) => !l.isPaid && l.status === "pending")) {
    return null;
  }

  return (
    <div className="mt-1.5 space-y-1 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900/40">
      {headline ? (
        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{headline}</p>
      ) : null}
      <ul className="space-y-0.5">
        {breakdown.lines.map((line) => (
          <li key={line.installmentId} className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px]">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{line.label}</span>
            <span className="tabular-nums text-slate-600 dark:text-slate-400">
              {formatMoney(line.amount, currency)}
            </span>
            {line.dueAt ? (
              <span className="text-slate-400">vence {line.dueAt}</span>
            ) : null}
            <span className="text-slate-400">—</span>
            {line.isPaid ? (
              <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1 py-px font-bold text-emerald-800 dark:text-emerald-300">
                Pagado
                {line.paymentMethod === "stripe" ? (
                  <CreditCard className="h-2.5 w-2.5" aria-hidden />
                ) : null}
              </span>
            ) : line.status === "cancelled" ? (
              <span className="font-semibold text-slate-500">Cancelado</span>
            ) : (
              <span className="font-semibold text-amber-700 dark:text-amber-300">Pendiente</span>
            )}
            {line.paymentMethodLabel && line.paymentMethod !== "stripe" ? (
              <span className="text-slate-500">({line.paymentMethodLabel})</span>
            ) : line.paymentMethod === "stripe" ? (
              <span className="text-slate-500">(Stripe)</span>
            ) : null}
            {line.paidAt ? (
              <span className="text-slate-400">· {line.paidAt.slice(0, 10)}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
