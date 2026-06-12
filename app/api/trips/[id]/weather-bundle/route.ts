import { NextResponse } from "next/server";
import { requireTripAccessApi } from "@/lib/trip-access-api";
import { loadTripSettingsRow } from "@/lib/load-trip-settings-row";
import { getTripWeatherBundle } from "@/lib/trip-weather";
import { normalizeWeatherStays } from "@/lib/trip-weather-stays";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const CACHE_CONTROL = "private, max-age=3600, stale-while-revalidate=600";

export async function GET(_request: Request, context: RouteContext) {
  const { id: tripId } = await context.params;
  const access = await requireTripAccessApi(tripId);
  if (!access.ok) return access.response;

  type TripWeatherRow = { destination?: string | null; weather_stays?: unknown };
  let tripRow: TripWeatherRow | null = null;
  try {
    const loaded = await loadTripSettingsRow(access.supabase, tripId);
    tripRow = loaded.data as TripWeatherRow | null;
  } catch {
    return NextResponse.json({ error: "No se pudo cargar el viaje." }, { status: 500 });
  }

  if (!tripRow) {
    return NextResponse.json({ error: "Viaje no encontrado." }, { status: 404 });
  }

  const weatherStays = normalizeWeatherStays(tripRow.weather_stays);
  const hasPlace = weatherStays.length > 0 || Boolean(String(tripRow.destination ?? "").trim());

  if (!hasPlace) {
    return NextResponse.json(
      { primary: null, byCity: [], activeCityToday: null, weatherHint: "no-destination" as const },
      { headers: { "Cache-Control": CACHE_CONTROL } }
    );
  }

  const bundle = await getTripWeatherBundle({
    destination: tripRow.destination,
    weatherStays,
  });

  const weatherHint = bundle.primary ? ("ok" as const) : ("unavailable" as const);

  return NextResponse.json(
    { ...bundle, weatherHint },
    { headers: { "Cache-Control": CACHE_CONTROL } }
  );
}
