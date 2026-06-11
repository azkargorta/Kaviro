"use client";

import Link from "next/link";
import { Plus, Receipt, Sparkles } from "lucide-react";
import { openCreateTripForm } from "@/lib/open-create-trip";
import { canShowExpensesGroupCreation } from "@/lib/expenses-group-rollout";

type Props = {
  disabled?: boolean;
};

const CARD_BASE =
  "group flex min-h-[52px] flex-1 items-center justify-center gap-2.5 rounded-xl border bg-white px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:bg-[#0F1623]";

export default function DashboardCreateRow({ disabled = false }: Props) {
  const showExpenses = canShowExpensesGroupCreation();

  return (
    <div className="flex flex-wrap gap-2">
      {/* IA Planner */}
      <Link
        href="/trips/new/planner"
        className={`${CARD_BASE} border-[var(--brand-border)] bg-[var(--brand-light)] text-[var(--brand-text)] hover:border-[var(--brand)]`}
        aria-label="Planificar viaje con IA"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden />
        <span>Planificar con IA</span>
      </Link>

      {/* Viaje manual */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => openCreateTripForm({ mode: "travel" })}
        className={`${CARD_BASE} border-slate-200 text-slate-700 hover:border-slate-300 dark:border-[#1E293B] dark:text-slate-200`}
      >
        <Plus className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" aria-hidden />
        <span>Crear viaje</span>
      </button>

      {/* Grupo de gastos */}
      {showExpenses ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => openCreateTripForm({ mode: "expenses" })}
          className={`${CARD_BASE} border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300`}
        >
          <Receipt className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
          <span>Grupo de gastos</span>
        </button>
      ) : null}
    </div>
  );
}
