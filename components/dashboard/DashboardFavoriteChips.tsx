"use client";

import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import type { DashboardTrip } from "@/lib/dashboard-trip-types";

type FavoriteTrip = DashboardTrip & {
  badge: string;
  accent: string;
  is_favorite: true;
};

export default function DashboardFavoriteChips({
  trips,
  onSelectFilter,
}: {
  trips: FavoriteTrip[];
  onSelectFilter?: () => void;
}) {
  if (trips.length === 0) return null;

  const visible = trips.slice(0, 5);
  const extra = trips.length - visible.length;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
          Favoritos
        </h2>
        {onSelectFilter ? (
          <button
            type="button"
            onClick={onSelectFilter}
            className="text-xs font-semibold text-slate-500 transition hover:text-[var(--brand)] dark:text-slate-400"
          >
            Ver todos
          </button>
        ) : null}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {visible.map((trip) => (
          <Link
            key={trip.id}
            href={`/trip/${encodeURIComponent(trip.id)}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-[var(--brand-border)] hover:bg-[var(--brand-light)] dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-200"
          >
            {trip.destination ? (
              <MapPin className="h-3 w-3 shrink-0 text-[var(--brand)]" aria-hidden />
            ) : (
              <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
            )}
            <span className="max-w-[10rem] truncate">{trip.name}</span>
          </Link>
        ))}
        {extra > 0 && onSelectFilter ? (
          <button
            type="button"
            onClick={onSelectFilter}
            className="inline-flex shrink-0 items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300"
          >
            +{extra} más
          </button>
        ) : null}
      </div>
    </section>
  );
}
