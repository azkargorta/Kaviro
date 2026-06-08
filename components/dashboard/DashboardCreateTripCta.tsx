"use client";

import { btnPrimary } from "@/components/ui/brandStyles";
import { openCreateTripForm } from "@/lib/open-create-trip";
import { canShowExpensesGroupCreation } from "@/lib/expenses-group-rollout";
import { Plus, Receipt } from "lucide-react";

type Props = {
  disabled?: boolean;
};

export default function DashboardCreateTripCta({ disabled }: Props) {
  const showExpensesGroup = canShowExpensesGroupCreation();

  if (!showExpensesGroup) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          openCreateTripForm({ mode: "travel" });
        }}
        className={`animate-dash-primary-once w-full motion-reduce:animate-none ${btnPrimary}`}
      >
        <Plus className="h-5 w-5 opacity-95" aria-hidden />
        Crear viaje
      </button>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          openCreateTripForm({ mode: "travel" });
        }}
        className={`animate-dash-primary-once motion-reduce:animate-none ${btnPrimary}`}
      >
        <Plus className="h-5 w-5 opacity-95" aria-hidden />
        Crear viaje
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          openCreateTripForm({ mode: "expenses" });
        }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-5 py-3.5 text-base font-bold text-emerald-900 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-50"
      >
        <Receipt className="h-5 w-5 opacity-90" aria-hidden />
        Grupo de gastos
      </button>
    </div>
  );
}
