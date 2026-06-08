import type { SupabaseClient } from "@supabase/supabase-js";
import { agencyBrandingFromRow, type AgencyBranding, type AgencyRow } from "@/lib/agency";
import { isMissingColumnError } from "@/lib/expenses-group-rollout";

export type TripMode = "travel" | "expenses";

export type TripWorkspaceMeta = {
  tripMode: TripMode;
  /** Vista operativa Kaviro Trips (solo personal de la agencia). */
  isAgencyTrip: boolean;
  /** El viaje pertenece a una agencia (viajeros invitados usan Kaviro completo). */
  isAgencyManaged: boolean;
  agencyId: string | null;
  agencySlug: string | null;
  clientPortalSlug: string | null;
  /** Marca de la agencia (logo, color, nombre) para el viaje del cliente. */
  agencyBranding: AgencyBranding | null;
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
  let trip: Record<string, unknown> | null = null;
  const withMode = await client
    .from("trips")
    .select("agency_id, client_portal_slug, trip_mode")
    .eq("id", tripId)
    .maybeSingle();

  if (withMode.error && isMissingColumnError(withMode.error.message, "trip_mode")) {
    const fallback = await client
      .from("trips")
      .select("agency_id, client_portal_slug")
      .eq("id", tripId)
      .maybeSingle();
    trip = fallback.data as Record<string, unknown> | null;
  } else {
    trip = withMode.data as Record<string, unknown> | null;
  }

  if (
    (withMode.error && !isMissingColumnError(withMode.error.message, "trip_mode")) ||
    !trip
  ) {
    return {
      tripMode: "travel",
      isAgencyTrip: false,
      isAgencyManaged: false,
      agencyId: null,
      agencySlug: null,
      clientPortalSlug: null,
      agencyBranding: null,
    };
  }

  const tripModeRaw = (trip as { trip_mode?: string | null }).trip_mode;
  const tripMode: TripMode = tripModeRaw === "expenses" ? "expenses" : "travel";
  const agencyId = (trip as { agency_id?: string | null }).agency_id ?? null;
  const clientPortalSlug = (trip as { client_portal_slug?: string | null }).client_portal_slug ?? null;

  if (!agencyId) {
    return {
      tripMode,
      isAgencyTrip: false,
      isAgencyManaged: false,
      agencyId: null,
      agencySlug: null,
      clientPortalSlug,
      agencyBranding: null,
    };
  }

  const isAgencyStaff = await userIsAgencyStaff(client, agencyId, userId);

  const agencySelect =
    "id, name, slug, logo_url, brand_color, contact_email, owner_id, plan, max_members";

  // Staff: RLS agency_members. Viajeros: RLS opcional (kaviro_agency_branding_trip_read.sql).
  let { data: agency } = await client
    .from("agencies")
    .select(agencySelect)
    .eq("id", agencyId)
    .maybeSingle();

  if (!agency) {
    const { createSupabaseAdmin } = await import("@/lib/supabase-admin");
    const admin = createSupabaseAdmin();
    const { data: adminAgency } = await admin
      .from("agencies")
      .select(agencySelect)
      .eq("id", agencyId)
      .maybeSingle();
    agency = adminAgency;
  }
  const agencySlug = (agency as { slug?: string } | null)?.slug ?? null;
  const agencyBranding = agency ? agencyBrandingFromRow(agency as AgencyRow) : null;

  return {
    tripMode,
    isAgencyTrip: isAgencyStaff,
    isAgencyManaged: true,
    agencyId,
    agencySlug,
    clientPortalSlug,
    agencyBranding,
  };
}
