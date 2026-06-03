import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ShareTripItinerary from "@/components/share/ShareTripItinerary";
import ClientPortalHeader from "@/components/agency/ClientPortalHeader";
import {
  ClientPortalAnnouncements,
  ClientPortalDocuments,
} from "@/components/agency/ClientPortalExtras";
import { agencyBrandingFromRow } from "@/lib/agency";
import {
  formatClientPortalDate,
  groupClientPortalDays,
  loadAgencyClientPortalStaffPreview,
} from "@/lib/load-agency-client-portal";
import { getAgencyForUser } from "@/lib/agency";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/brand";
import { KAVIRO_TRIPS_WORKSPACE_CLASS } from "@/lib/agency-theme";
import { Eye } from "lucide-react";

type Props = { params: { id: string } };

export default async function TripClientPreviewPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/trip/${params.id}/client-preview`);

  const ctx = await getAgencyForUser(supabase, user.id);
  if (!ctx) redirect("/empresa");

  const { data: trip } = await supabase
    .from("trips")
    .select("id, agency_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!trip || trip.agency_id !== ctx.agency.id) notFound();

  const data = await loadAgencyClientPortalStaffPreview(params.id);
  if (!data) notFound();

  const branding = agencyBrandingFromRow(data.agency);
  const days = groupClientPortalDays(data.activities).map(([day, rows]) => ({
    key: day,
    label: day === "Sin fecha" ? "Sin fecha" : formatClientPortalDate(day),
    rows,
  }));

  const dateRange = `${formatClientPortalDate(data.trip.start_date)} — ${formatClientPortalDate(data.trip.end_date)}`;

  return (
    <main className={`${KAVIRO_TRIPS_WORKSPACE_CLASS} min-h-[100svh] bg-slate-50 dark:bg-[#080C14]`}>
      <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs font-semibold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
        <Eye className="mr-1 inline h-3.5 w-3.5" aria-hidden />
        Vista previa — así verá tu cliente el portal (solo tu equipo)
      </div>

      <ClientPortalHeader
        branding={branding}
        tripName={data.trip.name || "Viaje"}
        destination={data.trip.destination || "Destino por confirmar"}
        dateRange={dateRange}
        updatedLabel={
          data.lastPublishedAt
            ? `Publicado ${new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(data.lastPublishedAt))}`
            : "Borrador — aún no publicado para clientes"
        }
      />

      <section className="mx-auto max-w-[980px] px-4 py-6 sm:px-6">
        <ClientPortalAnnouncements items={data.announcements} />
        <ClientPortalDocuments items={data.documents} />
        <ShareTripItinerary days={days} />
      </section>

      <footer className="border-t border-slate-200 py-6 text-center dark:border-slate-700">
        <Link
          href={`/trip/${params.id}/plan`}
          className="text-sm font-semibold text-[#1e3a5f] hover:underline dark:text-sky-300"
        >
          ← Volver a gestionar el programa
        </Link>
        <p className="mt-2 text-xs text-slate-500">
          Powered by {APP_NAME}
        </p>
      </footer>
    </main>
  );
}
