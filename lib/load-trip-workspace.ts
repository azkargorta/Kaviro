import type { SupabaseClient } from "@supabase/supabase-js";

export type TripWorkspaceMeta = {
  isAgencyTrip: boolean;
  agencyId: string | null;
  agencySlug: string | null;
  clientPortalSlug: string | null;
};

export async function loadTripWorkspaceMeta(
  client: SupabaseClient,
  tripId: string
): Promise<TripWorkspaceMeta> {
  const { data: trip, error } = await client
    .from("trips")
    .select("agency_id, client_portal_slug")
    .eq("id", tripId)
    .maybeSingle();

  if (error || !trip) {
    return {
      isAgencyTrip: false,
      agencyId: null,
      agencySlug: null,
      clientPortalSlug: null,
    };
  }

  const agencyId = (trip as { agency_id?: string | null }).agency_id ?? null;
  if (!agencyId) {
    return {
      isAgencyTrip: false,
      agencyId: null,
      agencySlug: null,
      clientPortalSlug: (trip as { client_portal_slug?: string | null }).client_portal_slug ?? null,
    };
  }

  const { data: agency } = await client.from("agencies").select("slug").eq("id", agencyId).maybeSingle();

  return {
    isAgencyTrip: true,
    agencyId,
    agencySlug: (agency as { slug?: string } | null)?.slug ?? null,
    clientPortalSlug: (trip as { client_portal_slug?: string | null }).client_portal_slug ?? null,
  };
}
