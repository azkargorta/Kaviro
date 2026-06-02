import type { SupabaseClient } from "@supabase/supabase-js";

export type AgencyPortalMeta = {
  tripId: string;
  slug: string;
  isActive: boolean;
  lastPublishedAt: string | null;
};

export async function getAgencyPortalMeta(
  supabase: SupabaseClient,
  tripId: string
): Promise<AgencyPortalMeta | null> {
  const { data } = await supabase
    .from("agency_client_portals")
    .select("trip_id, slug, is_active, last_published_at")
    .eq("trip_id", tripId)
    .maybeSingle();

  if (!data) return null;

  return {
    tripId: data.trip_id as string,
    slug: data.slug as string,
    isActive: Boolean(data.is_active),
    lastPublishedAt: (data.last_published_at as string | null) ?? null,
  };
}

export async function ensureAgencyPortalRow(
  supabase: SupabaseClient,
  tripId: string,
  agencyId: string,
  slug: string
) {
  await supabase.from("agency_client_portals").upsert(
    {
      trip_id: tripId,
      agency_id: agencyId,
      slug,
      is_active: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "trip_id" }
  );
}

export async function publishAgencyPortal(supabase: SupabaseClient, tripId: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("agency_client_portals")
    .update({ is_active: true, last_published_at: now, updated_at: now })
    .eq("trip_id", tripId);
  if (error) throw new Error(error.message);
  return now;
}

export async function unpublishAgencyPortal(supabase: SupabaseClient, tripId: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("agency_client_portals")
    .update({ is_active: false, updated_at: now })
    .eq("trip_id", tripId);
  if (error) throw new Error(error.message);
}
