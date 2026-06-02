export type TripWeatherStay = {
  id: string;
  city: string;
  start_date: string;
  end_date: string;
};

function newStayId() {
  return `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeWeatherStays(raw: unknown): TripWeatherStay[] {
  if (!Array.isArray(raw)) return [];
  const out: TripWeatherStay[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const city = typeof (row as { city?: unknown }).city === "string" ? (row as { city: string }).city.trim() : "";
    const start_date =
      typeof (row as { start_date?: unknown }).start_date === "string"
        ? (row as { start_date: string }).start_date.slice(0, 10)
        : "";
    const end_date =
      typeof (row as { end_date?: unknown }).end_date === "string"
        ? (row as { end_date: string }).end_date.slice(0, 10)
        : "";
    if (!city || !start_date || !end_date) continue;
    if (start_date > end_date) continue;
    const id =
      typeof (row as { id?: unknown }).id === "string" && (row as { id: string }).id.trim()
        ? (row as { id: string }).id.trim()
        : newStayId();
    out.push({ id, city, start_date, end_date });
  }
  return out.sort((a, b) => a.start_date.localeCompare(b.start_date));
}

export function listTripDateRange(start: string | null | undefined, end: string | null | undefined): string[] {
  if (!start || !end || start > end) return [];
  const days: string[] = [];
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Ciudad de alojamiento activa en una fecha (ISO YYYY-MM-DD). */
export function resolveWeatherCityForDate(stays: TripWeatherStay[], dateIso: string): string | null {
  const d = dateIso.slice(0, 10);
  const hit = stays.find((s) => d >= s.start_date && d <= s.end_date);
  return hit?.city ?? null;
}

export function defaultWeatherStaysFromTrip(opts: {
  destination: string | null | undefined;
  start_date: string | null | undefined;
  end_date: string | null | undefined;
}): TripWeatherStay[] {
  const city = typeof opts.destination === "string" ? opts.destination.trim() : "";
  const start = opts.start_date?.slice(0, 10) || "";
  const end = opts.end_date?.slice(0, 10) || start;
  if (!city || !start) return [];
  return [{ id: newStayId(), city, start_date: start, end_date: end || start }];
}

export function validateWeatherStays(
  stays: TripWeatherStay[],
  tripStart: string | null,
  tripEnd: string | null
): string | null {
  for (const s of stays) {
    if (!s.city.trim()) return "Cada tramo necesita una ciudad.";
    if (!s.start_date || !s.end_date) return "Indica fechas de inicio y fin en cada ciudad.";
    if (s.start_date > s.end_date) return `En «${s.city}», la fecha de inicio no puede ser posterior a la de fin.`;
    if (tripStart && s.start_date < tripStart.slice(0, 10)) {
      return `«${s.city}» empieza antes del inicio del viaje.`;
    }
    if (tripEnd && s.end_date > tripEnd.slice(0, 10)) {
      return `«${s.city}» termina después del fin del viaje.`;
    }
  }
  return null;
}
