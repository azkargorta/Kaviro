import type { SupabaseClient } from "@supabase/supabase-js";

export type TripWorkspaceMeta = {
  /** Vista operativa Kaviro Trips (solo personal de la agencia). */
  isAgencyTrip: boolean;
  /** El viaje pertenece a una agencia (viajeros invitados usan Kaviro completo). */
  isAgencyManaged: boolean;
  agencyId: string | null;
  agencySlug: string | null;
  clientPortalSlug: string | null;
};

async function userIsAgencyStaff(
  client: SupabaseClient,
  agencyId: string,
  userId: string
): Promise<boolean> {
  const { data: member } = await client
    .from("agency_members")
    .select("user_id")
    .eq("agency_id", agencyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (member) return true;

  const { data: owned } = await client
    .from("agencies")
    .select("id")
    .eq("id", agencyId)
    .eq("owner_id", userId)
    .maybeSingle();

  return Boolean(owned);
}

export async function loadTripWorkspaceMeta(
  client: SupabaseClient,
  tripId: string,
  userId: string
): Promise<TripWorkspaceMeta> {
  const { data: trip, error } = await client
    .from("trips")
    .select("agency_id, client_portal_slug")
    .eq("id", tripId)
    .maybeSingle();

  if (error || !trip) {
    return {
      isAgencyTrip: false,
      isAgencyManaged: false,
      agencyId: null,
      agencySlug: null,
      clientPortalSlug: null,
    };
  }

  const agencyId = (trip as { agency_id?: string | null }).agency_id ?? null;
  const clientPortalSlug = (trip as { client_portal_slug?: string | null }).client_portal_slug ?? null;

  if (!agencyId) {
    return {
      isAgencyTrip: false,
      isAgencyManaged: false,
      agencyId: null,
      agencySlug: null,
      clientPortalSlug,
    };
  }

  const { data: agency } = await client.from("agencies").select("slug").eq("id", agencyId).maybeSingle();
  const agencySlug = (agency as { slug?: string } | null)?.slug ?? null;
  const isAgencyStaff = await userIsAgencyStaff(client, agencyId, userId);

  return {
    isAgencyTrip: isAgencyStaff,
    isAgencyManaged: true,
    agencyId,
    agencySlug,
    clientPortalSlug,
  };
}
