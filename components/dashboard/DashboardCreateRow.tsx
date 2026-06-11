"use client";

import Link from "next/link";
import { Plus, Receipt, Sparkles } from "lucide-react";
import { openCreateTripForm } from "@/lib/open-create-trip";
import { canShowExpensesGroupCreation } from "@/lib/expenses-group-rollout";

type Props = {
  disabled?: boolean;
};

const ACTION_SECONDARY =
  "inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 sm:text-sm dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-[#141c2b]";

export default function DashboardCreateRow({ disabled = false }: Props) {
  const showExpenses = canShowExpensesGroupCreation();

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Acciones rápidas">
      <Link
        href="/trips/new/planner"
        className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-light)] px-3 py-2 text-xs font-semibold text-[var(--brand-text)] shadow-sm transition hover:border-[var(--brand)] hover:bg-[var(--brand-light)] active:scale-[0.99] sm:min-w-[10rem] sm:flex-none sm:text-sm"
        aria-label="Planificar viaje con IA"
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--brand)]" aria-hidden />
        <span>Planificar con IA</span>
      </Link>

      <button
        type="button"
        disabled={disabled}
        onClick={() => openCreateTripForm({ mode: "travel" })}
        className={ACTION_SECONDARY}
      >
        <Plus className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
        <span>Crear viaje</span>
      </button>

      {showExpenses ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => openCreateTripForm({ mode: "expenses" })}
          className={ACTION_SECONDARY}
        >
          <Receipt className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
          <span>Grupo de gastos</span>
        </button>
      ) : null}
    </div>
  );
}
