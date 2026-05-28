/**
 * Marcadores del protocolo IA (nombre interno TripBoard / legado del repo).
 * La marca visible es Kaviro; no cambiar estos strings sin migrar extractores y prompts.
 */

export const TRIPBOARD_ITINERARY_JSON_START = "TRIPBOARD_ITINERARY_JSON_START";
export const TRIPBOARD_ITINERARY_JSON_END = "TRIPBOARD_ITINERARY_JSON_END";

export const ITINERARY_JSON_START_ALIASES = [
  TRIPBOARD_ITINERARY_JSON_START,
  "KAVIRO_ITINERARY_JSON_START",
] as const;

export const ITINERARY_JSON_END_ALIASES = [
  TRIPBOARD_ITINERARY_JSON_END,
  "KAVIRO_ITINERARY_JSON_END",
] as const;

export function findItineraryJsonStart(text: string): { marker: string; index: number } | null {
  let best: { marker: string; index: number } | null = null;
  for (const marker of ITINERARY_JSON_START_ALIASES) {
    const index = text.indexOf(marker);
    if (index === -1) continue;
    if (!best || index < best.index) best = { marker, index };
  }
  return best;
}

export function findItineraryJsonEnd(text: string, fromIndex: number): { marker: string; index: number } | null {
  let best: { marker: string; index: number } | null = null;
  for (const marker of ITINERARY_JSON_END_ALIASES) {
    const index = text.indexOf(marker, fromIndex);
    if (index === -1) continue;
    if (!best || index < best.index) best = { marker, index };
  }
  return best;
}

export function stripItineraryJsonBlocksForDisplay(content: string): string {
  let out = content;
  for (;;) {
    const start = findItineraryJsonStart(out);
    if (!start) break;
    const end = findItineraryJsonEnd(out, start.index + start.marker.length);
    if (end) {
      out =
        out.slice(0, start.index) +
        "\n\n— Itinerario generado (revisa las tarjetas arriba) —\n\n" +
        out.slice(end.index + end.marker.length);
    } else {
      out =
        out.slice(0, start.index) +
        "\n\n— Itinerario en proceso (usa «Generar tarjetas» si no aparecen arriba) —\n\n";
    }
  }
  return out.replace(/\n{3,}/g, "\n\n").trim();
}
