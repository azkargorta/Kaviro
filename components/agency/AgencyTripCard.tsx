"use client";

import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { clientPortalPath } from "@/lib/agency";

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
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
      <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">{trip.name}</h3>
      {trip.destination ? (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {trip.destination}
        </p>
      ) : null}
      <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {formatRange(trip.start_date, trip.end_date)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/trip/${trip.id}/summary`}
          className="inline-flex min-h-9 items-center justify-center rounded-xl bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#162d4d]"
        >
          Abrir viaje
        </Link>
        {portalHref ? (
          <Link
            href={portalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0B1220] dark:text-slate-200"
          >
            Portal cliente
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
