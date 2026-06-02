import type { SupabaseClient } from "@supabase/supabase-js";

export type PublicRecapStats = {
  activitiesCount: number;
  participantsCount: number;
  expensesCount: number;
  routesCount: number;
  totalSpent: number;
  currency: string;
};

export async function loadPublicRecapStats(
  client: SupabaseClient,
  tripId: string,
  baseCurrency: string
): Promise<PublicRecapStats> {
  const currency = (baseCurrency || "EUR").toUpperCase();
  const [
    { count: activitiesCount },
    { count: participantsCount },
    { count: expensesCount },
    { count: routesCount },
    { data: expenseRows },
  ] = await Promise.all([
    client.from("trip_activities").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
    client
      .from("trip_participants")
      .select("id", { count: "exact", head: true })
      .eq("trip_id", tripId)
      .neq("status", "removed"),
    client.from("trip_expenses").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
    client.from("trip_routes").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
    client.from("trip_expenses").select("amount, currency").eq("trip_id", tripId).limit(2000),
  ]);

  let totalSpent = 0;
  for (const row of expenseRows ?? []) {
    const n = Number((row as { amount?: unknown }).amount);
    const cur = String((row as { currency?: string | null }).currency || currency).toUpperCase();
    if (Number.isFinite(n) && cur === currency) totalSpent += n;
  }

  return {
    activitiesCount: activitiesCount ?? 0,
    participantsCount: participantsCount ?? 0,
    expensesCount: expensesCount ?? 0,
    routesCount: routesCount ?? 0,
    totalSpent,
    currency,
  };
}
