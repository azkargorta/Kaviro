"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { clientPortalPath } from "@/lib/agency";
import AgencyPortalControls from "@/components/agency/AgencyPortalControls";
import { agencyBtnPrimaryClass, agencyBtnSecondaryClass, agencyCardClass } from "@/lib/agency-theme";

export type AgencyTripRow = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  client_portal_slug: string | null;
  created_at?: string | null;
};

function formatRange(start: string | null, end: string | null) {
  const fmt = (v: string | null) => {
    if (!v) return null;
    return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
      new Date(`${v}T00:00:00`)
    );
  };
  const a = fmt(start);
  const b = fmt(end);
  if (a && b) return `${a} — ${b}`;
  if (a) return `Desde ${a}`;
  if (b) return `Hasta ${b}`;
  return "Fechas por definir";
}

export default function AgencyTripCard({
  trip,
  agencySlug,
}: {
  trip: AgencyTripRow;
  agencySlug: string;
}) {
  const portalHref =
    trip.client_portal_slug != null && trip.client_portal_slug !== ""
      ? clientPortalPath(agencySlug, trip.client_portal_slug)
      : null;

  return (
    <article className={`${agencyCardClass} p-4`}>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{trip.name}</h3>
      {trip.destination ? (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {trip.destination}
        </p>
      ) : null}
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
        {formatRange(trip.start_date, trip.end_date)}
      </p>

      <AgencyPortalControls
        tripId={trip.id}
        agencySlug={agencySlug}
        clientPortalSlug={trip.client_portal_slug}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/trip/${trip.id}/plan`} className={agencyBtnPrimaryClass}>
          Gestionar plan
        </Link>
        <Link href={`/trip/${trip.id}/settings`} className={agencyBtnSecondaryClass}>
          Ajustes y avisos
        </Link>
      </div>
    </article>
  );
}
