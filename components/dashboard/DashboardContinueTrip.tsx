"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { pickContinueTrip, type TripForActivePick } from "@/lib/trip-active";

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
  const isToday =
    Boolean(trip.start_date && trip.end_date && trip.start_date <= today && today <= trip.end_date) ||
    Boolean(trip.start_date && !trip.end_date && trip.start_date <= today);

  const dates = formatDates(trip.start_date, trip.end_date);

  return (
    <Link
      href={`/trip/${trip.id}/summary`}
      className="group flex w-full flex-col gap-2 rounded-2xl border-2 border-[var(--brand)] bg-gradient-to-br from-[var(--brand-light)] via-white to-white px-5 py-4 shadow-md ring-1 ring-[var(--brand-border)] transition hover:shadow-lg active:scale-[0.99] dark:border-[#F87171]/50 dark:from-[#1a0f0f] dark:via-[#0F1623] dark:to-[#0F1623]"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand)] dark:text-[#F87171]">
        {isToday ? "Viaje en curso hoy" : "Siguiente viaje"}
      </p>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold text-slate-950 dark:text-white">
            Continuar {trip.name}
          </p>
          {trip.destination ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-slate-600 dark:text-slate-300">
              <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              {trip.destination}
            </p>
          ) : null}
          {dates ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{dates}</p> : null}
        </div>
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-sm transition group-hover:scale-105">
          <ArrowRight className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
