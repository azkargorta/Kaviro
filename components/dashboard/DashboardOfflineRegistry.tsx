"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { saveOfflineTripIndexFromDashboard } from "@/lib/offline/db";
import type { OfflineTripIndexEntry } from "@/lib/offline/types";

type TripInput = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
};

export default function DashboardOfflineRegistry({ trips }: { trips: TripInput[] }) {
  useEffect(() => {
    if (!trips.length || typeof window === "undefined") return;
    const entries: OfflineTripIndexEntry[] = trips.map((t) => ({
      id: t.id,
      name: t.name,
      destination: t.destination,
      start_date: t.start_date,
      end_date: t.end_date,
      syncedAt: new Date(0).toISOString(),
    }));
    void saveOfflineTripIndexFromDashboard(entries);
  }, [trips]);

  return null;
}

/** Panel visible solo sin conexión en el dashboard (si la página cargó desde caché). */
export function DashboardOfflinePanel() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("offline", update);
    window.addEventListener("online", update);
    return () => {
      window.removeEventListener("offline", update);
      window.removeEventListener("online", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/40">
      <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Sin conexión</p>
      <p className="mt-1 text-xs text-amber-800 dark:text-amber-400">
        Abre un viaje que ya hayas usado con WiFi para ver plan, listas y reservas guardados.
      </p>
      <Link
        href="/offline-viaje"
        className="mt-3 inline-flex rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800"
      >
        Ver viajes guardados
      </Link>
    </section>
  );
}
