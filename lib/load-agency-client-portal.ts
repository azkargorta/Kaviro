import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { AgencyRow } from "@/lib/agency";

export type ClientPortalActivity = {
  id: string;
  title: string | null;
  activity_date: string | null;
  activity_time: string | null;
  place_name: string | null;
  address: string | null;
  activity_kind: string | null;
  activity_type: string | null;
};

export type ClientPortalDocument = {
  id: string;
  title: string | null;
  file_url: string | null;
  mime_type: string | null;
};

export type ClientPortalAnnouncement = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

export type ClientPortalPayload = {
  agency: AgencyRow;
  trip: {
    id: string;
    name: string | null;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  activities: ClientPortalActivity[];
  portalSlug: string;
  lastPublishedAt: string | null;
  documents: ClientPortalDocument[];
  announcements: ClientPortalAnnouncement[];
};

/** Resuelve /client/{agencySlug}/{tripSlug} (lectura pública). */
export async function loadAgencyClientPortal(
  agencySlug: string,
  tripSlug: string
): Promise<ClientPortalPayload | null> {
  const supabase = getServiceRoleClient();

  const { data: agency, error: agencyErr } = await supabase
    .from("agencies")
    .select("id, name, slug, logo_url, brand_color, contact_email, owner_id, plan, max_members")
    .eq("slug", agencySlug)
    .maybeSingle();

  if (agencyErr || !agency) return null;

  const { data: trip, error: tripErr } = await supabase
    .from("trips")
    .select("id, name, destination, start_date, end_date, agency_id, client_portal_slug")
    .eq("agency_id", agency.id)
    .eq("client_portal_slug", tripSlug)
    .maybeSingle();

  if (tripErr || !trip) {
    const { data: portal } = await supabase
      .from("agency_client_portals")
      .select("trip_id, slug, is_active, last_published_at")
      .eq("agency_id", agency.id)
      .eq("slug", tripSlug)
      .maybeSingle();

    if (!portal?.trip_id || portal.is_active !== true) return null;

    const { data: tripViaPortal } = await supabase
      .from("trips")
      .select("id, name, destination, start_date, end_date, agency_id, client_portal_slug")
      .eq("id", portal.trip_id)
      .maybeSingle();

    if (!tripViaPortal) return null;
    return loadActivities(supabase, agency as AgencyRow, tripViaPortal, tripSlug, portal.last_published_at);
  }

  const { data: portalMeta } = await supabase
    .from("agency_client_portals")
    .select("is_active, last_published_at")
    .eq("trip_id", trip.id)
    .maybeSingle();

  if (!portalMeta || portalMeta.is_active !== true) return null;

  return loadActivities(
    supabase,
    agency as AgencyRow,
    trip,
    tripSlug,
    portalMeta?.last_published_at ?? null
  );
}

async function loadActivities(
  supabase: ReturnType<typeof getServiceRoleClient>,
  agency: AgencyRow,
  trip: {
    id: string;
    name: string | null;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
  },
  portalSlug: string,
  lastPublishedAt: string | null
): Promise<ClientPortalPayload> {
  const [{ data: activities }, { data: documents }, { data: announcements }] = await Promise.all([
    supabase
      .from("trip_activities")
      .select("id, title, activity_date, activity_time, place_name, address, activity_kind, activity_type")
      .eq("trip_id", trip.id)
      .order("activity_date", { ascending: true })
      .order("activity_time", { ascending: true }),
    supabase
      .from("trip_resources")
      .select("id, title, file_url, mime_type")
      .eq("trip_id", trip.id)
      .eq("show_on_client_portal", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("agency_trip_announcements")
      .select("id, title, body, created_at")
      .eq("trip_id", trip.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    agency,
    trip: {
      id: trip.id,
      name: trip.name,
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
    },
    activities: (activities ?? []) as ClientPortalActivity[],
    portalSlug,
    lastPublishedAt: lastPublishedAt,
    documents: (documents ?? []) as ClientPortalDocument[],
    announcements: (announcements ?? []) as ClientPortalAnnouncement[],
  };
}

export function groupClientPortalDays(activities: ClientPortalActivity[]) {
  const map = new Map<string, ClientPortalActivity[]>();
  for (const a of activities) {
    const d = a.activity_date || "Sin fecha";
    const arr = map.get(d) || [];
    arr.push(a);
    map.set(d, arr);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export function formatClientPortalDate(value: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    date
  );
}
