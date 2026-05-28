import { askTripAIWithUsage, type TripAiUsage } from "@/lib/trip-ai/providers";
import { extractJsonObject } from "@/lib/trip-ai/tripCreationJson";
import type { ExecutableItineraryPayload, ItineraryDayPayload } from "@/lib/trip-ai/tripCreationTypes";
import { extractItineraryFromAnswer } from "@/lib/trip-ai/extractItineraryFromAnswer";
import { normalizeItineraryItem } from "@/lib/trip-ai/itineraryDraftUtils";
import {
  KAVIRO_ITINERARY_JSON_END,
  KAVIRO_ITINERARY_JSON_START,
} from "@/lib/trip-ai/kaviroJsonMarkers";

function addUtcDays(isoDate: string, offset: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

/** Rellena `date` null usando «Fechas: YYYY-MM-DD → YYYY-MM-DD» del resumen del viaje. */
export function fillItineraryDatesFromTripSummary(
  itinerary: ExecutableItineraryPayload,
  tripSummary: string
): ExecutableItineraryPayload {
  const m = tripSummary.match(/Fechas:\s*(\d{4}-\d{2}-\d{2})\s*→\s*(\d{4}-\d{2}-\d{2})/);
  if (!m) return itinerary;
  const start = m[1]!;
  return {
    ...itinerary,
    days: itinerary.days.map((d, idx) => ({
      ...d,
      date: d.date && /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : addUtcDays(start, idx),
    })),
  };
}

function validateImportedItinerary(x: unknown): ExecutableItineraryPayload | null {
  if (!x || typeof x !== "object") return null;
  const o = x as ExecutableItineraryPayload;
  if (o.version !== 1 || !Array.isArray(o.days) || !o.days.length) return null;

  const days: ItineraryDayPayload[] = [];
  for (let i = 0; i < o.days.length; i++) {
    const d = o.days[i];
    if (!d || typeof d !== "object") continue;
    const dayNum = typeof d.day === "number" ? d.day : i + 1;
    const date =
      typeof d.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : null;
    const items = Array.isArray(d.items)
      ? d.items.map(normalizeItineraryItem).filter((it) => it.title.trim())
      : [];
    if (!items.length) continue;
    days.push({ day: dayNum, date, items });
  }

  if (!days.length) return null;
  return {
    version: 1,
    title: typeof o.title === "string" ? o.title : undefined,
    travelMode:
      o.travelMode === "driving" || o.travelMode === "walking" || o.travelMode === "cycling"
        ? o.travelMode
        : undefined,
    days: days.map((d, idx) => ({ ...d, day: idx + 1 })),
  };
}

function parseFromRawAnswer(answer: string): ExecutableItineraryPayload | null {
  const fromMarkers = extractItineraryFromAnswer(answer);
  if (fromMarkers) return fromMarkers;

  try {
    const raw = extractJsonObject(answer);
    return validateImportedItinerary(raw);
  } catch {
    return null;
  }
}

function mergeUsage(agg: TripAiUsage, next: TripAiUsage) {
  agg.model = next.model ?? agg.model;
  agg.provider = next.provider ?? agg.provider;
  agg.inputTokens = (agg.inputTokens || 0) + (next.inputTokens || 0);
  agg.outputTokens = (agg.outputTokens || 0) + (next.outputTokens || 0);
}

function buildJsonOnlyPrompt(tripSummary: string, sourceText: string, assistantHint: string) {
  return [
    "Devuelve UN SOLO objeto JSON válido (sin markdown, sin marcadores KAVIRO_*).",
    "Esquema:",
    '{ "version": 1, "title": "string", "days": [{ "day": 1, "date": "YYYY-MM-DD|null", "items": [{',
    '  "title": "string", "activity_kind": "visit|museum|restaurant|transport|activity|lodging",',
    '  "place_name": "string|null", "address": "string|null",',
    '  "start_time": "HH:MM|null", "requires_ticket": true|false|null,',
    '  "ticket_notes": "string|null", "notes": "string|null" }] }] }',
    "",
    "Reglas:",
    "- Extrae cada actividad con hora del texto (vuelos, hotel, museos, partidos, cruceros, comidas con nombre).",
    "- 12.00h → 12:00. place_name y address con ciudad y país (Chicago, IL, USA).",
    "- Mapea encabezados «DÍA …» a fechas del CONTEXTO DEL VIAJE.",
    "- requires_ticket: true en museos, torres, NBA/NHL/NFL, cruceros; false en traslados/paseos libres.",
    "- Incluye TODOS los días con actividades del texto; no omitas ningún bloque horario.",
    "",
    "CONTEXTO DEL VIAJE:",
    tripSummary,
    assistantHint ? `\nReferencia (resumen previo, no repetir como única fuente):\n${assistantHint.slice(0, 1500)}` : "",
    "",
    "TEXTO:",
    sourceText,
  ].join("\n");
}

function buildMarkerPrompt(tripSummary: string, sourceText: string) {
  return [
    "Extrae itinerario ejecutable. Primero el bloque entre marcadores (JSON válido), luego una línea humana corta.",
    KAVIRO_ITINERARY_JSON_START,
    "{ version: 1, days: [...] }",
    KAVIRO_ITINERARY_JSON_END,
    "",
    "CONTEXTO:",
    tripSummary,
    "",
    "TEXTO:",
    sourceText,
  ].join("\n");
}

/** Parte el texto en bloques por «DÍA …» para agendas muy largas. */
export function splitSourceByDaySections(sourceText: string): Array<{ header: string; body: string }> {
  const re = /(?=D[IÍ]A\s+\d+)/gi;
  const parts = sourceText.split(re).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return [{ header: "Todo", body: sourceText }];

  return parts.map((part) => {
    const firstLine = part.split("\n")[0]?.trim() || "Día";
    return { header: firstLine.slice(0, 80), body: part };
  });
}

function mergeItineraries(parts: ExecutableItineraryPayload[]): ExecutableItineraryPayload {
  const days: ItineraryDayPayload[] = [];
  for (const p of parts) {
    for (const d of p.days) {
      if (!d.items?.length) continue;
      days.push(d);
    }
  }
  return {
    version: 1,
    title: parts.find((p) => p.title)?.title || "Itinerario importado",
    days: days.map((d, idx) => ({ ...d, day: idx + 1 })),
  };
}

async function callImportModel(
  prompt: string,
  jsonOnly: boolean,
  usageAgg: TripAiUsage
): Promise<string> {
  const { text, usage } = await askTripAIWithUsage(prompt, "planning", {
    maxOutputTokens: 8192,
    ...(jsonOnly ? { responseMimeType: "application/json" } : {}),
  });
  mergeUsage(usageAgg, usage);
  return text;
}

async function importChunk(
  tripSummary: string,
  chunkBody: string,
  chunkLabel: string,
  usageAgg: TripAiUsage
): Promise<ExecutableItineraryPayload | null> {
  const prompt = buildJsonOnlyPrompt(
    tripSummary,
    chunkBody.slice(0, 12000),
    `Fragmento: ${chunkLabel}`
  );
  const answer = await callImportModel(prompt, true, usageAgg);
  return parseFromRawAnswer(answer);
}

export async function importItineraryFromText(params: {
  tripSummary: string;
  sourceText: string;
  assistantHint?: string;
}): Promise<{ itinerary: ExecutableItineraryPayload; answer: string; usage: TripAiUsage } | null> {
  const sourceText = params.sourceText.trim();
  const assistantHint = params.assistantHint?.trim() || "";
  const tripSummary = params.tripSummary;
  const usageAgg: TripAiUsage = { provider: "gemini", model: null, inputTokens: 0, outputTokens: 0 };

  const finish = (itinerary: ExecutableItineraryPayload, answer: string) => ({
    itinerary: fillItineraryDatesFromTripSummary(itinerary, tripSummary),
    answer,
    usage: usageAgg,
  });

  // 1) JSON puro (más fiable con Gemini)
  try {
    const answer = await callImportModel(
      buildJsonOnlyPrompt(tripSummary, sourceText.slice(0, 28000), assistantHint),
      true,
      usageAgg
    );
    const itinerary = parseFromRawAnswer(answer);
    if (itinerary) return finish(itinerary, "Itinerario estructurado para validar.");
  } catch {
    // sigue
  }

  // 2) Marcadores KAVIRO_* (respaldo con bloque delimitado)
  try {
    const answer = await callImportModel(
      buildMarkerPrompt(tripSummary, sourceText.slice(0, 28000)),
      false,
      usageAgg
    );
    const itinerary = parseFromRawAnswer(answer);
    if (itinerary) return finish(itinerary, answer);
  } catch {
    // sigue
  }

  // 3) Por tramos de día (agendas deportivas / viajes de 7+ días)
  const sections = splitSourceByDaySections(sourceText);
  if (sections.length >= 2) {
    const merged: ExecutableItineraryPayload[] = [];
    for (const section of sections) {
      try {
        const part = await importChunk(tripSummary, section.body, section.header, usageAgg);
        if (part?.days?.length) merged.push(part);
      } catch {
        // omitir tramo fallido
      }
    }
    if (merged.length) {
      const itinerary = mergeItineraries(merged);
      if (itinerary.days.length) {
        return finish(
          itinerary,
          `Itinerario importado por tramos (${itinerary.days.length} días, ${itinerary.days.reduce((n, d) => n + d.items.length, 0)} actividades).`
        );
      }
    }
  }

  return null;
}
