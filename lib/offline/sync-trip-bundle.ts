import {
  getTripOfflineBundle,
  saveTripOfflineBundle,
  upsertOfflineTripIndexEntry,
} from "@/lib/offline/db";
import type { TripOfflineBundle } from "@/lib/offline/types";
import type { TripList, TripListItem } from "@/hooks/useTripLists";

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: "include" });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok || data?.error) return null;
    return data as T;
  } catch {
    return null;
  }
}

/** Descarga plan, listas (con ítems) y reservas al dispositivo. */
export async function syncTripOfflineBundle(tripId: string): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.onLine || !tripId) return false;

  const [activitiesPayload, listsPayload, resourcesPayload] = await Promise.all([
    fetchJson<{ trip: TripOfflineBundle["trip"]; activities: TripOfflineBundle["activities"] }>(
      `/api/trip-activities?tripId=${encodeURIComponent(tripId)}`
    ),
    fetchJson<{
      lists: TripList[];
      countsByList: Record<string, { total: number; done: number }>;
    }>(`/api/trip-lists?tripId=${encodeURIComponent(tripId)}`),
    fetchJson<{
      resources: TripOfflineBundle["resources"];
      reservations: TripOfflineBundle["reservations"];
    }>(`/api/trip-resources?tripId=${encodeURIComponent(tripId)}`),
  ]);

  if (!activitiesPayload?.activities) return false;

  const lists = listsPayload?.lists ?? [];
  const listItemsByListId: Record<string, TripListItem[]> = {};

  await Promise.all(
    lists.map(async (list) => {
      const itemsPayload = await fetchJson<{ items: TripListItem[] }>(
        `/api/trip-lists/${encodeURIComponent(list.id)}/items?tripId=${encodeURIComponent(tripId)}`
      );
      listItemsByListId[list.id] = itemsPayload?.items ?? [];
    })
  );

  const trip = activitiesPayload.trip ?? { id: tripId, name: "Viaje", destination: null };
  const bundle: TripOfflineBundle = {
    version: 1,
    tripId,
    syncedAt: new Date().toISOString(),
    trip: {
      id: trip.id ?? tripId,
      name: trip.name ?? "Viaje",
      destination: trip.destination ?? null,
    },
    activities: activitiesPayload.activities ?? [],
    lists,
    countsByList: listsPayload?.countsByList ?? {},
    listItemsByListId,
    reservations: resourcesPayload?.reservations ?? [],
    resources: resourcesPayload?.resources ?? [],
  };

  await saveTripOfflineBundle(bundle);
  await upsertOfflineTripIndexEntry({
    id: tripId,
    name: bundle.trip?.name ?? "Viaje",
    destination: bundle.trip?.destination ?? null,
    syncedAt: bundle.syncedAt,
  });

  return true;
}

/** Devuelve bundle local si existe (aunque haya red). */
export async function getLocalTripBundle(tripId: string): Promise<TripOfflineBundle | null> {
  return getTripOfflineBundle(tripId);
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}
