"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncTripOfflineBundle } from "@/lib/offline/sync-trip-bundle";

const PREFETCH_TABS = ["summary", "plan", "resources"] as const;

/**
 * Con conexión: guarda plan, listas y reservas en el dispositivo y precarga rutas clave.
 */
export default function TripOfflineSync({ tripId }: { tripId: string }) {
  const router = useRouter();
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!tripId || typeof window === "undefined") return;

    const run = () => {
      if (!navigator.onLine) return;
      if (syncedRef.current === tripId) return;
      syncedRef.current = tripId;
      void syncTripOfflineBundle(tripId);
      router.prefetch(`/offline-viaje/${tripId}`);
      for (const tab of PREFETCH_TABS) {
        router.prefetch(`/trip/${tripId}/${tab}`);
      }
    };

    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(run, { timeout: 8000 });
      } else {
        window.setTimeout(run, 2500);
      }
    };

    schedule();

    const onOnline = () => {
      syncedRef.current = null;
      schedule();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [tripId, router]);

  return null;
}
