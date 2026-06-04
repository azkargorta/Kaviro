import Link from "next/link";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import AgencyTripOperationsClient from "@/components/agency/AgencyTripOperationsClient";
import { agencyPageTitleClass } from "@/lib/agency-theme";

type Props = { params: { tripId: string } };

export default async function AgencyTripOperationsPage({ params }: Props) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) {
    return (
      <div className="text-sm text-slate-600">
        No se pudo cargar el viaje.{" "}
        <Link href="/agency/trips" className="font-semibold underline">
          Volver a Mis viajes
        </Link>
      </div>
    );
  }

  const tripName = (gate.trip.name as string) || "Viaje";

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/agency/trips"
          className="text-xs font-semibold text-[#1e3a5f] underline dark:text-sky-300"
        >
          ← Mis viajes
        </Link>
        <h1 className={`${agencyPageTitleClass} mt-2`}>Operaciones del viaje</h1>
      </div>
      <AgencyTripOperationsClient tripId={params.tripId} tripName={tripName} />
    </div>
  );
}
