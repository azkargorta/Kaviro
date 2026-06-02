import Link from "next/link";
import { notFound } from "next/navigation";
import ShareTripItinerary from "@/components/share/ShareTripItinerary";
import ClientPortalHeader from "@/components/agency/ClientPortalHeader";
import { agencyBrandingFromRow } from "@/lib/agency";
import {
  formatClientPortalDate,
  groupClientPortalDays,
  loadAgencyClientPortal,
} from "@/lib/load-agency-client-portal";
import { APP_NAME } from "@/lib/brand";

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

  return (
    <main className="min-h-[100svh] bg-slate-50 dark:bg-[#080C14]">
      <ClientPortalHeader
        branding={branding}
        tripName={data.trip.name || "Viaje"}
        destination={data.trip.destination || "Destino por confirmar"}
        dateRange={dateRange}
        updatedLabel={updatedLabel}
      />

      <section className="mx-auto max-w-[980px] px-4 py-6 sm:px-6">
        <ShareTripItinerary days={days} />
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-[#1E293B] dark:text-slate-400">
        <p>
          Programa preparado por <strong className="text-slate-700 dark:text-slate-200">{branding.name}</strong>
        </p>
        <p className="mt-1">
          Powered by{" "}
          <Link href="/" className="font-semibold text-[#1e3a5f] hover:underline dark:text-sky-300">
            {APP_NAME}
          </Link>
        </p>
      </footer>
    </main>
  );
}
