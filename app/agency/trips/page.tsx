import Link from "next/link";
import { getAgencyTrips } from "@/lib/agency";
import { requireAgencyContext } from "@/lib/require-agency";
import AgencyTripsPageClient from "@/components/agency/AgencyTripsPageClient";
import { agencyPageSubtitleClass, agencyPageTitleClass } from "@/lib/agency-theme";

export default async function AgencyTripsPage() {
  const { supabase, agency } = await requireAgencyContext("/agency/trips");
  const trips = await getAgencyTrips(supabase, agency.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={agencyPageTitleClass}>Mis viajes</h1>
          <p className={agencyPageSubtitleClass}>
            {trips.length} programas · gestiona itinerarios y portales cliente
          </p>
        </div>
        <Link href="/agency" className="text-xs font-semibold text-[#1e3a5f] underline dark:text-sky-300">
          ← Volver al panel
        </Link>
      </div>

      <AgencyTripsPageClient agencySlug={agency.slug} trips={trips} />
    </div>
  );
}
