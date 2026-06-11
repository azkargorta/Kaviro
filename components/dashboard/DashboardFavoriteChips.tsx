"use client";

import Link from "next/link";
import { Clock, MapPin, Star } from "lucide-react";
import type { DashboardTrip } from "@/lib/dashboard-trip-types";
import { DASHBOARD_SECTION_EYEBROW } from "@/components/dashboard/dashboard-ui";

type FavoriteTrip = DashboardTrip & {
  badge: string;
  accent: string;
  is_favorite: true;
};

type RecentTrip = Pick<DashboardTrip, "id" | "name" | "destination">;

export default function DashboardFavoriteChips({
  trips,
  recentTrips = [],
  onSelectFilter,
}: {
  trips: FavoriteTrip[];
  recentTrips?: RecentTrip[];
  onSelectFilter?: () => void;
}) {
  const visibleFavorites = trips.slice(0, 5);
  const extra = trips.length - visibleFavorites.length;
  const showRecents = trips.length < 3 && recentTrips.length > 0;
  const recentFiltered = recentTrips
    .filter((t) => !trips.some((f) => f.id === t.id))
    .slice(0, 3);

  if (trips.length === 0 && !showRecents) return null;

  return (
    <section className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className={`flex items-center gap-1.5 ${DASHBOARD_SECTION_EYEBROW}`}>
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
            {trips.length > 0 ? "Acceso rápido" : "Recientes"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {trips.length > 0
              ? "Tus viajes favoritos, a un toque."
              : "Los últimos viajes que has añadido a tu biblioteca."}
          </p>
        </div>
        {onSelectFilter && trips.length > 0 ? (
          <button
            type="button"
            onClick={onSelectFilter}
            className="shrink-0 text-xs font-semibold text-slate-500 transition hover:text-[var(--brand)] dark:text-slate-400"
          >
            Ver todos
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleFavorites.map((trip) => (
          <Link
            key={trip.id}
            href={`/trip/${encodeURIComponent(trip.id)}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition hover:-translate-y-px hover:border-[var(--brand-border)] hover:bg-[var(--brand-light)] hover:shadow-md dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-100"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand-light)] text-[10px] font-bold text-[var(--brand)] ring-1 ring-[var(--brand-border)]">
              {trip.destination?.trim().charAt(0).toUpperCase() || "★"}
            </span>
            <span className="max-w-[9rem] truncate">{trip.name}</span>
            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
          </Link>
        ))}

        {showRecents
          ? recentFiltered.map((trip) => (
              <Link
                key={trip.id}
                href={`/trip/${encodeURIComponent(trip.id)}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-dashed border-slate-300/90 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white dark:border-slate-600 dark:bg-[#080C14]/60 dark:text-slate-200"
              >
                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <span className="max-w-[9rem] truncate">{trip.name}</span>
                {trip.destination ? (
                  <span className="hidden items-center gap-0.5 text-[10px] text-slate-400 sm:inline-flex">
                    <MapPin className="h-2.5 w-2.5" aria-hidden />
                    <span className="max-w-[5rem] truncate">{trip.destination}</span>
                  </span>
                ) : null}
              </Link>
            ))
          : null}

        {extra > 0 && onSelectFilter ? (
          <button
            type="button"
            onClick={onSelectFilter}
            className="inline-flex shrink-0 items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300"
          >
            +{extra} más
          </button>
        ) : null}
      </div>

      {trips.length === 1 ? (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Marca más viajes como favoritos desde cada tarjeta para tenerlos aquí.
        </p>
      ) : null}
    </section>
  );
}
