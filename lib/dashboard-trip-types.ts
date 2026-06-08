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

export const DASHBOARD_EXPENSE_GROUP_ACCENT =
  "from-emerald-100 to-teal-50 border-emerald-200";

export function isExpenseGroupTrip(trip: Pick<DashboardTrip, "trip_mode">): boolean {
  return trip.trip_mode === "expenses";
}

export function splitDashboardTrips(trips: DashboardTrip[]) {
  const expenseGroups = trips.filter(isExpenseGroupTrip);
  const travelTrips = trips.filter((t) => !isExpenseGroupTrip(t));
  return { expenseGroups, travelTrips };
}
