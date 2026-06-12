import type { TripWeatherStay } from "@/lib/trip-weather-stays";
import { resolveWeatherCityForDate } from "@/lib/trip-weather-stays";
import { primaryTripPlace } from "@/lib/trip-places";

export type TripWeatherDay = {
  date: string;
  tempMax: number | null;
  tempMin: number | null;
  code: number | null;
  /** mm of precipitation expected */
  precipMm: number | null;
  /** probability of precipitation 0-100 */
  precipProb: number | null;
};

export type TripWeatherResult = {
  locationLabel: string;
  days: TripWeatherDay[];
};

export type TripWeatherCityForecast = {
  city: string;
  weather: TripWeatherResult;
};

export type TripWeatherBundle = {
  /** Previsión principal (ciudad de hoy o primera del viaje) */
  primary: TripWeatherResult | null;
  /** Una previsión por ciudad configurada */
  byCity: TripWeatherCityForecast[];
  /** Ciudad activa hoy según tramos de alojamiento */
  activeCityToday: string | null;
};

/**
 * Previsión 7 días (Open-Meteo) a partir del texto de destino del viaje.
 * Devuelve null si no hay destino o falla geocoding / API.
 */
export async function getTripWeatherByDestination(
  destination: string | null | undefined
): Promise<TripWeatherResult | null> {
  const dest = typeof destination === "string" ? destination.trim() : "";
  if (!dest) return null;

  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(dest)}&count=1&language=es&format=json`,
      { next: { revalidate: 3600 } }
    );
    const geoPayload = (await geoResponse.json().catch(() => null)) as {
      results?: Array<{ latitude: number; longitude: number; name?: string; admin1?: string; country?: string }>;
    } | null;

    const result = geoPayload?.results?.[0];
    if (!geoResponse.ok || !result) return null;

    const { latitude, longitude } = result;
    const locationLabel = [result.name, result.admin1, result.country].filter(Boolean).join(", ");

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(latitude))}&longitude=${encodeURIComponent(String(longitude))}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&forecast_days=14&timezone=auto`,
      { next: { revalidate: 3600 } }
    );
    const weatherPayload = (await weatherResponse.json().catch(() => null)) as {
      daily?: { time?: string[]; temperature_2m_max?: number[]; temperature_2m_min?: number[]; weather_code?: number[]; precipitation_sum?: number[]; precipitation_probability_max?: number[] };
    } | null;

    if (!weatherResponse.ok || !weatherPayload?.daily?.time) return null;

    const { time, temperature_2m_max, temperature_2m_min, weather_code, precipitation_sum, precipitation_probability_max } = weatherPayload.daily;
    const days = (time as string[]).map((date, index) => ({
      date,
      tempMax: typeof temperature_2m_max?.[index] === "number" ? temperature_2m_max![index]! : null,
      tempMin: typeof temperature_2m_min?.[index] === "number" ? temperature_2m_min![index]! : null,
      code: typeof weather_code?.[index] === "number" ? weather_code![index]! : null,
      precipMm: typeof precipitation_sum?.[index] === "number" ? Math.round(precipitation_sum![index]! * 10) / 10 : null,
      precipProb: typeof precipitation_probability_max?.[index] === "number" ? precipitation_probability_max![index]! : null,
    }));

    return { locationLabel, days };
  } catch {
    return null;
  }
}

/** Previsión por ciudades de alojamiento; si no hay tramos, usa el destino del viaje. */
export async function getTripWeatherBundle(opts: {
  destination: string | null | undefined;
  weatherStays?: TripWeatherStay[];
  todayIso?: string;
}): Promise<TripWeatherBundle> {
  const today = opts.todayIso ?? new Date().toISOString().slice(0, 10);
  const stays = opts.weatherStays ?? [];
  const cities = new Set<string>();

  if (stays.length) {
    for (const s of stays) cities.add(s.city.trim());
  } else {
    const primary = primaryTripPlace(opts.destination);
    if (primary) cities.add(primary);
  }

  const byCity: TripWeatherCityForecast[] = [];
  for (const city of cities) {
    const weather = await getTripWeatherByDestination(city);
    if (weather) byCity.push({ city, weather });
  }

  const activeCityToday = stays.length ? resolveWeatherCityForDate(stays, today) : primaryTripPlace(opts.destination) || null;
  const primary =
    (activeCityToday && byCity.find((c) => c.city === activeCityToday)?.weather) ||
    byCity[0]?.weather ||
    null;

  return { primary, byCity, activeCityToday };
}
