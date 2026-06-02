import { getAgencyTrips } from "@/lib/agency";
import { requireAgencyContext } from "@/lib/require-agency";
import AgencyTripList from "@/components/agency/AgencyTripList";

export default async function AgencyHomePage() {
  const { supabase, agency } = await requireAgencyContext();
  const trips = await getAgencyTrips(supabase, agency.id);

  const activeCount = trips.filter((t) => {
    const today = new Date().toISOString().slice(0, 10);
    return t.start_date && t.end_date && t.start_date <= today && today <= t.end_date;
  }).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1E293B] dark:bg-[#0F1623]">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Viajes totales</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{trips.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1E293B] dark:bg-[#0F1623]">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">En curso</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1E293B] dark:bg-[#0F1623]">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Plan</p>
          <p className="mt-2 text-lg font-extrabold capitalize text-slate-950 dark:text-white">{agency.plan}</p>
        </div>
      </div>

      <AgencyTripList trips={trips} agencySlug={agency.slug} />
    </div>
  );
}
