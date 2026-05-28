import { askTripAIWithUsage, type TripAiUsage } from "@/lib/trip-ai/providers";
import { extractJsonObject } from "@/lib/trip-ai/tripCreationJson";
import type { ExecutableItineraryPayload, ItineraryDayPayload } from "@/lib/trip-ai/tripCreationTypes";
import { extractItineraryFromAnswer } from "@/lib/trip-ai/extractItineraryFromAnswer";
import {
  countItineraryItems,
  estimateMinActivitiesFromSource,
  isItineraryImportIncomplete,
  looksLikePastedItineraryImport,
  normalizeItineraryItem,
} from "@/lib/trip-ai/itineraryDraftUtils";
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

function buildJsonOnlyPrompt(
  tripSummary: string,
  sourceText: string,
  assistantHint: string,
  chunkNote?: string
) {
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
    "- Extrae CADA actividad con hora del fragmento (vuelos, hotel, museos, partidos, cruceros, comidas con nombre).",
    "- 12.00h → 12:00. place_name y address con ciudad y país del viaje (ej. Chicago, IL, USA).",
    "- Mapea encabezados «DÍA …» a fechas del CONTEXTO DEL VIAJE.",
    "- requires_ticket: true en museos, torres, NBA/NHL/NFL, cruceros; false en traslados/paseos libres.",
    "- No omitas ningún bloque horario de ESTE fragmento; un item por línea con hora.",
    chunkNote ? `- ${chunkNote}` : "",
    "",
    "CONTEXTO DEL VIAJE:",
    tripSummary,
    assistantHint ? `\nReferencia (no sustituye el TEXTO):\n${assistantHint.slice(0, 1200)}` : "",
    "",
    "TEXTO:",
    sourceText,
  ]
    .filter(Boolean)
    .join("\n");
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

/** Si no hay «DÍA N», parte por líneas con hora (12.00h-, 15.55h-, etc.). */
export function splitSourceByTimeSlots(
  sourceText: string,
  slotsPerChunk = 6
): Array<{ header: string; body: string }> {
  const lines = sourceText.split(/\n/);
  const segments: string[][] = [];
  let current: string[] = [];
  let slotsInSegment = 0;

  const isTimeLine = (line: string) =>
    /^\d{1,2}[.:]\d{2}\s*h\s*[-–—]/i.test(line.trim()) ||
    /^\d{1,2}[.:]\d{2}\s*h\s+\S/i.test(line.trim());

  for (const line of lines) {
    if (isTimeLine(line)) {
      if (slotsInSegment >= slotsPerChunk && current.length) {
        segments.push(current);
        current = [];
        slotsInSegment = 0;
      }
      slotsInSegment++;
    }
    current.push(line);
  }
  if (current.length) segments.push(current);

  if (segments.length <= 1) return [{ header: "Todo", body: sourceText }];

  return segments.map((seg, i) => ({
    header: `Tramo ${i + 1}`,
    body: seg.join("\n").trim(),
  }));
}

/** Estrategia de troceado para importación (días explícitos o bloques horarios). */
export function splitSourceForImport(sourceText: string): Array<{ header: string; body: string }> {
  const byDay = splitSourceByDaySections(sourceText);
  if (byDay.length >= 2) return byDay;
  const byTime = splitSourceByTimeSlots(sourceText);
  if (byTime.length >= 2) return byTime;
  return [{ header: "Todo", body: sourceText }];
}

export function mergeImportedItineraries(parts: ExecutableItineraryPayload[]): ExecutableItineraryPayload {
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

function pickBestItinerary(candidates: ExecutableItineraryPayload[]): ExecutableItineraryPayload | null {
  if (!candidates.length) return null;
  return candidates.reduce((best, cur) =>
    countItineraryItems(cur) > countItineraryItems(best) ? cur : best
  );
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
    "",
    `Fragmento «${chunkLabel}»: extrae solo las actividades de este trozo; no inventes días fuera del fragmento.`
  );
  const answer = await callImportModel(prompt, true, usageAgg);
  return parseFromRawAnswer(answer);
}

