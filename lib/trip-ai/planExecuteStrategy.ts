import type { ExecutableItineraryPayload } from "@/lib/trip-ai/tripCreationTypes";

/** Importaciones masivas (calendario agencia): insertar actividades sin geocodificar ni rutas. */
export function shouldFastExecuteItinerary(itinerary: ExecutableItineraryPayload): boolean {
  const items = itinerary.days.flatMap((d) => d.items ?? []);
  if (items.length <= 2) return false;
  if (items.length >= 6) return true;

  const withGeo = items.filter((it) => {
    const p = typeof it.place_name === "string" ? it.place_name.trim() : "";
    const a = typeof it.address === "string" ? it.address.trim() : "";
    return Boolean(p || a);
  }).length;

  return withGeo / Math.max(items.length, 1) < 0.4;
}

/** Trocea por días para evitar timeout en ejecuciones lentas (geocodificación). */
export function chunkItineraryByDays(
  itinerary: ExecutableItineraryPayload,
  maxDaysPerChunk: number
): ExecutableItineraryPayload[] {
  const days = itinerary.days.filter((d) => (d.items?.length ?? 0) > 0);
  if (days.length <= maxDaysPerChunk) return [itinerary];

  const chunks: ExecutableItineraryPayload[] = [];
  for (let i = 0; i < days.length; i += maxDaysPerChunk) {
    chunks.push({
      ...itinerary,
      days: days.slice(i, i + maxDaysPerChunk),
    });
  }
  return chunks;
}
