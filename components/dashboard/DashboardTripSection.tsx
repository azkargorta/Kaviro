"use client";

import { useEffect, useRef, useState } from "react";
import TripCardItem from "@/components/dashboard/TripCardItem";
import Reveal from "@/components/ui/Reveal";
import { btnPrimary } from "@/components/ui/brandStyles";

import type { DashboardTrip } from "@/lib/dashboard-trip-types";

type Trip = DashboardTrip;

export default function DashboardTripSection({
  title,
  subtitle,
  trips,
  badge,
  accent,
  lockedTripIds,
  defaultOpen = false,
}: {
  title: string;
  subtitle: string;
  trips: Trip[];
  badge: string;
  accent: string;
  /** Lista serializable (p. ej. desde el servidor). */
  lockedTripIds: string[];
  /** Abrir la sección al cargar (p. ej. viajes en curso). */
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const expandedRef = useRef<HTMLDivElement | null>(null);
  const count = trips.length;
  const countLabel = `${count} viaje${count === 1 ? "" : "s"}`;

  useEffect(() => {
    if (!open) return;
    // Al desplegar, baja automáticamente para enseñar el contenido.
    expandedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open]);

  return (
    <Reveal variant="slide" as="section" className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-3 shadow-[var(--shadow-card)] sm:flex-row sm:justify-between sm:gap-3 sm:p-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold tracking-tight text-slate-950 sm:text-lg dark:text-white">{title}</h2>
          <p className="mt-0.5 hidden text-xs text-slate-500 sm:block sm:text-sm">{subtitle}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-800 sm:mt-1 sm:text-sm dark:text-slate-200">{countLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`${btnPrimary} min-h-[36px] shrink-0 rounded-lg px-3 py-1.5 text-xs sm:min-h-[40px] sm:text-sm`}
          aria-expanded={open}
        >
          <span className="sm:hidden">{open ? "Ocultar" : "Ver"}</span>
          <span className="hidden sm:inline">{open ? "Ocultar viajes" : "Mostrar viajes"}</span>
        </button>
      </div>

      {open ? (
        trips.length === 0 ? (
          <div
            ref={expandedRef}
            className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 dark:bg-[#080C14]/80 px-4 py-6 text-center text-xs text-slate-500 sm:text-sm"
          >
            No hay viajes en esta categoría.
          </div>
        ) : (
          <div
            ref={expandedRef}
            className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-page)] p-3 sm:p-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
              {trips.map((trip) => (
                <TripCardItem
                  key={trip.id}
                  trip={trip}
                  badge={badge}
                  accent={accent}
                  locked={lockedTripIds.includes(String(trip.id))}
                />
              ))}
            </div>
          </div>
        )
      ) : null}
    </Reveal>
  );
}
