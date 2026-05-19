"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import TripCardItem from "@/components/dashboard/TripCardItem";

type FavoriteTrip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string | null;
  is_favorite: boolean;
  badge: string;
  accent: string;
};

export default function DashboardFavoritesSection({
  trips,
  lockedTripIds,
}: {
  trips: FavoriteTrip[];
  lockedTripIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const expandedRef = useRef<HTMLDivElement | null>(null);
  const count = trips.length;
  const countLabel = `${count} viaje${count === 1 ? "" : "s"}`;

  useEffect(() => {
    if (!open) return;
    expandedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open]);

  if (trips.length === 0) return null;

  return (
    <section className="mx-auto max-w-2xl space-y-3">
      <div className="flex flex-col gap-2 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-white p-3 shadow-sm ring-1 ring-amber-900/[0.04] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4 dark:border-amber-400/20 dark:from-amber-950/20 dark:to-[#0F1623] dark:bg-[#0F1623]">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-amber-900 sm:text-lg dark:text-amber-300">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden />
            Viajes favoritos
          </h2>
          <p className="mt-0.5 text-xs text-amber-700/70 sm:text-sm dark:text-amber-400/60">
            Tus viajes marcados con estrella.
          </p>
          <p className="mt-1 text-xs font-semibold text-amber-800 sm:text-sm dark:text-amber-300">
            {countLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-200 sm:text-sm dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60"
          aria-expanded={open}
        >
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
          {open ? "Ocultar favoritos" : "Mostrar favoritos"}
        </button>
      </div>

      {open ? (
        trips.length === 0 ? (
          <div
            ref={expandedRef}
            className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-6 text-center text-xs text-amber-600 sm:text-sm dark:border-amber-400/20 dark:bg-amber-950/20"
          >
            No hay viajes favoritos aún.
          </div>
        ) : (
          <div
            ref={expandedRef}
            className="rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/60 to-white p-3 shadow-sm ring-1 ring-amber-900/[0.03] sm:p-4 dark:border-amber-400/20 dark:from-amber-950/10 dark:to-[#080C14]/80"
          >
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {trips.map((trip) => (
                <TripCardItem
                  key={trip.id}
                  trip={trip}
                  badge={trip.badge}
                  accent={trip.accent}
                  locked={lockedTripIds.includes(String(trip.id))}
                />
              ))}
            </div>
          </div>
        )
      ) : null}
    </section>
  );
}
