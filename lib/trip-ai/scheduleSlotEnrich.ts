import type { ItineraryDayPayload } from "@/lib/trip-ai/tripCreationTypes";
import { normalizeItineraryItem } from "@/lib/trip-ai/itineraryDraftUtils";

export type ScheduleSlot = { time: string; label: string; line: string };

/** Extrae lugar legible de la línea del dossier (p. ej. «Desayuno en Hotel NH Florida»). */
export function parsePlaceFromScheduleLabel(label: string): {
  place_name: string | null;
  title: string;
} {
  const raw = label.trim();
  if (!raw) return { place_name: null, title: "Actividad" };

  const enMatch = raw.match(/\b(?:en|en el|en la|at|@)\s+(.+)$/i);
  if (enMatch) {
    const place = enMatch[1]!.trim();
    const title = raw.slice(0, enMatch.index).trim().replace(/\s*[-–—]\s*$/, "") || raw;
    return { place_name: place, title: title || raw };
  }

  const hotelMatch = raw.match(/\b(hotel|hostal|residencia|apartamento)\s+(.+)$/i);
  if (hotelMatch) {
    return {
      place_name: `${hotelMatch[1]} ${hotelMatch[2]}`.trim(),
      title: raw,
    };
  }

  const airportMatch = raw.match(/\b(T\d|T1|T2|T3|terminal\s*\d+|aeropuerto\s+.+)$/i);
  if (airportMatch) {
    return { place_name: airportMatch[1]!.trim(), title: raw };
  }

  const routeMatch = raw.match(
    /\b([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s-]{2,}(?:\s*[-–—/]\s*[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s-]{2,})+)\b/
  );
  if (/vuelo|flight|aterrizaje|traslado|transfer/i.test(raw) && routeMatch) {
    return { place_name: routeMatch[1]!.trim(), title: raw };
  }

  const cityTail = raw.match(
    /\b(?:en|sur|norte|centro)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)\s*$/i
  );
  if (cityTail) {
    return { place_name: cityTail[1]!.trim(), title: raw };
  }

  return { place_name: null, title: raw };
}

/** La hora del dossier manda; rellena lugar si la IA no lo puso. */
export function enrichItemFromScheduleSlot(
  item: ItineraryDayPayload["items"][number],
  slot: ScheduleSlot,
  inferKind?: (label: string) => string | null
): ItineraryDayPayload["items"][number] {
  const parsed = parsePlaceFromScheduleLabel(slot.label);
  const title =
    item.title?.trim() && item.title.trim().length >= 3 ? item.title.trim() : parsed.title;

  return normalizeItineraryItem({
    ...item,
    title: title || slot.label,
    start_time: slot.time,
    place_name: item.place_name?.trim() || parsed.place_name,
    address: item.address?.trim() || null,
    activity_kind: item.activity_kind || (inferKind ? inferKind(slot.label) : null),
  });
}
