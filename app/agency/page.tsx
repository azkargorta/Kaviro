import { getAgencyTrips } from "@/lib/agency";
import { requireAgencyContext } from "@/lib/require-agency";
import AgencyDashboardHome from "@/components/agency/AgencyDashboardHome";

export default async function AgencyHomePage() {
  const { supabase, agency, userId } = await requireAgencyContext();
  const trips = await getAgencyTrips(supabase, agency.id);

  const tripIds = trips.map((t) => t.id);
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    { data: profile },
    { count: templateCount },
    { count: clientCount },
    { count: portalViews30d },
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
  ]);

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
    />
  );
}
