"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncTripOfflineBundle } from "@/lib/offline/sync-trip-bundle";

const PREFETCH_TABS = [
  "summary",
  "plan",
  "expenses",
  "map",
  "participants",
  "resources",
  "ai-chat",
  "settings",
] as const;

/**
 * Con conexión: precarga rutas del viaje y guarda datos offline en segundo plano.
 */
export default function TripOfflineSync({ tripId }: { tripId: string }) {
  const router = useRouter();
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!tripId || typeof window === "undefined") return;

    const prefetchRoutes = () => {
      router.prefetch("/dashboard");
      router.prefetch(`/offline-viaje/${tripId}`);
      for (const tab of PREFETCH_TABS) {
        router.prefetch(`/trip/${tripId}/${tab}`);
      }
    };

    const syncBundle = () => {
      if (!navigator.onLine) return;
      if (syncedRef.current === tripId) return;
      syncedRef.current = tripId;
      void syncTripOfflineBundle(tripId);
    };

    // Prefetch pronto para que el cambio de pestaña sea casi instantáneo.
    const prefetchTimer = window.setTimeout(prefetchRoutes, 200);

    const scheduleSync = () => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(syncBundle, { timeout: 12_000 });
      } else {
        window.setTimeout(syncBundle, 4000);
      }
    };

    scheduleSync();

    const onOnline = () => {
      syncedRef.current = null;
      prefetchRoutes();
      scheduleSync();
    };
    window.addEventListener("online", onOnline);
    return () => {
      window.clearTimeout(prefetchTimer);
      window.removeEventListener("online", onOnline);
    };
  }, [tripId, router]);

  return null;
}
