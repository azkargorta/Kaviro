import type { OfflineTripIndex, TripOfflineBundle } from "@/lib/offline/types";

const DB_NAME = "kaviro-offline";
const DB_VERSION = 1;
const STORE = "kv";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
    tx.oncomplete = () => db.close();
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
  });
}

const bundleKey = (tripId: string) => `bundle:${tripId}`;
const INDEX_KEY = "index";

export async function saveTripOfflineBundle(bundle: TripOfflineBundle): Promise<void> {
  await idbSet(bundleKey(bundle.tripId), bundle);
}

export async function getTripOfflineBundle(tripId: string): Promise<TripOfflineBundle | null> {
  return idbGet<TripOfflineBundle>(bundleKey(tripId));
}

export async function getOfflineTripIndex(): Promise<OfflineTripIndex | null> {
  return idbGet<OfflineTripIndex>(INDEX_KEY);
}

export async function upsertOfflineTripIndexEntry(
  entry: OfflineTripIndex["trips"][number]
): Promise<void> {
  const prev = (await getOfflineTripIndex()) ?? { updatedAt: "", trips: [] };
  const trips = prev.trips.filter((t) => t.id !== entry.id);
  trips.unshift(entry);
  const index: OfflineTripIndex = {
    updatedAt: new Date().toISOString(),
    trips: trips.slice(0, 30),
  };
  await idbSet(INDEX_KEY, index);
}

export async function saveOfflineTripIndexFromDashboard(
  trips: OfflineTripIndex["trips"]
): Promise<void> {
  if (!trips.length) return;
  const prev = await getOfflineTripIndex();
  const byId = new Map<string, OfflineTripIndex["trips"][number]>();
  for (const t of prev?.trips ?? []) byId.set(t.id, t);
  for (const t of trips) {
    const existing = byId.get(t.id);
    byId.set(t.id, existing ? { ...existing, ...t, syncedAt: existing.syncedAt } : t);
  }
  const index: OfflineTripIndex = {
    updatedAt: new Date().toISOString(),
    trips: Array.from(byId.values()).slice(0, 30),
  };
  await idbSet(INDEX_KEY, index);
}
