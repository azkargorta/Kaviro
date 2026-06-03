import type { OsrmProfile } from "@/lib/osrm/projectOsrmRoute";

/** Modos guardados en `trip_routes.travel_mode`. */
export type TripRouteTravelMode = "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";

/** Modo en JSON DayPlan del asistente «Organizar día». */
export type DayPlanTravelMode = "driving" | "walking" | "cycling" | "transit";

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
export function normalizeDayPlanTravelMode(raw: unknown): DayPlanTravelMode {
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase().replace(/\s+/g, "_");
    if (s === "driving" || s === "drive" || s === "coche" || s === "car") return "driving";
    if (s === "walking" || s === "walk" || s === "foot" || s === "on_foot") return "walking";
    if (s === "cycling" || s === "cycle" || s === "bike" || s === "bici" || s === "bicycle") return "cycling";
    if (
      s === "transit" ||
      s === "public_transport" ||
      s === "publictransport" ||
      s === "metro" ||
      s === "bus" ||
      s === "train" ||
      s === "transporte_publico"
    ) {
      return "transit";
    }
  }
  return "walking";
}

export function dayPlanTravelModeToTripRoute(mode: DayPlanTravelMode): TripRouteTravelMode {
  if (mode === "transit") return "TRANSIT";
  if (mode === "walking") return "WALKING";
  if (mode === "cycling") return "BICYCLING";
  return "DRIVING";
}

/** Inferencia desde mensajes del usuario (organizar día / rutas automáticas). */
export function inferDayPlanTravelModeFromHint(text: string): DayPlanTravelMode {
  const t = String(text || "").toLowerCase();
  if (/\b(metro|autob[uú]s|bus|tranv[ií]a|transporte p[uú]blico|transit|public transport|subway|tren urbano|ctp|emt)\b/.test(t)) {
    return "transit";
  }
  if (/\b(bici|bicicleta|cycling|bike|ciclo)\b/.test(t)) return "cycling";
  if (/\b(coche|driving|en coche|\bcar\b|taxi|uber)\b/.test(t)) return "driving";
  return "walking";
}

export function inferTravelModeFromText(text: string): TripRouteTravelMode {
  return dayPlanTravelModeToTripRoute(inferDayPlanTravelModeFromHint(text));
}

export type OsrmMetrics = {
  distanceMeters: number | null;
  durationSeconds: number | null;
};

/** Velocidad media urbana (km/h) para estimar si OSRM devolvió otro perfil. */
const TYPICAL_SPEED_KMH: Record<TripRouteTravelMode, number> = {
  WALKING: 4.5,
  BICYCLING: 14,
  DRIVING: 45,
  TRANSIT: 22,
};

/** Límites plausibles de velocidad media (km/h) por modo. */
const SPEED_BOUNDS_KMH: Record<TripRouteTravelMode, { min: number; max: number }> = {
  WALKING: { min: 2, max: 7 },
  BICYCLING: { min: 8, max: 32 },
  DRIVING: { min: 12, max: 130 },
  TRANSIT: { min: 8, max: 90 },
};

function estimateDurationSeconds(mode: TripRouteTravelMode, distanceMeters: number): number {
  const km = distanceMeters / 1000;
  const speed = TYPICAL_SPEED_KMH[mode];
  return Math.max(60, Math.round((km / speed) * 3600));
}

function impliedSpeedKmh(distanceMeters: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return distanceMeters / 1000 / (durationSeconds / 3600);
}

/**
 * Alinea distancia/tiempo con el modo elegido.
 * OSRM a veces devuelve tiempos de coche aunque se pida walking, o falla en trayectos largos.
 */
export function applyTravelModeToOsrmMetrics(
  mode: TripRouteTravelMode,
  metrics: OsrmMetrics
): OsrmMetrics & { transitApproximate?: boolean; durationAdjusted?: boolean } {
  const distanceMeters = metrics.distanceMeters;
  let durationSeconds = metrics.durationSeconds;

  if (typeof distanceMeters === "number" && distanceMeters > 0) {
    const bounds = SPEED_BOUNDS_KMH[mode];
    const speed =
      typeof durationSeconds === "number" && durationSeconds > 0
        ? impliedSpeedKmh(distanceMeters, durationSeconds)
        : 0;
    const outOfRange = !speed || speed < bounds.min || speed > bounds.max;
    if (outOfRange) {
      durationSeconds = estimateDurationSeconds(mode, distanceMeters);
      if (mode === "TRANSIT") {
        durationSeconds = Math.round(durationSeconds * 1.2 + 8 * 60);
        return { distanceMeters, durationSeconds, transitApproximate: true, durationAdjusted: true };
      }
      return { distanceMeters, durationSeconds, durationAdjusted: true };
    }
  }

  if (mode !== "TRANSIT") return { distanceMeters, durationSeconds };

  if (typeof durationSeconds === "number" && Number.isFinite(durationSeconds)) {
    durationSeconds = Math.round(durationSeconds * 1.35 + 8 * 60);
  }
  return { distanceMeters, durationSeconds, transitApproximate: true };
}

export function travelModeDurationHint(
  mode: TripRouteTravelMode,
  opts?: { transitApproximate?: boolean; durationAdjusted?: boolean }
): string | null {
  if (opts?.durationAdjusted) {
    return "Duración recalculada según el modo de transporte elegido (el motor de rutas no devolvió un tiempo coherente).";
  }
  if (mode === "TRANSIT" || opts?.transitApproximate) {
    return "Tiempo estimado en transporte público (paradas y transbordos incluidos de forma aproximada).";
  }
  return null;
}
