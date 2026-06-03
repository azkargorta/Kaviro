import { getAgencyTrips } from "@/lib/agency";
import { requireAgencyContext } from "@/lib/require-agency";
import { agencyCardClass, agencyPageSubtitleClass, agencyPageTitleClass } from "@/lib/agency-theme";

export default async function AgencyReportsPage() {
  const { supabase, agency } = await requireAgencyContext("/agency/reports");
  const trips = await getAgencyTrips(supabase, agency.id);

  const today = new Date().toISOString().slice(0, 10);
  const active = trips.filter(
    (t) => t.start_date && t.end_date && t.start_date <= today && today <= t.end_date
  ).length;
  const upcoming = trips.filter((t) => t.start_date && t.start_date > today).length;

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { count: views } = await supabase
    .from("agency_portal_views")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agency.id)
    .gte("viewed_at", since.toISOString());

  const { data: portals } = await supabase
    .from("agency_client_portals")
    .select("is_active")
    .eq("agency_id", agency.id);

  const published = (portals ?? []).filter((p) => p.is_active === true).length;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className={agencyPageTitleClass}>Informes</h1>
        <p className={agencyPageSubtitleClass}>Métricas de temporada y uso de portales.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Programas totales", value: trips.length },
          { label: "En curso", value: active },
          { label: "Próximos", value: upcoming },
          { label: "Portales publicados", value: published },
          { label: "Vistas portal (30 días)", value: views ?? 0 },
        ].map((s) => (
          <div key={s.label} className={`${agencyCardClass} p-4`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
