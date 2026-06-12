import Link from "next/link";
import { ArrowRight, Plus, Wallet } from "lucide-react";
import { getBudgetProgress } from "@/lib/trip-budget-progress";
import { TRIP_TILE_CARD } from "@/components/trip/ui";

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
  budgetTarget?: number | null;
  totalSpent: number;
  expensesCount?: number;
  currency: string;
  /** Si hay gastos en varias divisas, el total en moneda base puede ser aproximado */
  multiCurrency?: boolean;
};

export default function TripBudgetSummaryCard({
  tripId,
  budgetTarget,
  totalSpent,
  expensesCount = 0,
  currency,
  multiCurrency = false,
}: Props) {
  const hasBudgetTarget = budgetTarget != null && budgetTarget > 0;
  const hasExpenses = totalSpent > 0 || expensesCount > 0;
  const expensesHref = `/trip/${tripId}/expenses`;
  const settingsHref = `/trip/${tripId}/settings#presupuesto`;

  if (!hasBudgetTarget) {
    return (
      <section
        className={`${TRIP_TILE_CARD} flex h-full flex-col p-4`}
        aria-label="Resumen de gastos"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[var(--brand)] ring-1 ring-slate-200/80 dark:bg-[#141c2b] dark:ring-slate-700">
            <Wallet className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Gastos del viaje
            </p>
            {hasExpenses ? (
              <>
                <p className="mt-1 text-xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                  {formatMoney(totalSpent, currency)}
                  {multiCurrency ? <span className="text-xs font-semibold text-slate-400"> aprox.</span> : null}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {expensesCount === 1 ? "1 gasto registrado" : `${expensesCount} gastos registrados`}
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                  Todavía no hay gastos registrados
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Añade el primer gasto del viaje
                </p>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Link
            href={expensesHref}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] px-3 text-xs font-bold text-white transition hover:bg-[var(--brand-hover)]"
          >
            {hasExpenses ? (
              <>
                Ver gastos
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Añadir gasto
              </>
            )}
          </Link>
          <Link
            href={settingsHref}
            className="text-center text-[11px] font-semibold text-slate-500 transition hover:text-[var(--brand)] dark:text-slate-400"
          >
            Definir presupuesto objetivo
          </Link>
        </div>
      </section>
    );
  }

  const { pct, barWidthPct, barColor, overBudget } = getBudgetProgress(totalSpent, budgetTarget!);

  return (
    <section
      className={`${TRIP_TILE_CARD} flex h-full flex-col p-4`}
      aria-label="Presupuesto del viaje"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-light)] text-[var(--brand)] ring-1 ring-[var(--brand-border)]">
          <Wallet className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Presupuesto
          </p>
          <p className="mt-1 text-lg font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
            {formatMoney(totalSpent, currency)}
            {multiCurrency ? <span className="text-xs font-semibold text-slate-400"> aprox.</span> : null}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            de {formatMoney(budgetTarget!, currency)}
            {expensesCount > 0 ? ` · ${expensesCount} gasto${expensesCount !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          <span>{overBudget ? "Por encima" : pct >= 80 ? "Casi al límite" : "Progreso"}</span>
          <span className={overBudget ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-200"}>
            {pct}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1E293B]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${barWidthPct}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      {overBudget ? (
        <p className="mt-2 text-[11px] font-medium leading-snug text-rose-700 dark:text-rose-400">
          Has superado el objetivo. Revisa los gastos del grupo.
        </p>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <Link
          href={expensesHref}
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] px-3 text-xs font-bold text-white transition hover:bg-[var(--brand-hover)]"
        >
          Ver gastos
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link
          href={settingsHref}
          className="text-center text-[11px] font-semibold text-slate-500 transition hover:text-[var(--brand)] dark:text-slate-400"
        >
          Ajustar presupuesto
        </Link>
      </div>
    </section>
  );
}
