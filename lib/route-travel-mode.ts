import type { OsrmProfile } from "@/lib/osrm/projectOsrmRoute";

/** Modos guardados en `trip_routes.travel_mode`. */
export type TripRouteTravelMode = "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";

export const ROUTE_TRAVEL_MODE_OPTIONS: ReadonlyArray<{
  value: TripRouteTravelMode;
  label: string;
  shortLabel: string;
}> = [
  { value: "DRIVING", label: "Coche", shortLabel: "Coche" },
  { value: "TRANSIT", label: "Transporte público", shortLabel: "TP" },
  { value: "WALKING", label: "A pie", shortLabel: "A pie" },
  { value: "BICYCLING", label: "Bicicleta", shortLabel: "Bici" },
] as const;

export function normalizeTripRouteTravelMode(raw: unknown): TripRouteTravelMode {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (s === "WALKING" || s === "WALK" || s === "FOOT" || s === "ON_FOOT") return "WALKING";
  if (s === "BICYCLING" || s === "CYCLING" || s === "BIKE" || s === "BICYCLE") return "BICYCLING";
  if (
    s === "TRANSIT" ||
    s === "PUBLIC_TRANSPORT" ||
    s === "PUBLICTRANSPORT" ||
    s === "METRO" ||
    s === "BUS" ||
    s === "TRAIN"
  ) {
    return "TRANSIT";
  }
  return "DRIVING";
}

export function travelModeLabel(mode: TripRouteTravelMode): string {
  return ROUTE_TRAVEL_MODE_OPTIONS.find((o) => o.value === mode)?.label ?? "Coche";
}

export function osrmProfileForTravelMode(mode: TripRouteTravelMode): OsrmProfile {
  if (mode === "WALKING") return "walking";
  if (mode === "BICYCLING") return "cycling";
  return "driving";
}

/** Inferencia desde texto libre (rutas automáticas). */
export function inferTravelModeFromText(text: string): TripRouteTravelMode {
  const t = String(text || "").toLowerCase();
  if (/\b(metro|autob[uú]s|bus|tranv[ií]a|tren urbano|transporte p[uú]blico|transit|public transport|ctp|emt)\b/.test(t)) {
    return "TRANSIT";
  }
  if (/\b(pie|andar|andando|caminar|caminando|a pie|walk|foot)\b/.test(t)) return "WALKING";
  if (/\b(bici|bicicleta|cycling|bike|ciclo)\b/.test(t)) return "BICYCLING";
  if (/\b(coche|carro|auto|driving|car|taxi|uber)\b/.test(t)) return "DRIVING";
  return "DRIVING";
}

export type OsrmMetrics = {
  distanceMeters: number | null;
  durationSeconds: number | null;
};

/** Ajusta distancia/tiempo según el modo elegido (p. ej. TP sin perfil OSRM). */
export function applyTravelModeToOsrmMetrics(
  mode: TripRouteTravelMode,
  metrics: OsrmMetrics
): OsrmMetrics & { transitApproximate?: boolean } {
  if (mode !== "TRANSIT") return metrics;
  const distanceMeters = metrics.distanceMeters;
  let durationSeconds = metrics.durationSeconds;
  if (typeof durationSeconds === "number" && Number.isFinite(durationSeconds)) {
    durationSeconds = Math.round(durationSeconds * 1.35 + 8 * 60);
  }
  return { distanceMeters, durationSeconds, transitApproximate: true };
}

export function travelModeDurationHint(mode: TripRouteTravelMode, transitApproximate?: boolean): string | null {
  if (mode === "TRANSIT" || transitApproximate) {
    return "Tiempo estimado en transporte público (paradas y transbordos incluidos de forma aproximada).";
  }
  return null;
}
