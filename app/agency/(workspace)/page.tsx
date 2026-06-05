import { getAgencyTrips } from "@/lib/agency";
import { countAgencyMembers, countPendingAgencyInvites } from "@/lib/agency-invites";
import { requireAgencyContext } from "@/lib/require-agency";
import AgencyDashboardHome from "@/components/agency/AgencyDashboardHome";

const DEFAULT_BRAND_COLOR = "#1e3a5f";

export default async function AgencyHomePage() {
  const { supabase, agency, userId } = await requireAgencyContext();
  const trips = await getAgencyTrips(supabase, agency.id);

  const tripIds = trips.map((t) => t.id);
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const today = new Date().toISOString().slice(0, 10);
  const upcomingCount = trips.filter((t) => t.start_date && t.start_date > today).length;

  const [
    { data: profile },
    { count: templateCount },
    { count: clientCount },
    { count: portalViews30d },
    { data: portals },
    memberCount,
    pendingInvites,
  ] = await Promise.all([
    supabase.from("profiles").select("full_name, username").eq("id", userId).maybeSingle(),
    supabase
      .from("agency_templates")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agency.id)
      .eq("is_active", true),
    supabase
      .from("agency_clients")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agency.id),
    tripIds.length > 0
      ? supabase
          .from("agency_portal_views")
          .select("id", { count: "exact", head: true })
          .eq("agency_id", agency.id)
          .gte("viewed_at", since.toISOString())
      : Promise.resolve({ count: 0 }),
    tripIds.length > 0
      ? supabase.from("agency_client_portals").select("trip_id, is_active").in("trip_id", tripIds)
      : Promise.resolve({ data: [] as { trip_id: string; is_active: boolean | null }[] }),
    countAgencyMembers(supabase, agency.id, agency.owner_id),
    countPendingAgencyInvites(supabase, agency.id),
  ]);

  const publishedPortals = (portals ?? []).filter((p) => p.is_active === true).length;
  const brandColor = agency.brand_color?.trim().toLowerCase() || DEFAULT_BRAND_COLOR;
  const hasBranding = Boolean(agency.logo_url) || brandColor !== DEFAULT_BRAND_COLOR;

  const profileRow = profile as { full_name?: string | null; username?: string | null } | null;
  const userDisplayName =
    profileRow?.full_name?.trim() ||
    (profileRow?.username ? `@${profileRow.username}` : null) ||
    "equipo";

  return (
    <AgencyDashboardHome
      agencyName={agency.name}
      agencySlug={agency.slug}
      userDisplayName={userDisplayName.split(" ")[0] || userDisplayName}
      trips={trips}
      clientCount={clientCount ?? 0}
      templateCount={templateCount ?? 0}
      portalViews30d={portalViews30d ?? 0}
      publishedPortals={publishedPortals}
      upcomingCount={upcomingCount}
      memberCount={memberCount}
      maxMembers={agency.max_members}
      pendingInvites={pendingInvites}
      hasBranding={hasBranding}
    />
  );
}
