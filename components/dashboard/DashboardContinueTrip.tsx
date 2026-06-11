"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import { pickContinueTrip, type TripForActivePick } from "@/lib/trip-active";
import { tripTimelineProgress } from "@/lib/trip-timeline-progress";
import { DASHBOARD_CARD } from "@/components/dashboard/dashboard-ui";

export type DashboardContinueNextActivity = {
  title: string;
  time: string | null;
  dateLabel?: string | null;
};

type Props = {
  trips: TripForActivePick[];
  nextActivity?: DashboardContinueNextActivity | null;
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

export default function DashboardContinueTrip({ trips, nextActivity = null }: Props) {
  const trip = pickContinueTrip(trips);
  if (!trip) return null;

  const today = new Date().toISOString().slice(0, 10);
  const isActive =
    Boolean(trip.start_date && trip.end_date && trip.start_date <= today && today <= trip.end_date) ||
    Boolean(trip.start_date && !trip.end_date && trip.start_date <= today);

  const dates = formatDates(trip.start_date, trip.end_date);
  const progress = tripTimelineProgress(trip.start_date, trip.end_date);
  const destInitial = trip.destination?.trim().charAt(0).toUpperCase();

  return (
    <section
      className={`${DASHBOARD_CARD} overflow-hidden border-l-4 border-l-[var(--brand)] bg-gradient-to-br from-[var(--brand-light)]/50 via-white to-slate-50/40 dark:from-[#1a0f0f]/30 dark:via-[#0F1623] dark:to-[#080C14]`}
    >
      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          {destInitial ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-extrabold text-[var(--brand)] shadow-sm ring-1 ring-[var(--brand-border)] dark:bg-[#141c2b]">
              {destInitial}
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm ring-1 ring-[var(--brand-border)] dark:bg-[#141c2b]">
              ✈️
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isActive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--brand-text)] shadow-sm ring-1 ring-[var(--brand-border)] dark:bg-[#141c2b]/90">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand)]" aria-hidden />
                  En curso
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Próximo viaje
                </span>
              )}
            </div>
            <h2 className="mt-1.5 truncate text-lg font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {trip.name}
            </h2>
            {trip.destination ? (
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-medium text-slate-600 dark:text-slate-300">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--brand)]" aria-hidden />
                {trip.destination}
              </p>
            ) : null}
            {dates ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="h-3 w-3 shrink-0" aria-hidden />
                {dates}
              </p>
            ) : null}

            {isActive && progress !== null ? (
              <div className="mt-3 max-w-sm">
                <div className="mb-1.5 flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span>Progreso del viaje</span>
                  <span className="tabular-nums text-[var(--brand-text)]">{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/80 shadow-inner ring-1 ring-slate-200/80 dark:bg-[#1E293B] dark:ring-[#334155]">
                  <div
                    className="h-full rounded-full bg-[var(--brand)] shadow-[0_0_6px_rgba(248,113,113,0.35)] transition-[width] duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : null}

            {nextActivity ? (
              <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-white/80 bg-white/70 px-2.5 py-2 text-xs text-slate-700 shadow-sm dark:border-[#334155] dark:bg-[#141c2b]/80 dark:text-slate-200">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand)]" aria-hidden />
                <span>
                  <span className="font-bold text-slate-900 dark:text-white">Próxima actividad: </span>
                  {nextActivity.title}
                  {nextActivity.time ? (
                    <span className="text-slate-500 dark:text-slate-400"> · {nextActivity.time}</span>
                  ) : null}
                  {nextActivity.dateLabel ? (
                    <span className="text-slate-500 dark:text-slate-400"> · {nextActivity.dateLabel}</span>
                  ) : null}
                </span>
              </p>
            ) : null}
          </div>
        </div>
        <Link
          href={`/trip/${trip.id}/summary`}
          className="btn-press inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(248,113,113,0.25)] transition hover:bg-[var(--brand-hover)] sm:self-center"
        >
          Continuar
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
