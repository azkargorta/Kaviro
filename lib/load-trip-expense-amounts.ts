import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExpenseAmountRow } from "@/lib/trip-expense-totals";

/** Carga importes de gastos; reintenta sin `exchange_rate_to_base` si la columna no existe. */
export async function loadTripExpenseAmountRows(
  client: SupabaseClient,
  tripId: string,
  limit = 1200
): Promise<ExpenseAmountRow[]> {
  const withRate = await client
    .from("trip_expenses")
    .select("amount, currency, exchange_rate_to_base")
    .eq("trip_id", tripId)
    .limit(limit);

  if (!withRate.error) {
    return (withRate.data ?? []) as ExpenseAmountRow[];
  }

  const msg = withRate.error.message.toLowerCase();
  const missingRate =
    msg.includes("exchange_rate_to_base") ||
    msg.includes("column") ||
    msg.includes("does not exist");

  if (!missingRate) {
    console.warn("No se pudieron cargar importes de gastos:", withRate.error.message);
    return [];
  }

  const fallback = await client
    .from("trip_expenses")
    .select("amount, currency")
    .eq("trip_id", tripId)
    .limit(limit);

  if (fallback.error) {
    console.warn("No se pudieron cargar importes de gastos (fallback):", fallback.error.message);
    return [];
  }

  return (fallback.data ?? []) as ExpenseAmountRow[];
}
