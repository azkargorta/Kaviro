import { getAgencyTrips } from "@/lib/agency";
import { requireAgencyContext } from "@/lib/require-agency";
import AgencyTripList from "@/components/agency/AgencyTripList";
import { agencyCardClass } from "@/lib/agency-theme";

export default async function AgencyHomePage() {
  const { supabase, agency } = await requireAgencyContext();
  const trips = await getAgencyTrips(supabase, agency.id);

  const activeCount = trips.filter((t) => {
    const today = new Date().toISOString().slice(0, 10);
    return t.start_date && t.end_date && t.start_date <= today && today <= t.end_date;
  }).length;

  const upcomingCount = trips.filter((t) => {
    const today = new Date().toISOString().slice(0, 10);
    return t.start_date && t.start_date > today;
  }).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Programas", value: trips.length },
          { label: "En curso", value: activeCount },
          { label: "Próximos", value: upcomingCount },
        ].map((stat) => (
          <div key={stat.label} className={`${agencyCardClass} p-4`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <AgencyTripList trips={trips} agencySlug={agency.slug} />
    </div>
  );
}
