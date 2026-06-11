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

function TripPill({
  trip,
  href,
  variant,
}: {
  trip: { id: string; name: string; destination?: string | null };
  href: string;
  variant: "favorite" | "recent";
}) {
  const initial = trip.destination?.trim().charAt(0).toUpperCase() || (variant === "favorite" ? "★" : "✈");

  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-xs font-semibold shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition hover:-translate-y-px hover:shadow-md ${
        variant === "favorite"
          ? "border-slate-200/90 bg-white text-slate-800 hover:border-[var(--brand-border)] hover:bg-[var(--brand-light)] dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-100"
          : "border-dashed border-slate-300/90 bg-slate-50/90 text-slate-700 hover:border-slate-400 hover:bg-white dark:border-slate-600 dark:bg-[#080C14]/60 dark:text-slate-200"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-bold ${
          variant === "favorite"
            ? "bg-[var(--brand-light)] text-[var(--brand)] ring-1 ring-[var(--brand-border)]"
            : "bg-white text-slate-600 ring-1 ring-slate-200/80 dark:bg-[#141c2b] dark:text-slate-300"
        }`}
      >
        {initial}
      </span>
      <span className="min-w-0">
        <span className="block max-w-[9rem] truncate">{trip.name}</span>
        {trip.destination ? (
          <span className="mt-0.5 flex items-center gap-0.5 text-[10px] font-medium text-slate-400">
            <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden />
            <span className="max-w-[7rem] truncate">{trip.destination}</span>
          </span>
        ) : null}
      </span>
      {variant === "favorite" ? (
        <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
      ) : (
        <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
      )}
    </Link>
  );
}

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
  const recentFiltered = recentTrips
    .filter((t) => !trips.some((f) => f.id === t.id))
    .slice(0, 3);
  const showRecents = recentFiltered.length > 0;

  if (trips.length === 0 && !showRecents) return null;

  return (
    <section className="space-y-4">
      {trips.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className={`flex items-center gap-1.5 ${DASHBOARD_SECTION_EYEBROW}`}>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                Favoritos
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Tus viajes marcados con estrella.
              </p>
            </div>
            {onSelectFilter ? (
              <button
                type="button"
                onClick={onSelectFilter}
                className="shrink-0 text-xs font-semibold text-slate-500 transition hover:text-[var(--brand)]"
              >
                Ver todos
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleFavorites.map((trip) => (
              <TripPill
                key={trip.id}
                trip={trip}
                href={`/trip/${encodeURIComponent(trip.id)}`}
                variant="favorite"
              />
            ))}
            {extra > 0 && onSelectFilter ? (
              <button
                type="button"
                onClick={onSelectFilter}
                className="inline-flex shrink-0 items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-white dark:border-slate-600 dark:bg-slate-900/40"
              >
                +{extra} más
              </button>
            ) : null}
          </div>
          {trips.length === 1 ? (
            <p className="text-[11px] text-slate-400">
              Marca más viajes como favoritos desde cada tarjeta.
            </p>
          ) : null}
        </div>
      ) : null}

      {showRecents ? (
        <div className="space-y-2">
          <div>
            <h2 className={`flex items-center gap-1.5 ${DASHBOARD_SECTION_EYEBROW}`}>
              <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden />
              Últimos añadidos
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Viajes recientes en tu biblioteca.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentFiltered.map((trip) => (
              <TripPill
                key={trip.id}
                trip={trip}
                href={`/trip/${encodeURIComponent(trip.id)}`}
                variant="recent"
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