async function importByChunks(
  tripSummary: string,
  sourceText: string,
  usageAgg: TripAiUsage
): Promise<ExecutableItineraryPayload | null> {
  const sections = splitSourceForImport(sourceText);
  if (sections.length < 2) return null;

  const merged: ExecutableItineraryPayload[] = [];
  for (const section of sections) {
    if (!section.body.trim()) continue;
    try {
      const part = await importChunk(tripSummary, section.body, section.header, usageAgg);
      if (part?.days?.length) merged.push(part);
    } catch {
      // omitir tramo fallido
    }
  }
  if (!merged.length) return null;
  const itinerary = mergeImportedItineraries(merged);
  return itinerary.days.length ? itinerary : null;
}

/** Una sola llamada IA para un trozo (usado desde el cliente con progreso por tramo). */
export async function importItinerarySingleChunk(params: {
  tripSummary: string;
  chunkBody: string;
  chunkLabel: string;
}): Promise<{ itinerary: ExecutableItineraryPayload; usage: TripAiUsage } | null> {
  const usageAgg: TripAiUsage = { provider: "gemini", model: null, inputTokens: 0, outputTokens: 0 };
  const part = await importChunk(
    params.tripSummary,
    params.chunkBody.trim(),
    params.chunkLabel.trim() || "Tramo",
    usageAgg
  );
  if (!part?.days?.length) return null;
  return {
    itinerary: fillItineraryDatesFromTripSummary(part, params.tripSummary),
    usage: usageAgg,
  };
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
  const pasted = looksLikePastedItineraryImport(sourceText);
  const sections = splitSourceForImport(sourceText);
  const useChunkedFirst = pasted && (sections.length >= 2 || sourceText.length > 1800);

  const finish = (itinerary: ExecutableItineraryPayload, answer: string) => ({
    itinerary: fillItineraryDatesFromTripSummary(itinerary, tripSummary),
    answer,
    usage: usageAgg,
  });

  const candidates: ExecutableItineraryPayload[] = [];

  // 1) Por tramos (prioritario en agendas pegadas largas)
  if (useChunkedFirst) {
    try {
      const chunked = await importByChunks(tripSummary, sourceText, usageAgg);
      if (chunked) candidates.push(chunked);
    } catch {
      // sigue
    }
  }

  // 2) JSON puro en una sola llamada
  try {
    const answer = await callImportModel(
      buildJsonOnlyPrompt(tripSummary, sourceText.slice(0, 28000), assistantHint),
      true,
      usageAgg
    );
    const itinerary = parseFromRawAnswer(answer);
    if (itinerary) candidates.push(itinerary);
  } catch {
    // sigue
  }

  // 3) Marcadores KAVIRO_*
  try {
    const answer = await callImportModel(
      buildMarkerPrompt(tripSummary, sourceText.slice(0, 28000)),
      false,
      usageAgg
    );
    const itinerary = parseFromRawAnswer(answer);
    if (itinerary) candidates.push(itinerary);
  } catch {
    // sigue
  }

  // 4) Tramos si aún no se intentó
  if (!useChunkedFirst && sections.length >= 2) {
    try {
      const chunked = await importByChunks(tripSummary, sourceText, usageAgg);
      if (chunked) candidates.push(chunked);
    } catch {
      // sigue
    }
  }

  const best = pickBestItinerary(candidates);
  if (!best) return null;

  const total = countItineraryItems(best);
  const expected = estimateMinActivitiesFromSource(sourceText);
  const answer =
    sections.length >= 2
      ? `Itinerario importado por tramos (${best.days.length} días, ${total} actividades).`
      : total >= expected
        ? "Itinerario estructurado para validar."
        : `Itinerario parcial (${total} actividades; se esperaban ~${expected}). Revisa y pulsa «Generar tarjetas» de nuevo si falta algo.`;

  return finish(best, answer);
}
