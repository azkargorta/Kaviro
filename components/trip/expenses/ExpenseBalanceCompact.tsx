"use client";

import type { BalanceRow, SettlementSuggestion } from "@/lib/expense-balance";
import { MessageCircle } from "lucide-react";

function formatMoney(value: number, currency?: string | null) {
  const code = (currency || "EUR").toUpperCase().trim();
  const safe = /^[A-Z]{3}$/.test(code) ? code : "EUR";
  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: safe,
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    return `${(value || 0).toFixed(2)} €`;
  }
}

type Props = {
  balances: BalanceRow[];
  settlements: SettlementSuggestion[];
  balanceCurrency: string;
  createWhatsAppLink: (settlement: SettlementSuggestion) => string;
};

export default function ExpenseBalanceCompact({
  balances,
  settlements,
  balanceCurrency,
  createWhatsAppLink,
}: Props) {
  const pending = settlements.filter((s) => s.status !== "paid").slice(0, 5);

  if (!balances.length && !pending.length) return null;

  return (
    <section
      className="rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50/90 to-white p-3 shadow-sm dark:border-sky-900/35 dark:from-sky-950/25 dark:to-[#0F1623] md:hidden"
      data-tour="expenses-balance-compact"
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-sky-800 dark:text-sky-300">
        Balances del grupo
      </p>

      {balances.length > 0 ? (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {balances.map((row) => {
            const bal = Number(row.balance || 0);
            const positive = bal >= 0;
            return (
              <div
                key={row.person}
                className="min-w-[108px] shrink-0 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-[#334155] dark:bg-[#080C14]"
              >
                <p className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {row.person}
                </p>
                <p
                  className={`mt-0.5 text-sm font-black tabular-nums ${
                    positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {positive ? "+" : ""}
                  {formatMoney(bal, balanceCurrency)}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      {pending.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Pagos pendientes
          </p>
          <div className="flex flex-col gap-1.5">
            {pending.map((s, idx) => (
              <div
                key={`${s.debtor_name}-${s.creditor_name}-${idx}`}
                className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 dark:border-[#334155] dark:bg-[#080C14]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {s.debtor_name} → {s.creditor_name}
                  </p>
                  <p className="text-[11px] font-bold tabular-nums text-[var(--brand)]">
                    {formatMoney(Number(s.amount || 0), s.currency || balanceCurrency)}
                  </p>
                </div>
                <a
                  href={createWhatsAppLink(s)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-600"
                  aria-label={`Recordar pago a ${s.creditor_name}`}
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
