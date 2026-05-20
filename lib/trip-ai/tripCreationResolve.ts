import type { TripCreationFollowUp, TripCreationIntent } from "@/lib/trip-ai/tripCreationTypes";
import { addDaysIso, daysBetweenInclusive, defaultTripStartDate, isIsoDate } from "@/lib/trip-ai/tripCreationDates";

const LONG_TRIP_WARNING_DAYS = 30;

const ARRAY_KEYS = ["interests", "travelStyle", "constraints", "mustSee"] as const;

function mergeStringArrays(prev: string[] | undefined, next: string[] | null | undefined): string[] | undefined {
  if (next === undefined) return prev;
  if (next === null) return prev?.length ? prev : undefined;
  const merged = [...new Set([...(prev || []), ...next].map((s) => String(s || "").trim()).filter(Boolean))];
  return merged.length ? merged : undefined;
}

export function mergeTripCreationIntent(base: TripCreationIntent, patch: TripCreationIntent): TripCreationIntent {
  const out: TripCreationIntent = { ...base };

  for (const key of ARRAY_KEYS) {
    out[key] = mergeStringArrays(out[key], patch[key]);
  }

  const assign = <K extends keyof TripCreationIntent>(key: K, value: TripCreationIntent[K] | undefined) => {
    if (value === undefined) return;
    if (value === null) {
      const existing = out[key];
      if (typeof existing === "string" && existing.trim()) return;
    }
    out[key] = value as TripCreationIntent[K];
  };

  assign("destination", patch.destination);
  assign("startLocation", patch.startLocation);
  assign("endLocation", patch.endLocation);
  assign("durationDays", patch.durationDays);
  assign("startDate", patch.startDate);
  assign("endDate", patch.endDate);
  assign("travelersCount", patch.travelersCount);
  assign("travelersType", patch.travelersType);
  assign("budgetLevel", patch.budgetLevel);
  assign("wantsRouteOptimization", patch.wantsRouteOptimization);
  assign("wantsBudgetPlan", patch.wantsBudgetPlan);
  assign("suggestedTripName", patch.suggestedTripName);

  return out;
}

export function getTripCreationFollowUp(intent: TripCreationIntent): TripCreationFollowUp | null {
  const dest = typeof intent.destination === "string" && intent.destination.trim();
  if (!dest) {
    return {
      code: "destination",
      question: "¿A qué destino o ciudad vais? (con el nombre basta)",
    };
  }

  const dur = typeof intent.durationDays === "number" && Number.isFinite(intent.durationDays) ? Math.round(intent.durationDays) : null;
  const hasDuration = dur != null && dur > 0;
  const hasRange = isIsoDate(intent.startDate) && isIsoDate(intent.endDate);
  const hasStartAndDuration = isIsoDate(intent.startDate) && hasDuration;

  if (!hasDuration && !hasRange && !hasStartAndDuration) {
    return {
      code: "duration_or_dates",
      question: "¿Cuántos días dura el viaje? (ej.: 4) O indica fecha de inicio y fin.",
    };
  }
  return null;
}

export type ResolvedTripCreation = {
  destination: string;
  startDate: string;
  endDate: string;
  tripDurationDays: number;
  durationDays: number;
  durationWarning?: string | null;
  intent: TripCreationIntent;
  datesInferred?: boolean;
};

export function resolveTripCreationDates(intent: TripCreationIntent): ResolvedTripCreation | { error: string } {
  const destination = (intent.destination || "").trim();
  if (!destination) return { error: "Falta destino." };

  let startDate: string | null = isIsoDate(intent.startDate) ? intent.startDate : null;
  let endDate: string | null = isIsoDate(intent.endDate) ? intent.endDate : null;
  const rawDur =
    typeof intent.durationDays === "number" && Number.isFinite(intent.durationDays) ? Math.round(intent.durationDays) : null;

  if (startDate && endDate) {
    if (endDate < startDate) return { error: "La fecha de fin no puede ser anterior al inicio." };
    const tripDurationDays = Math.max(1, daysBetweenInclusive(startDate, endDate));
    const durationWarning = tripDurationDays > LONG_TRIP_WARNING_DAYS ? "Viaje más largo de lo habitual." : null;
    return {
      destination,
      startDate,
      endDate,
      tripDurationDays,
      durationDays: tripDurationDays,
      durationWarning,
      intent: { ...intent, destination, startDate, endDate, durationDays: tripDurationDays },
      datesInferred: false,
    };
  }

  if (startDate && rawDur != null && rawDur > 0) {
    const tripDurationDays = Math.max(1, rawDur);
    endDate = addDaysIso(startDate, tripDurationDays - 1);
    const durationWarning = tripDurationDays > LONG_TRIP_WARNING_DAYS ? "Viaje más largo de lo habitual." : null;
    return {
      destination,
      startDate,
      endDate,
      tripDurationDays,
      durationDays: tripDurationDays,
      durationWarning,
      intent: { ...intent, destination, startDate, endDate, durationDays: tripDurationDays },
      datesInferred: false,
    };
  }

  if (rawDur != null && rawDur > 0) {
    const usedDefaultStart = !startDate;
    const s = startDate || defaultTripStartDate();
    const tripDurationDays = Math.max(1, rawDur);
    startDate = s;
    endDate = addDaysIso(s, tripDurationDays - 1);
    const durationWarning = tripDurationDays > LONG_TRIP_WARNING_DAYS ? "Viaje más largo de lo habitual." : null;
    return {
      destination,
      startDate,
      endDate,
      tripDurationDays,
      durationDays: tripDurationDays,
      durationWarning,
      intent: { ...intent, destination, startDate, endDate, durationDays: tripDurationDays },
      datesInferred: usedDefaultStart,
    };
  }

  return { error: "No se pudieron resolver fechas o duración." };
}

export function buildDefaultTripName(resolved: ResolvedTripCreation): string {
  const shortDest = resolved.destination.split(",")[0].trim().slice(0, 40);
  return `${shortDest} · ${resolved.durationDays} días`;
}
