import Link from "next/link";
import { getBudgetProgress, BUDGET_BAR_CLASS } from "@/lib/trip-budget-progress";

function formatMoney(amount: number, currency: string) {
  const c = (currency || "EUR").toUpperCase();
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${Math.round(amount)} ${c}`;
  }
}

type Props = {
  tripId: string;
  budgetTarget: number;
  totalSpent: number;
  currency: string;
  /** Si hay gastos en varias divisas, el total en moneda base puede ser aproximado */
  multiCurrency?: boolean;
};

export default function TripBudgetSummaryCard({
  tripId,
  budgetTarget,
  totalSpent,
  currency,
  multiCurrency = false,
}: Props) {
  const { pct, tone, overBudget } = getBudgetProgress(totalSpent, budgetTarget);
  const settingsHref = `/trip/${tripId}/settings`;

  return (
    <section className="rounded-3xl border border-amber-200/70 bg-gradient-to-b from-amber-50 via-white to-slate-50 p-5 shadow-md md:p-6 dark:border-[color:var(--brand-border)] dark:from-[var(--surface-card)] dark:via-[var(--surface-card)] dark:to-[var(--surface-card)]">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-800 dark:text-[var(--accent)]">
            Presupuesto del viaje
          </p>
          <p className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-slate-50">
            {overBudget ? "Por encima del objetivo" : pct >= 80 ? "Casi al límite" : "En buen camino"}
          </p>
        </div>
        <span className="text-2xl" aria-hidden>
          💰
        </span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Gastado vs objetivo
        </p>
        <p className="text-xs font-bold text-slate-700 tabular-nums dark:text-slate-200">{pct}%</p>
      </div>

      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden dark:bg-[#1E293B]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${BUDGET_BAR_CLASS[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-slate-600 dark:text-slate-400">
        <span>
          {formatMoney(totalSpent, currency)} gastado
          {multiCurrency ? " (aprox.)" : ""}
        </span>
        <span>de {formatMoney(budgetTarget, currency)}</span>
      </div>

      {overBudget && (
        <p className="mt-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
          Has superado el presupuesto objetivo. Revisa los gastos del grupo.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/trip/${tripId}/expenses`}
          className="inline-flex min-h-9 items-center justify-center rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--brand-hover)]"
        >
          Ver gastos
        </Link>
        <Link
          href={settingsHref}
          className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-[var(--border-default)] dark:bg-[var(--surface-page)] dark:text-slate-200"
        >
          Ajustar presupuesto
        </Link>
      </div>
    </section>
  );
}
