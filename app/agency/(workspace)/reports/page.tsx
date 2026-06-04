import Link from "next/link";
import { getAgencyTrips } from "@/lib/agency";
import { requireAgencyContext } from "@/lib/require-agency";
import { agencyCardClass, agencyPageSubtitleClass, agencyPageTitleClass } from "@/lib/agency-theme";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { tripPaymentsSummary } from "@/lib/agency/payments";

export default async function AgencyReportsPage() {
  const { supabase, agency } = await requireAgencyContext("/agency/reports");
  const trips = await getAgencyTrips(supabase, agency.id);
  const tripIds = trips.map((t) => t.id);

  let paymentTotals = { collected: 0, pending: 0, counts: { pending: 0, deposit_paid: 0, paid: 0, cancelled: 0 } };
  if (tripIds.length) {
    const admin = createSupabaseAdmin();
    const { data: payRows } = await admin
      .from("agency_participant_payments")
      .select("deposit_status, final_status, deposit_amount, final_amount")
      .in("trip_id", tripIds);
    if (payRows?.length) {
      paymentTotals = tripPaymentsSummary(payRows);
    }
  }

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
        <p className={agencyPageSubtitleClass}>Métricas de temporada, portales y cobros a viajeros.</p>
        <p className="mt-2 text-sm">
          <Link href="/agency/finance" className="font-semibold text-[#1e3a5f] underline dark:text-sky-300">
            Ver panel de cobros detallado →
          </Link>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Programas totales", value: trips.length },
          { label: "En curso", value: active },
          { label: "Próximos", value: upcoming },
          { label: "Portales publicados", value: published },
          { label: "Vistas portal (30 días)", value: views ?? 0 },
          { label: "Cobrado (viajeros)", value: `${paymentTotals.collected.toFixed(0)} €` },
          { label: "Pendiente de cobro", value: `${paymentTotals.pending.toFixed(0)} €` },
          { label: "Viajeros pagados", value: paymentTotals.counts.paid },
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
