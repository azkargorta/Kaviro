import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_TRIP_LIMIT = 3;

async function countNonDemoTrips(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data: profile } = await supabase.from("profiles").select("demo_trip_id").eq("id", userId).maybeSingle();
  const demoId = (profile as { demo_trip_id?: string } | null)?.demo_trip_id ?? null;

  const { data: existing, error: countErr } = await supabase
    .from("trip_participants")
    .select("trip_id")
    .eq("user_id", userId)
    .neq("status", "removed");

  if (countErr) throw countErr;

  const tripIds = (existing ?? []).map((r: { trip_id: string }) => r.trip_id).filter(Boolean);
  if (!tripIds.length) return 0;

  const { data: trips, error: tripsErr } = await supabase.from("trips").select("id, is_demo").in("id", tripIds);
  if (!tripsErr && trips?.length) {
    return (trips as { id: string; is_demo?: boolean }[]).filter((t) => !t.is_demo).length;
  }

  return tripIds.filter((id) => id !== demoId).length;
}

/** Comprueba límite de viajes en plan gratuito (misma regla que POST /api/trips). */
export async function ensureUserCanCreateTrip(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: true; isPremium: boolean } | { error: string; code: "PREMIUM_REQUIRED" }> {
  const { data: profileRow } = await supabase.from("profiles").select("is_premium").eq("id", userId).maybeSingle();
  const isPremium = Boolean((profileRow as { is_premium?: boolean } | null)?.is_premium);

  if (isPremium) return { ok: true, isPremium: true };

  try {
    const existingCount = await countNonDemoTrips(supabase, userId);
    if (existingCount >= FREE_TRIP_LIMIT) {
      return {
        error: `El plan gratuito permite hasta ${FREE_TRIP_LIMIT} viajes. Hazte Premium para crear más viajes.`,
        code: "PREMIUM_REQUIRED",
      };
    }
    return { ok: true, isPremium: false };
  } catch (countErr) {
    return {
      error: countErr instanceof Error ? countErr.message : "No se pudo comprobar el límite de viajes.",
      code: "PREMIUM_REQUIRED",
    };
  }
}
