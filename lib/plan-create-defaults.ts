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
