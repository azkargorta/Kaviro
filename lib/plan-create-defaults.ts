import { isTripActiveOnDate } from "@/lib/trip-active";
import { todayYMD } from "@/lib/trip-activity-visual";
import { listTripDateRange } from "@/lib/trip-weather-stays";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isPlanDateKey(value: string | null | undefined): value is string {
  return typeof value === "string" && DATE_RE.test(value);
}

/** Día activo en la tabla → primer día del viaje → primer día con actividades. */
export function resolveCreatePlanDate(input: {
  selectedDate?: string | null;
  tripStartDate?: string | null;
  activityDays?: string[];
}): string | null {
  if (isPlanDateKey(input.selectedDate)) return input.selectedDate;
  if (isPlanDateKey(input.tripStartDate)) return input.tripStartDate;
  const first = (input.activityDays ?? []).find((d) => isPlanDateKey(d));
  return first ?? null;
}

/**
 * Pestañas de días del itinerario.
 * En viaje en curso: todos los días del rango del viaje (aunque no tengan actividades).
 */
export function resolvePlanItineraryDays(input: {
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  activityDays: string[];
  today?: string;
}): string[] {
  const today = input.today ?? todayYMD();
  const start = input.tripStartDate?.slice(0, 10) || null;
  const end = input.tripEndDate?.slice(0, 10) || null;

  if (isTripActiveOnDate(start, end, today)) {
    const range = listTripDateRange(start, end);
    if (range.length > 0) return range;
    if (start && start <= today) return listTripDateRange(start, today);
    if (input.activityDays.length > 0) {
      const merged = new Set(input.activityDays);
      merged.add(today);
      return [...merged].sort();
    }
    return [today];
  }

  return input.activityDays;
}

/** Día inicial al abrir Plan: hoy si el viaje está en curso; si no, primer día disponible. */
export function resolvePlanDefaultSelectedDate(input: {
  explicitDate?: string | null;
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  itineraryDays: string[];
  today?: string;
}): string | null {
  if (isPlanDateKey(input.explicitDate)) return input.explicitDate;

  const today = input.today ?? todayYMD();
  const start = input.tripStartDate?.slice(0, 10) || null;
  const end = input.tripEndDate?.slice(0, 10) || null;

  if (isTripActiveOnDate(start, end, today) && input.itineraryDays.includes(today)) {
    return today;
  }

  if (input.itineraryDays.length > 0) return input.itineraryDays[0]!;

  return resolveCreatePlanDate({
    tripStartDate: input.tripStartDate,
    activityDays: input.itineraryDays,
  });
}
