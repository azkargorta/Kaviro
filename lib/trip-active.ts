export type TripForActivePick = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
};

/** Viaje en curso en una fecha (start <= día <= end, u otras variantes abiertas). */
export function isTripActiveOnDate(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  day: string
): boolean {
  const start = startDate?.slice(0, 10) || null;
  const end = endDate?.slice(0, 10) || null;
  if (start && end && start <= day && day <= end) return true;
  if (start && !end && start <= day) return true;
  if (!start && end && day <= end) return true;
  return false;
}

/** Viaje en curso hoy (start <= hoy <= end). */
export function pickActiveTripToday(trips: TripForActivePick[]): TripForActivePick | null {
  const today = new Date().toISOString().slice(0, 10);
  for (const trip of trips) {
    if (isTripActiveOnDate(trip.start_date, trip.end_date, today)) return trip;
  }
  return null;
}

/** Próximo viaje por fecha de inicio (futuro más cercano). */
export function pickNextUpcomingTrip(trips: TripForActivePick[]): TripForActivePick | null {
  const today = new Date().toISOString().slice(0, 10);
  const future = trips
    .filter((t) => t.start_date && t.start_date > today)
    .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)));
  return future[0] ?? null;
}

/** Mejor candidato para «Continuar»: hoy → próximo → el más reciente con fechas. */
export function pickContinueTrip(trips: TripForActivePick[]): TripForActivePick | null {
  return pickActiveTripToday(trips) ?? pickNextUpcomingTrip(trips) ?? trips[0] ?? null;
}
