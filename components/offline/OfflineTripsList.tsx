"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { getOfflineTripIndex } from "@/lib/offline/db";
import type { OfflineTripIndexEntry } from "@/lib/offline/types";

function formatSyncDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(
      new Date(iso)
    );
  } catch {
    return "";
  }
}

export default function OfflineTripsList() {
  const [trips, setTrips] = useState<OfflineTripIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getOfflineTripIndex().then((index) => {
      setTrips(index?.trips ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="text-sm text-[var(--text-secondary)]">Cargando viajes guardados…</p>;
  }

  if (trips.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-300/60 bg-amber-50/50 p-6 text-center dark:border-amber-800/40 dark:bg-amber-950/30">
        <WifiOff className="mx-auto h-8 w-8 text-amber-600" aria-hidden />
        <p className="mt-3 text-sm font-semibold text-amber-900 dark:text-amber-200">Ningún viaje guardado aún</p>
        <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-400">
          Entra a un viaje con WiFi; plan, listas y reservas se guardan solos para consultarlos sin red.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {trips.map((trip) => (
        <li key={trip.id}>
          <Link
            href={`/offline-viaje/${trip.id}`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 transition hover:border-[var(--brand-border)]"
          >
            <div className="min-w-0">
              <p className="truncate font-bold text-[var(--text-primary)]">{trip.name}</p>
              {trip.destination ? (
                <p className="truncate text-xs text-[var(--text-tertiary)]">{trip.destination}</p>
              ) : null}
            </div>
            <span className="shrink-0 text-[10px] text-[var(--text-tertiary)]">
              {formatSyncDate(trip.syncedAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
