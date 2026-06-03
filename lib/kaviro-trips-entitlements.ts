import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Viajes con `agency_id`: Kaviro Trips (acceso comercial negociado).
 * Sin límites Premium B2C ni cupo mensual de IA por usuario.
 */
export async function tripHasAgencyId(
  supabase: SupabaseClient,
  tripId: string
): Promise<boolean> {
  if (!tripId?.trim()) return false;
  const { data, error } = await supabase
    .from("trips")
    .select("agency_id")
    .eq("id", tripId.trim())
    .maybeSingle();

  if (error) {
    console.warn("tripHasAgencyId:", error.message);
    return false;
  }

  return Boolean((data as { agency_id?: string | null } | null)?.agency_id);
}

export async function isKaviroTripsUnlimitedTrip(
  supabase: SupabaseClient,
  tripId: string
): Promise<boolean> {
  return tripHasAgencyId(supabase, tripId);
}
