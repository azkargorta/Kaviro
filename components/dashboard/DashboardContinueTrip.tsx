"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { pickContinueTrip, type TripForActivePick } from "@/lib/trip-active";
import { tripTimelineProgress } from "@/lib/trip-timeline-progress";

type Props = {
  trips: TripForActivePick[];
};

function formatDates(start: string | null, end: string | null) {
  const fmt = (v: string) =>
    new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(
      new Date(`${v}T12:00:00`)
    );
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `Desde ${fmt(start)}`;
  if (end) return `Hasta ${fmt(end)}`;
  return null;
}

export default function DashboardContinueTrip({ trips }: Props) {
  const trip = pickContinueTrip(trips);
  if (!trip) return null;

  const today = new Date().toISOString().slice(0, 10);
  const isActive =
    Boolean(trip.start_date && trip.end_date && trip.start_date <= today && today <= trip.end_date) ||
    Boolean(trip.start_date && !trip.end_date && trip.start_date <= today);

  const dates = formatDates(trip.start_date, trip.end_date);
  const progress = tripTimelineProgress(trip.start_date, trip.end_date);

  return (
    <section
      className={`rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5 dark:bg-[#0F1623] ${
        isActive
          ? "border-slate-200 dark:border-[#1E293B]"
          : "border-slate-200 dark:border-[#1E293B]"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand)]" aria-hidden />
                En curso
              </span>
            ) : (
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Próximo viaje
              </p>
            )}
          </div>
          <h2 className="mt-1 truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            {trip.name}
          </h2>
          {trip.destination ? (
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-slate-600 dark:text-slate-300">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              {trip.destination}
            </p>
          ) : null}
          {dates ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{dates}</p> : null}
          {isActive && progress !== null ? (
            <div className="mt-3 max-w-md">
              <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1E293B]">
                <div
                  className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{progress}% del viaje</p>
            </div>
          ) : null}
        </div>
        <Link
          href={`/trip/${trip.id}/summary`}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-hover)] sm:self-center"
        >
          Continuar
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
