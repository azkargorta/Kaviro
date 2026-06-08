"use client";

import { Receipt } from "lucide-react";
import DashboardTripSection from "@/components/dashboard/DashboardTripSection";
import { openCreateTripForm } from "@/lib/open-create-trip";
import type { DashboardTrip } from "@/lib/dashboard-trip-types";
import { DASHBOARD_EXPENSE_GROUP_ACCENT } from "@/lib/dashboard-trip-types";

export default function DashboardExpenseGroupsSection({
  trips,
  lockedTripIds,
}: {
  trips: DashboardTrip[];
  lockedTripIds: string[];
}) {
  if (trips.length === 0) {
    return (
      <section className="mx-auto max-w-2xl space-y-3">
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-emerald-400/20 dark:from-emerald-950/20 dark:to-[#0F1623]">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-emerald-900 sm:text-lg dark:text-emerald-300">
              <Receipt className="h-5 w-5" aria-hidden />
              Grupos de gastos
            </h2>
            <p className="mt-0.5 text-xs text-emerald-800/70 sm:text-sm dark:text-emerald-400/70">
              Reparte gastos entre amigos sin plan ni mapa. Puedes marcarlos como favoritos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreateTripForm({ mode: "expenses" })}
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-900 transition hover:bg-emerald-200 sm:text-sm dark:border-emerald-400/30 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            Crear grupo
          </button>
        </div>
      </section>
    );
  }

  return (
    <DashboardTripSection
      title="Grupos de gastos"
      subtitle="Reparto de gastos compartidos, con o sin fechas."
      trips={trips}
      badge="Grupo"
      accent={DASHBOARD_EXPENSE_GROUP_ACCENT}
      lockedTripIds={lockedTripIds}
    />
  );
}
