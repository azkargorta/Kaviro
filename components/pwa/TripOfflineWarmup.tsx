"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Pestañas del viaje que conviene precargar para uso offline (solo lectura). */
const TRIP_TAB_PATHS = [
  "summary",
  "plan",
  "expenses",
  "ai-chat",
  "map",
  "participants",
  "resources",
  "settings",
] as const;

const DATA_WARMUP_PATHS = [
  (tripId: string) => `/api/trip-activities?tripId=${encodeURIComponent(tripId)}`,
  (tripId: string) => `/api/trip-expenses?tripId=${encodeURIComponent(tripId)}`,
  (tripId: string) => `/api/trip-participants?tripId=${encodeURIComponent(tripId)}`,
  (tripId: string) => `/api/trip-routes?tripId=${encodeURIComponent(tripId)}`,
  (tripId: string) => `/api/trip-resources?tripId=${encodeURIComponent(tripId)}`,
  (tripId: string) => `/api/trip-lists?tripId=${encodeURIComponent(tripId)}`,
  (tripId: string) => `/api/trip-activity-kinds?tripId=${encodeURIComponent(tripId)}`,
];

/**
 * Con conexión, precarga rutas y APIs del viaje para que el service worker pueda
 * servirlas en modo avión (navegación entre pestañas + lectura de datos).
 */
export default function TripOfflineWarmup({ tripId }: { tripId: string }) {
  const router = useRouter();
  const warmedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!tripId || typeof window === "undefined") return;
    if (!navigator.onLine) return;
    if (warmedRef.current === tripId) return;
    warmedRef.current = tripId;

    for (const tab of TRIP_TAB_PATHS) {
      router.prefetch(`/trip/${tripId}/${tab}`);
    }

    const run = () => {
      for (const path of DATA_WARMUP_PATHS) {
        void fetch(path(tripId), { credentials: "include" }).catch(() => {});
      }
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 800);
    return () => window.clearTimeout(t);
  }, [tripId, router]);

  return null;
}
