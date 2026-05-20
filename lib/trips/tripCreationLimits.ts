import type { SupabaseClient } from "@supabase/supabase-js";
import { checkTripLimit, PREMIUM_REQUIRED } from "@/lib/tier";

export { FREE_TRIP_LIMIT } from "@/lib/premium-copy";

/** Comprueba límite de viajes en plan gratuito (misma regla que POST /api/trips). */
export async function ensureUserCanCreateTrip(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: true; isPremium: boolean } | { error: string; code: typeof PREMIUM_REQUIRED }> {
  const result = await checkTripLimit(supabase, userId);
  if (!result.ok) {
    return { error: result.error, code: result.code };
  }
  return { ok: true, isPremium: result.tier === "premium" };
}
