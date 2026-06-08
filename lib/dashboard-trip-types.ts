export type DashboardTrip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string | null;
  created_at?: string | null;
  is_favorite?: boolean;
  agency_id?: string | null;
  trip_mode?: "travel" | "expenses" | string | null;
};

/** Clases para la pastilla de estado en tarjetas del dashboard (incluye texto en modo oscuro). */
export const DASHBOARD_TRIP_BADGE_ACCENTS = {
  current:
    "from-emerald-100 to-teal-50 border-emerald-200 text-emerald-900 dark:from-emerald-950/80 dark:to-teal-950/60 dark:border-emerald-500/45 dark:text-emerald-100",
  future:
    "from-[var(--brand-light)] to-slate-50 border-[var(--brand-border)] text-[var(--brand-text)] dark:from-[var(--brand)]/20 dark:to-slate-900/80 dark:border-[var(--brand-border)]/50 dark:text-[var(--brand-light)]",
  past: "from-slate-100 to-slate-50 border-slate-200 text-slate-800 dark:from-slate-800/90 dark:to-slate-900/70 dark:border-slate-600 dark:text-slate-200",
  unscheduled:
    "from-amber-100 to-orange-50 border-amber-200 text-amber-950 dark:from-amber-950/70 dark:to-orange-950/50 dark:border-amber-500/40 dark:text-amber-100",
  expenseGroup:
    "from-emerald-100 to-teal-50 border-emerald-200 text-emerald-900 dark:from-emerald-950/80 dark:to-teal-950/60 dark:border-emerald-500/45 dark:text-emerald-100",
} as const;

export const DASHBOARD_EXPENSE_GROUP_ACCENT = DASHBOARD_TRIP_BADGE_ACCENTS.expenseGroup;

export function isExpenseGroupTrip(trip: Pick<DashboardTrip, "trip_mode">): boolean {
  return trip.trip_mode === "expenses";
}

export function splitDashboardTrips(trips: DashboardTrip[]) {
  const expenseGroups = trips.filter(isExpenseGroupTrip);
  const travelTrips = trips.filter((t) => !isExpenseGroupTrip(t));
  return { expenseGroups, travelTrips };
}
