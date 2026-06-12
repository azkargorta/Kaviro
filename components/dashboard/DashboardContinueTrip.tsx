"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  MapPin,
  Users,
  Wallet,
} from "lucide-react";
import { pickContinueTrip, type TripForActivePick } from "@/lib/trip-active";
import { tripDayLabel, tripTimelineProgress } from "@/lib/trip-timeline-progress";
import type { DashboardHeroSnapshot } from "@/lib/dashboard-hero-snapshot";
import { DASHBOARD_CARD } from "@/components/dashboard/dashboard-ui";

export type DashboardContinueNextActivity = {
  title: string;
  time: string | null;
  dateLabel?: string | null;
};

type Props = {
  trips: TripForActivePick[];
  nextActivity?: DashboardContinueNextActivity | null;
  snapshot?: DashboardHeroSnapshot | null;
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

function StatPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 flex-1 rounded-xl border border-white/90 bg-white/80 px-2 py-1.5 shadow-sm dark:border-[#334155] dark:bg-[#141c2b]/90 sm:flex-none sm:px-2.5 sm:py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 text-sm font-extrabold tabular-nums text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function DashboardContinueTrip({
  trips,
  nextActivity = null,
  snapshot = null,
}: Props) {
  const trip = pickContinueTrip(trips);
  if (!trip) return null;

  const today = new Date().toISOString().slice(0, 10);
  const isActive =
    Boolean(trip.start_date && trip.end_date && trip.start_date <= today && today <= trip.end_date) ||
    Boolean(trip.start_date && !trip.end_date && trip.start_date <= today);

  const dates = formatDates(trip.start_date, trip.end_date);
  const progress = tripTimelineProgress(trip.start_date, trip.end_date);
  const dayLabel = tripDayLabel(trip.start_date, trip.end_date);
  const destInitial = trip.destination?.trim().charAt(0).toUpperCase();
  const hasSnapshot =
    snapshot &&
    (snapshot.participantsCount > 0 || snapshot.expensesCount > 0 || snapshot.documentsCount > 0);

  return (
    <section
      className={`${DASHBOARD_CARD} overflow-hidden border-l-4 border-l-[var(--brand)] bg-gradient-to-br from-[var(--brand-light)]/45 via-white to-slate-50/50 dark:from-[#1a0f0f]/30 dark:via-[#0F1623] dark:to-[#080C14]`}
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
        {/* Columna izquierda — identidad del viaje */}
        <div className="flex min-w-0 items-start gap-3 p-3 sm:gap-3.5 sm:p-5">
          {destInitial ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-base font-extrabold text-[var(--brand)] shadow-sm ring-1 ring-[var(--brand-border)] dark:bg-[#141c2b] sm:h-12 sm:w-12 sm:rounded-2xl sm:text-lg">
              {destInitial}
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm ring-1 ring-[var(--brand-border)] dark:bg-[#141c2b] sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl">
              ✈️
            </div>
          )}
          <div className="min-w-0 flex-1">
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
            {isActive && (dayLabel || progress !== null) ? (
              <div className="mt-3 max-w-md">
                {dayLabel ? (
                  <p className="mb-1.5 text-xs font-bold text-[var(--brand-text)]">{dayLabel}</p>
                ) : null}
                {progress !== null ? (
                  <>
                    <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Progreso</span>
                      <span className="tabular-nums text-[var(--brand-text)]">{progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/80 shadow-inner ring-1 ring-slate-200/80 dark:bg-[#1E293B]">
                      <div
                        className="h-full rounded-full bg-[var(--brand)] shadow-[0_0_6px_rgba(248,113,113,0.35)] transition-[width] duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Columna derecha — resumen + próxima actividad + CTA */}
        <div className="flex flex-col gap-2.5 border-t border-[var(--brand-border)]/20 bg-white/40 p-3 dark:border-[#334155] dark:bg-[#080C14]/40 sm:gap-3 sm:p-5 lg:border-l lg:border-t-0">
          {hasSnapshot ? (
            <div className="flex gap-2 sm:grid sm:grid-cols-3">
              <StatPill
                icon={<Users className="h-3 w-3 text-[var(--brand)]" aria-hidden />}
                label="Grupo"
                value={String(snapshot!.participantsCount)}
              />
              <StatPill
                icon={<Wallet className="h-3 w-3 text-[var(--brand)]" aria-hidden />}
                label="Gastos"
                value={String(snapshot!.expensesCount)}
              />
              <StatPill
                icon={<FileText className="h-3 w-3 text-[var(--brand)]" aria-hidden />}
                label="Docs"
                value={String(snapshot!.documentsCount)}
              />
            </div>
          ) : null}

          {nextActivity ? (
            <div className="rounded-xl border border-[var(--brand-border)]/50 bg-gradient-to-br from-white to-[var(--brand-light)]/30 p-3 shadow-sm ring-1 ring-[var(--brand-border)]/25 dark:from-[#141c2b] dark:to-[#1a0f0f]/40">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--brand-text)]">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                Próxima actividad
              </p>
              <p className="mt-1.5 line-clamp-2 text-sm font-extrabold leading-snug text-slate-900 dark:text-white">
                {nextActivity.title}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {nextActivity.time ? `${nextActivity.time}` : "Hoy"}
                {nextActivity.dateLabel ? ` · ${nextActivity.dateLabel}` : null}
              </p>
            </div>
          ) : null}

          <Link
            href={`/trip/${trip.id}/summary`}
            className="btn-press mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(248,113,113,0.28)] transition hover:bg-[var(--brand-hover)] sm:px-5 sm:py-3"
          >
            Continuar viaje
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
