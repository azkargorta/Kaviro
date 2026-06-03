"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  tripId: string;
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toFixed(0)} ${currency}`;
  }
}

export default function PlanExpenseFooter({ tripId }: Props) {
  const [total, setTotal] = useState<number | null>(null);
  const [currency, setCurrency] = useState("EUR");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/trip-expenses?tripId=${encodeURIComponent(tripId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((payload) => {
        if (cancelled) return;
        const expenses = Array.isArray(payload?.expenses) ? payload.expenses : [];
        const baseCurrency =
          typeof payload?.tripBaseCurrency === "string" && payload.tripBaseCurrency.trim()
            ? payload.tripBaseCurrency.trim()
            : "EUR";
        const sum = expenses.reduce((acc: number, row: { amount?: unknown }) => {
          const n = Number(row.amount);
          return acc + (Number.isFinite(n) ? n : 0);
        }, 0);
        setCurrency(baseCurrency);
        setTotal(sum);
      })
      .catch(() => {
        if (!cancelled) setTotal(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const label = loading ? "…" : total != null ? formatMoney(total, currency) : "—";

  return (
    <Link
      href={`/trip/${tripId}/expenses`}
      className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 transition hover:bg-slate-50/80 dark:border-[#1E293B] dark:hover:bg-[#080C14]"
    >
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gastos del grupo</span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1E293B]">
          <div
            className="h-full rounded-full bg-[var(--brand)] transition-all"
            style={{ width: total && total > 0 ? "min(100%, 60%)" : "0%" }}
          />
        </div>
        <span className="text-xs font-bold text-slate-700 tabular-nums dark:text-slate-200">{label}</span>
      </div>
    </Link>
  );
}
