export type TripForActivePick = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
};

/** Viaje en curso hoy (start <= hoy <= end). */
export function pickActiveTripToday(trips: TripForActivePick[]): TripForActivePick | null {
  const today = new Date().toISOString().slice(0, 10);
  for (const trip of trips) {
    const start = trip.start_date;
    const end = trip.end_date;
    if (start && end && start <= today && today <= end) return trip;
    if (start && !end && start <= today) return trip;
    if (!start && end && today <= end) return trip;
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
