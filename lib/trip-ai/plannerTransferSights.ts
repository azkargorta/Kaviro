import { haversineKm, type LatLng } from "@/lib/trip-ai/plannerStayRoute";

export function minSightsForDriveKm(km: number): number {
  if (!Number.isFinite(km) || km <= 0) return 3;
  const hours = (km * 1.3) / 55;
  return minSightsForDriveHours(hours);
}

export function minSightsForDriveHours(hours: number): number {
  if (!Number.isFinite(hours) || hours <= 2.5) return 3;
  if (hours <= 4) return 2;
  if (hours <= 5.5) return 1;
  return 1;
}

function clockToMin(t: string | null | undefined): number {
  const s = String(t || "").trim();
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 8 * 60 + 30;
  return Number(m[1]) * 60 + Number(m[2]);
}

function minToClock(total: number): string {
  const n = Math.max(0, Math.min(23 * 60 + 59, Math.round(total)));
  const h = Math.floor(n / 60);
  const min = n % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function skipLunch(min: number): number {
  if (min >= 13 * 60 && min < 14 * 60 + 30) return 14 * 60 + 30;
  return min;
}

export type TransferSchedulable = {
  activity_time?: string | null;
  activity_kind?: string;
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
  description?: string | null;
};

/** Ordena paradas a lo largo del trayecto y les pone horas coherentes con el coche. */
export function scheduleAlongTransfer<T extends TransferSchedulable>(
  items: T[],
  from: LatLng | null,
  to: LatLng | null,
  driveHours: number,
  startClock = "08:30",
  latestMin = 18 * 60
): T[] {
  const transport = items.filter((it) => String(it.activity_kind || "").toLowerCase() === "transport");
  const rest = items.filter((it) => String(it.activity_kind || "").toLowerCase() === "rest");
  const sights = items.filter((it) => {
    const k = String(it.activity_kind || "").toLowerCase();
    return k !== "transport" && k !== "rest";
  });
  const maxSights = driveHours >= 5.5 ? 1 : driveHours >= 4 ? 2 : 3;
  const sorted = [...sights].sort((a, b) => {
    if (!from) return 0;
    const da =
      typeof a.latitude === "number" && typeof a.longitude === "number"
        ? haversineKm(from, { lat: a.latitude, lng: a.longitude })
        : 999;
    const db =
      typeof b.latitude === "number" && typeof b.longitude === "number"
        ? haversineKm(from, { lat: b.latitude, lng: b.longitude })
        : 999;
    return da - db;
  });
  const kept = sorted.slice(0, maxSights);
  let cursor = skipLunch(clockToMin(startClock) + Math.min(90, Math.round(driveHours * 20)));
  const timed = kept.map((it) => {
    cursor = skipLunch(cursor);
    const activity_time = minToClock(cursor);
    cursor = skipLunch(cursor + 120);
    const onRoute = from && to && typeof it.latitude === "number" && typeof it.longitude === "number"
      ? pointIsAlongRoute({ lat: it.latitude, lng: it.longitude }, from, to)
      : true;
    const title = String(it.title || "");
    const prefixed =
      onRoute && title && !/^parada en ruta/i.test(title) && from && to
        ? `Parada en ruta: ${title}`
        : title;
    return { ...it, activity_time, title: prefixed || it.title };
  }).filter((it) => clockToMin(it.activity_time) <= latestMin);
  return [...transport, ...timed, ...rest];
}

export function notesWantSightsOnTransferDays(notes: string): boolean {
  return /\b(traslado|excursi[oó]n(?:es)?|sitios de camino|por el camino|a[nñ]ade(?:s|r)? cosas|cosas que ver)\b/i.test(
    notes
  );
}

/** True if `p` no se desvía mucho del trayecto from → to. */
export function pointIsAlongRoute(p: LatLng, from: LatLng, to: LatLng, maxDetourKm = 55): boolean {
  const ab = haversineKm(from, to);
  const ap = haversineKm(from, p);
  const pb = haversineKm(p, to);
  if (ab < 8) return Math.min(ap, pb) <= maxDetourKm;
  const detour = ap + pb - ab;
  return detour <= maxDetourKm && ap <= ab + maxDetourKm && pb <= ab + maxDetourKm;
}

export function shouldKeepPoiOnTransferDay(
  p: LatLng,
  cityCenter: LatLng | null,
  prevCenter: LatLng | null,
  otherStops: Array<{ label: string; center: LatLng }>,
  prevLabel?: string | null
): boolean {
  if (cityCenter && haversineKm(p, cityCenter) <= 45) return true;
  if (cityCenter && prevCenter && pointIsAlongRoute(p, prevCenter, cityCenter)) return true;
  const others = otherStops.filter((s) => {
    const a = s.label.trim().toLowerCase();
    const b = (prevLabel || "").trim().toLowerCase();
    return a && a !== b;
  });
  if (!cityCenter || !others.length) return true;
  const here = haversineKm(p, cityCenter);
  for (const other of others) {
    const there = haversineKm(p, other.center);
    if (there + 30 < here && here > 50) return false;
  }
  return true;
}
