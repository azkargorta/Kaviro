import { haversineKm, type LatLng } from "@/lib/trip-ai/plannerStayRoute";

export function minSightsForDriveKm(km: number): number {
  if (!Number.isFinite(km) || km <= 0) return 3;
  if (km <= 250) return 3;
  if (km <= 420) return 2;
  return 1;
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
