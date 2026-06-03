import Link from "next/link";
import { getAgencyTrips } from "@/lib/agency";
import { requireAgencyContext } from "@/lib/require-agency";
import AgencyPortalControls from "@/components/agency/AgencyPortalControls";
import { agencyCardClass, agencyPageSubtitleClass, agencyPageTitleClass } from "@/lib/agency-theme";
import { clientPortalPath } from "@/lib/agency";

export default async function AgencyPortalsPage() {
  const { supabase, agency } = await requireAgencyContext("/agency/portals");
  const trips = await getAgencyTrips(supabase, agency.id);

  const withSlug = trips.filter((t) => t.client_portal_slug);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className={agencyPageTitleClass}>Portales cliente</h1>
        <p className={agencyPageSubtitleClass}>
          Publica y comparte el programa con tus clientes. Cada viaje tiene su URL pública.
        </p>
      </div>

      {withSlug.length === 0 ? (
        <div className={`${agencyCardClass} p-6 text-sm text-slate-600`}>
          No hay viajes con portal configurado.{" "}
          <Link href="/agency" className="font-semibold text-[#1e3a5f] underline dark:text-sky-300">
            Crea un viaje
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-4">
          {withSlug.map((trip) => (
            <div key={trip.id} className={`${agencyCardClass} p-4`}>
              <h2 className="font-semibold text-slate-900 dark:text-white">{trip.name}</h2>
              {trip.clientName ? (
                <p className="text-xs text-[#1e3a5f] dark:text-sky-300">{trip.clientName}</p>
              ) : null}
              <p className="mt-1 font-mono text-[10px] text-slate-500">
                {clientPortalPath(agency.slug, trip.client_portal_slug!)}
              </p>
              <div className="mt-3">
                <AgencyPortalControls
                  tripId={trip.id}
                  agencySlug={agency.slug}
                  clientPortalSlug={trip.client_portal_slug}
                />
              </div>
              <Link
                href={`/trip/${trip.id}/client-preview`}
                className="mt-3 inline-block text-xs font-semibold text-[#1e3a5f] underline dark:text-sky-300"
              >
                Vista previa como cliente
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
