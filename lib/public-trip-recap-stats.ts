import type { SupabaseClient } from "@supabase/supabase-js";
import { computeExpenseTotalsInBase } from "@/lib/trip-expense-totals";

export type PublicRecapStats = {
  activitiesCount: number;
  participantsCount: number;
  expensesCount: number;
  routesCount: number;
  totalSpent: number;
  currency: string;
  /** Suma aproximada de distancias parseadas desde trip_routes.distance_text (km) */
  routesDistanceKm: number | null;
};

function parseDistanceKm(text: string | null | undefined): number | null {
  if (!text || typeof text !== "string") return null;
  const normalized = text.replace(",", ".").toLowerCase();
  const km = normalized.match(/([\d.]+)\s*km/);
  if (km) {
    const n = Number(km[1]);
    return Number.isFinite(n) ? n : null;
  }
  const mi = normalized.match(/([\d.]+)\s*mi/);
  if (mi) {
    const n = Number(mi[1]);
    return Number.isFinite(n) ? n * 1.60934 : null;
  }
  return null;
}

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
    { data: routeRows },
  ] = await Promise.all([
    client.from("trip_activities").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
    client
      .from("trip_participants")
      .select("id", { count: "exact", head: true })
      .eq("trip_id", tripId)
      .neq("status", "removed"),
    client.from("trip_expenses").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
    client.from("trip_routes").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
    client
      .from("trip_expenses")
      .select("amount, currency, exchange_rate_to_base")
      .eq("trip_id", tripId)
      .limit(2000),
    client.from("trip_routes").select("distance_text").eq("trip_id", tripId).limit(500),
  ]);

  const { totalInBase } = computeExpenseTotalsInBase(
    (expenseRows ?? []) as Array<{ amount: unknown; currency: string | null; exchange_rate_to_base?: number | null }>,
    currency
  );

  let routesDistanceKm: number | null = null;
  let kmSum = 0;
  let kmParsed = 0;
  for (const row of routeRows ?? []) {
    const km = parseDistanceKm((row as { distance_text?: string | null }).distance_text);
    if (km != null) {
      kmSum += km;
      kmParsed += 1;
    }
  }
  if (kmParsed > 0) routesDistanceKm = Math.round(kmSum);

  return {
    activitiesCount: activitiesCount ?? 0,
    participantsCount: participantsCount ?? 0,
    expensesCount: expensesCount ?? 0,
    routesCount: routesCount ?? 0,
    totalSpent: totalInBase,
    currency,
    routesDistanceKm,
  };
}
