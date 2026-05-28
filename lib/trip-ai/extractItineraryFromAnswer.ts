import { normalizeItineraryItem, type ItineraryDraftPayload } from "@/lib/trip-ai/itineraryDraftUtils";
import {
  findItineraryJsonEnd,
  findItineraryJsonStart,
  TRIPBOARD_ITINERARY_JSON_END,
  TRIPBOARD_ITINERARY_JSON_START,
} from "@/lib/trip-ai/tripboardJsonMarkers";

function parseItineraryObject(parsed: unknown): ItineraryDraftPayload | null {
  if (!parsed || typeof parsed !== "object") return null;
  const row = parsed as Record<string, unknown>;
  if (row.version !== 1 || !Array.isArray(row.days)) return null;

  const days = row.days.map((day: unknown, index: number) => {
    const d = day && typeof day === "object" ? (day as Record<string, unknown>) : {};
    return {
      day: typeof d.day === "number" ? d.day : index + 1,
      date: typeof d.date === "string" ? d.date : null,
      items: Array.isArray(d.items) ? d.items.map(normalizeItineraryItem) : [],
    };
  });

  if (!days.some((d) => d.items.length > 0)) return null;

  return {
    version: 1,
    title: typeof row.title === "string" ? row.title : undefined,
    travelMode:
      row.travelMode === "driving" || row.travelMode === "walking" || row.travelMode === "cycling"
        ? row.travelMode
        : undefined,
    days,
  };
}

function tryParseJsonSlice(raw: string): ItineraryDraftPayload | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return parseItineraryObject(JSON.parse(trimmed));
  } catch {
    return null;
  }
}

/** Localiza el primer objeto JSON con `version` + `days` (respuestas sin marcadores). */
function extractLooseJsonObject(text: string): ItineraryDraftPayload | null {
  const needle = '"days"';
  let searchFrom = 0;
  while (searchFrom < text.length) {
    const daysIdx = text.indexOf(needle, searchFrom);
    if (daysIdx === -1) break;
    let start = text.lastIndexOf("{", daysIdx);
    if (start === -1) {
      searchFrom = daysIdx + needle.length;
      continue;
    }
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          const parsed = tryParseJsonSlice(text.slice(start, i + 1));
          if (parsed) return parsed;
          break;
        }
      }
    }
    searchFrom = daysIdx + needle.length;
  }
  return null;
}

function extractFromFencedJson(text: string): ItineraryDraftPayload | null {
  const re = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const parsed = tryParseJsonSlice(match[1]);
    if (parsed) return parsed;
  }
  return null;
}

function extractFromMarkers(text: string): ItineraryDraftPayload | null {
  const start = findItineraryJsonStart(text);
  if (!start) return null;

  const payloadStart = start.index + start.marker.length;
  const end = findItineraryJsonEnd(text, payloadStart);

  if (end) {
    return tryParseJsonSlice(text.slice(payloadStart, end.index));
  }

  // JSON truncado (solo START): intentar parsear objeto incompleto
  const tail = text.slice(payloadStart).trim();
  const loose = extractLooseJsonObject(tail) ?? tryParseJsonSlice(tail);
  return loose;
}

export function extractItineraryFromAnswer(answer: string): ItineraryDraftPayload | null {
  if (!answer?.trim()) return null;

  const fromMarkers = extractFromMarkers(answer);
  if (fromMarkers) return fromMarkers;

  const fromFence = extractFromFencedJson(answer);
  if (fromFence) return fromFence;

  return extractLooseJsonObject(answer);
}

export { TRIPBOARD_ITINERARY_JSON_START, TRIPBOARD_ITINERARY_JSON_END };
