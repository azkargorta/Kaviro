"use client";

import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";
import type { AgencyTripListRow as TripRow } from "@/lib/agency";
import { agencyBtnPrimaryClass, agencyBtnSecondaryClass } from "@/lib/agency-theme";
import AgencyPortalControls from "@/components/agency/AgencyPortalControls";
import AgencyTripDeleteButton from "@/components/agency/AgencyTripDeleteButton";

function tripStatus(trip: TripRow): { label: string; className: string; dot: string } {
  const today = new Date().toISOString().slice(0, 10);
  const s = trip.start_date;
  const e = trip.end_date;
  if (s && e && s <= today && today <= e) {
    return {
      label: "En curso",
      className: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
      dot: "#1e3a5f",
    };
  }
  if (s && s > today) {
    return {
      label: "Preparación",
      className: "bg-amber-500/15 text-amber-900 dark:text-amber-200",
      dot: "#8B5CF6",
    };
  }
  if (e && e < today) {
    return {
      label: "Finalizado",
      className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
      dot: "#10B981",
    };
  }
  return {
    label: "Programa",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800",
    dot: "#94A3B8",
  };
}

function formatRange(start: string | null, end: string | null) {
  const fmt = (v: string | null) => {
    if (!v) return null;
    return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(
      new Date(`${v}T00:00:00`)
    );
  };
  const a = fmt(start);
  const b = fmt(end);
  if (a && b) return `${a} — ${b}`;
  if (a) return `Desde ${a}`;
  return "Fechas por definir";
}

export default function AgencyTripRowItem({
  trip,
  agencySlug,
  compact = false,
}: {
  trip: TripRow;
  agencySlug: string;
  compact?: boolean;
}) {
  const status = tripStatus(trip);

  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: status.dot }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          {trip.clientName ? (
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#1e3a5f] dark:text-sky-300">
              {trip.clientName}
            </p>
          ) : null}
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{trip.name}</p>
          <p className="text-xs text-slate-500">{formatRange(trip.start_date, trip.end_date)}</p>
        </div>
        <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${status.className}`}>
          {status.label}
        </span>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Link href={`/trip/${trip.id}/plan`} className={`${agencyBtnPrimaryClass} text-xs`}>
            Gestionar
          </Link>
          <Link
            href={`/trip/${trip.id}/client-preview`}
            className={`${agencyBtnSecondaryClass} gap-1 text-xs`}
            title="Vista previa como cliente"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            Vista cliente
          </Link>
          {trip.client_portal_slug ? (
            <Link
              href={`/client/${agencySlug}/${trip.client_portal_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${agencyBtnSecondaryClass} gap-1 text-xs`}
            >
              Portal
              <ExternalLink className="h-3 w-3" aria-hidden />
            </Link>
          ) : null}
          <AgencyTripDeleteButton tripId={trip.id} tripName={trip.name} compact />
        </div>
      </div>
      {!compact && trip.client_portal_slug ? (
        <div className="border-t border-slate-100 px-3 pb-3 dark:border-slate-800">
          <AgencyPortalControls
            tripId={trip.id}
            agencySlug={agencySlug}
            clientPortalSlug={trip.client_portal_slug}
          />
        </div>
      ) : null}
    </div>
  );
}
