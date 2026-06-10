import type React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ListChecks, FileText, MapPin } from "lucide-react";
import ShareTripItinerary from "@/components/share/ShareTripItinerary";
import ClientPortalHeader from "@/components/agency/ClientPortalHeader";
import {
  ClientPortalAnnouncements,
  ClientPortalDocuments,
  ClientPortalViewTracker,
} from "@/components/agency/ClientPortalExtras";
import { agencyBrandingFromRow } from "@/lib/agency";
import { agencyBrandingStyleVars } from "@/lib/agency-brand-tokens";
import {
  formatClientPortalDate,
  groupClientPortalDays,
  loadAgencyClientPortal,
} from "@/lib/load-agency-client-portal";
import { APP_NAME } from "@/lib/brand";
import { KAVIRO_TRIPS_WORKSPACE_CLASS, AGENCY_NAVY } from "@/lib/agency-theme";

type Props = {
  params: { agency: string; trip: string };
};

export async function generateMetadata({ params }: Props) {
  const data = await loadAgencyClientPortal(params.agency, params.trip);
  if (!data) return { title: `Programa del viaje | ${APP_NAME}` };
  const title = `${data.trip.name || "Viaje"} | ${data.agency.name}`;
  return {
    title,
    description: `Programa del viaje organizado por ${data.agency.name}.`,
  };
}

export default async function ClientPortalPage({ params }: Props) {
  const data = await loadAgencyClientPortal(params.agency, params.trip);
  if (!data) notFound();

  const branding = agencyBrandingFromRow(data.agency);
  const days = groupClientPortalDays(data.activities).map(([day, rows]) => ({
    key: day,
    label: day === "Sin fecha" ? "Sin fecha" : formatClientPortalDate(day),
    rows,
  }));

  const dateRange = `${formatClientPortalDate(data.trip.start_date)} — ${formatClientPortalDate(data.trip.end_date)}`;
  const updatedLabel = data.lastPublishedAt
    ? `Actualizado ${new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(data.lastPublishedAt))}`
    : null;

  const numDays = days.filter((d) => d.key !== "Sin fecha").length;
  const totalActivities = data.activities.length;

  return (
    <main
      className={`${KAVIRO_TRIPS_WORKSPACE_CLASS} min-h-[100svh] bg-slate-50 dark:bg-[#080C14]`}
      style={agencyBrandingStyleVars(branding.brandColor || AGENCY_NAVY) as React.CSSProperties}
    >
      <ClientPortalViewTracker agencySlug={params.agency} tripSlug={params.trip} />

      <ClientPortalHeader
        branding={branding}
        tripName={data.trip.name || "Viaje"}
        destination={data.trip.destination || "Destino por confirmar"}
        dateRange={dateRange}
        updatedLabel={updatedLabel}
      />

      {/* Barra de stats — de un vistazo */}
      <div className="border-b border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623]">
        <div className="mx-auto flex max-w-[980px] flex-wrap gap-x-5 gap-y-1.5 px-4 py-3 sm:px-6">
          {data.trip.destination && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-[var(--brand,#1e3a5f)]" aria-hidden />
              {data.trip.destination}
            </span>
          )}
          {numDays > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <CalendarDays className="h-3.5 w-3.5 text-[var(--brand,#1e3a5f)]" aria-hidden />
              {numDays} día{numDays === 1 ? "" : "s"}
            </span>
          )}
          {totalActivities > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <ListChecks className="h-3.5 w-3.5 text-[var(--brand,#1e3a5f)]" aria-hidden />
              {totalActivities} actividad{totalActivities === 1 ? "" : "es"}
            </span>
          )}
          {data.documents.length > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <FileText className="h-3.5 w-3.5 text-[var(--brand,#1e3a5f)]" aria-hidden />
              {data.documents.length} documento{data.documents.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <section className="mx-auto max-w-[980px] px-4 py-6 sm:px-6">
        <ClientPortalAnnouncements items={data.announcements} />
        <ClientPortalDocuments items={data.documents} />
        <div id="programa">
          <ShareTripItinerary days={days} />
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500 dark:border-[#1E293B] dark:text-slate-400">
        <p>
          Programa preparado por{" "}
          <strong className="text-slate-700 dark:text-slate-200">{branding.name}</strong>
        </p>
        <p className="mt-1">
          Powered by{" "}
          <Link href="/" className="font-semibold text-[var(--brand,#1e3a5f)] hover:underline dark:text-sky-300">
            {APP_NAME}
          </Link>
        </p>
      </footer>
    </main>
  );
}
