import { askTripAIWithUsage, type TripAiUsage } from "@/lib/trip-ai/providers";
import { extractJsonObject } from "@/lib/trip-ai/tripCreationJson";
import type { ExecutableItineraryPayload, ItineraryDayPayload } from "@/lib/trip-ai/tripCreationTypes";
import { extractItineraryFromAnswer } from "@/lib/trip-ai/extractItineraryFromAnswer";
import {
  countDaySectionsInSource,
  countItineraryItems,
  estimateMinActivitiesFromSource,
  isItineraryImportSufficient,
  looksLikePastedItineraryImport,
  mapWithConcurrency,
  normalizeItineraryItem,
} from "@/lib/trip-ai/itineraryDraftUtils";

function expectedDayCountRule(sourceText: string, assistantHint: string): string | undefined {
  const fromMeta = assistantHint.match(/D[ií]as detectados[^:]*:\s*(\d+)/i);
  if (fromMeta) {
    const n = Number(fromMeta[1]);
    if (Number.isFinite(n) && n >= 2) {
      return `El dossier tiene ${n} días de calendario: devuelve days[] con EXACTAMENTE ${n} entradas (una por día), en el mismo orden que el texto.`;
    }
  }
  const fromText = countDaySectionsInSource(sourceText);
  if (fromText >= 2) {
    return `El texto tiene ${fromText} bloques de día: devuelve days[] con EXACTAMENTE ${fromText} entradas, una por día, en orden.`;
  }
  return undefined;
}
import {
  buildDocumentHintBlock,
  buildImportExtractionRules,
} from "@/lib/trip-ai/itineraryImportPrompts";
import {
  KAVIRO_ITINERARY_JSON_END,
  KAVIRO_ITINERARY_JSON_START,
} from "@/lib/trip-ai/kaviroJsonMarkers";
import {
  countScheduleLinesInText,
  isAgencyCalendarParseAcceptable,
  looksLikeAgencyWeekdayCalendar,
  normalizeAgencyCalendarSourceText,
  parseAgencyCalendarItinerary,
  resolveSectionDate,
  splitSourceForAgencyCalendar,
} from "@/lib/trip-ai/agencyCalendarParse";

export {
  countScheduleLinesInText,
  isAgencyCalendarParseAcceptable,
  looksLikeAgencyWeekdayCalendar,
  normalizeAgencyCalendarSourceText,
  parseAgencyCalendarItinerary,
  prepareDocumentTextForItineraryImport,
} from "@/lib/trip-ai/agencyCalendarParse";

function addUtcDays(isoDate: string, offset: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

const CALENDAR_HEADER_DAY_RE =
  /(?:^|\s)(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+(\d{1,2})(?![.:]\d)\b/i;

/** Extrae el día del mes de encabezados «VIERNES 27», «lunes 1», etc. */
export function parseDayOfMonthFromCalendarHeader(text: string): number | null {
  const m = text.trim().match(CALENDAR_HEADER_DAY_RE);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 1 && n <= 31 ? n : null;
}

export function parseTripDateRangeFromSummary(
  tripSummary: string
): { start: string; end: string } | null {
  const m = tripSummary.match(/Fechas:\s*(\d{4}-\d{2}-\d{2})\s*→\s*(\d{4}-\d{2}-\d{2})/);
  if (!m) return null;
  return { start: m[1]!, end: m[2]! };
}

/** Resuelve «día 27» / «día 1» dentro del rango del viaje (soporta cambio de mes). */
export function resolveDayOfMonthInTripRange(
  dayOfMonth: number,
  tripStart: string,
  tripEnd: string
): string | null {
  if (!Number.isFinite(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) return null;
  const matches: string[] = [];
  const start = new Date(`${tripStart}T12:00:00.000Z`);
  const end = new Date(`${tripEnd}T12:00:00.000Z`);
  let y = start.getUTCFullYear();
  let mo = start.getUTCMonth();
  const endY = end.getUTCFullYear();
  const endMo = end.getUTCMonth();

  while (y < endY || (y === endY && mo <= endMo)) {
    const candidate = new Date(Date.UTC(y, mo, dayOfMonth, 12));
    if (candidate.getUTCDate() === dayOfMonth) {
      const iso = candidate.toISOString().slice(0, 10);
      if (iso >= tripStart && iso <= tripEnd) matches.push(iso);
    }
    mo += 1;
    if (mo > 11) {
      mo = 0;
      y += 1;
    }
  }

  if (!matches.length) return null;
  return matches.sort()[0]!;
}

export function stampItineraryDatesFromChunkLabel(
  itinerary: ExecutableItineraryPayload,
  chunkLabel: string,
  tripSummary: string
): ExecutableItineraryPayload {
  const range = parseTripDateRangeFromSummary(tripSummary);
  if (!range) return itinerary;
  const dayOfMonth = parseDayOfMonthFromCalendarHeader(chunkLabel);
  if (dayOfMonth == null) return itinerary;
  const iso = resolveDayOfMonthInTripRange(dayOfMonth, range.start, range.end);
  if (!iso) return itinerary;
  return {
    ...itinerary,
    days: itinerary.days.map((d) => ({ ...d, date: iso })),
  };
}

/** Alinea fechas al importar: encabezados del dossier primero; si no, secuencial desde inicio del viaje. */
export function alignItineraryDatesForImport(
  itinerary: ExecutableItineraryPayload,
  tripSummary: string,
  sourceText: string
): ExecutableItineraryPayload {
  const range = parseTripDateRangeFromSummary(tripSummary);
  if (!range) return itinerary;

  const sections = splitSourceForImport(sourceText).filter((s) => s.header !== "Todo");
  if (sections.length >= 2) {
    const resolved = sections.map((section) => resolveSectionDate(section.header, tripSummary));

    if (resolved.every((d) => d != null) && sections.length === itinerary.days.length) {
      return {
        ...itinerary,
        days: itinerary.days.map((d, i) => ({ ...d, date: resolved[i]! })),
      };
    }

    const days = itinerary.days.map((d, i) => {
      const fromHeader = i < resolved.length ? resolved[i] : null;
      if (fromHeader) return { ...d, date: fromHeader };
      if (typeof d.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.date)) return d;
      return { ...d, date: addUtcDays(range.start, i) };
    });

    return {
      ...itinerary,
      days: days.map((d, idx) => ({ ...d, day: idx + 1 })),
    };
  }

  return {
    ...itinerary,
    days: itinerary.days.map((d, idx) => ({
      ...d,
      date:
        typeof d.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.date)
          ? d.date
          : addUtcDays(range.start, idx),
    })),
  };
}

/** Rellena `date` null usando «Fechas: YYYY-MM-DD → YYYY-MM-DD» del resumen del viaje. */
export function fillItineraryDatesFromTripSummary(
  itinerary: ExecutableItineraryPayload,
  tripSummary: string
): ExecutableItineraryPayload {
  const range = parseTripDateRangeFromSummary(tripSummary);
  if (!range) return itinerary;
  return {
    ...itinerary,
    days: itinerary.days.map((d, idx) => ({
      ...d,
      date:
        d.date && /^\d{4}-\d{2}-\d{2}$/.test(d.date)
          ? d.date
          : addUtcDays(range.start, idx),
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
  const dayRule = chunkNote ? undefined : expectedDayCountRule(sourceText, assistantHint);
  return [
    ...buildImportExtractionRules(
      [
        chunkNote ? `Fragmento «${chunkNote}»: extrae solo las actividades de este trozo.` : undefined,
        dayRule,
      ]
        .filter(Boolean)
        .join(" ")
        || undefined
    ),
    "",
    "CONTEXTO DEL VIAJE:",
    tripSummary,
    buildDocumentHintBlock(assistantHint, 4000),
    "",
    "TEXTO DEL DOSSIER:",
    sourceText,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildMarkerPrompt(tripSummary: string, sourceText: string, assistantHint = "") {
  return [
    "Extrae itinerario ejecutable como analista de viajes senior.",
    "Primero el bloque JSON entre marcadores; después una línea humana breve con nº de días y actividades extraídas.",
    KAVIRO_ITINERARY_JSON_START,
    "{ version: 1, days: [...] }",
    KAVIRO_ITINERARY_JSON_END,
    "",
    ...buildImportExtractionRules("El JSON va ENTRE los marcadores KAVIRO_ITINERARY_JSON (no JSON suelto).").slice(2),
    "",
    "CONTEXTO:",
    tripSummary,
    buildDocumentHintBlock(assistantHint, 4000),
    "",
    "TEXTO:",
    sourceText,
  ].join("\n");
}

/** Encabezados tipo «VIERNES 27», «sábado 5» (dossiers de agencia). */
const WEEKDAY_DAY_SPLIT_RE =
  /(?=(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+\d{1,2}\b)/gi;

function sectionHasScheduleLines(body: string): boolean {
  return /\d{1,2}[.:]\d{2}\s*h\b|\d{1,2}:\d{2}/i.test(body);
}

function mapDaySectionParts(parts: string[], fallbackBody: string): Array<{ header: string; body: string }> {
  let trimmed = parts;
  if (trimmed.length >= 2 && trimmed[0] && !sectionHasScheduleLines(trimmed[0])) {
    trimmed = trimmed.slice(1);
  }
  if (trimmed.length < 2) return [{ header: "Todo", body: fallbackBody }];

  return trimmed.map((part) => {
    const firstLine = part.split("\n")[0]?.trim() || "Día";
    return { header: firstLine.slice(0, 80), body: part };
  });
}


/** Parte el texto en bloques por «DÍA …» o «VIERNES 27» para agendas muy largas. */
export function splitSourceByDaySections(sourceText: string): Array<{ header: string; body: string }> {
  const diaRe = /(?=(?:D[IÍ]A|D[ií]a|Day)\s*\d+\b)/gi;
  const diaParts = sourceText.split(diaRe).map((p) => p.trim()).filter(Boolean);
  if (diaParts.length >= 2) return mapDaySectionParts(diaParts, sourceText);

  const weekdayParts = sourceText.split(WEEKDAY_DAY_SPLIT_RE).map((p) => p.trim()).filter(Boolean);
  if (weekdayParts.length >= 2) return mapDaySectionParts(weekdayParts, sourceText);

  return [{ header: "Todo", body: sourceText }];
}

/** Si no hay «DÍA N», parte por líneas con hora (12.00h-, 15.55h-, etc.). */
export function splitSourceByTimeSlots(
  sourceText: string,
  slotsPerChunk = 8
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
  const normalized = normalizeAgencyCalendarSourceText(sourceText);

  if (looksLikeAgencyWeekdayCalendar(normalized)) {
    const byAgency = splitSourceForAgencyCalendar(normalized);
    if (byAgency.length >= 2) return byAgency;
    return [{ header: "Todo", body: normalized }];
  }

  const byDay = splitSourceByDaySections(normalized);
  if (byDay.length >= 2) return byDay;
  const byTime = splitSourceByTimeSlots(normalized);
  if (byTime.length >= 2) return byTime;
  return [{ header: "Todo", body: normalized }];
}

function itineraryItemFingerprint(item: { title?: string; start_time?: string | null }): string {
  const title = String(item.title ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  const time = String(item.start_time ?? "").trim();
  return `${time}|${title}`;
}

function dedupeItineraryItems(
  items: ItineraryDayPayload["items"]
): ItineraryDayPayload["items"] {
  const seen = new Set<string>();
  const out: ItineraryDayPayload["items"] = [];
  for (const it of items) {
    const fp = itineraryItemFingerprint(it);
    if (seen.has(fp)) continue;
    seen.add(fp);
    out.push(it);
  }
  return out;
}

function maxItemsForSectionBody(body: string): number {
  const expected = countScheduleLinesInText(body);
  if (expected >= 1) return Math.max(expected + 1, Math.ceil(expected * 1.15));
  return 12;
}

export type ScheduleSlot = { time: string; label: string; line: string };

function normalizeTimeForMatch(t: string | null | undefined): string | null {
  if (!t) return null;
  const m = t.trim().match(/^(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  return `${Number(m[1]).toString().padStart(2, "0")}:${m[2]}`;
}

function normalizeTextForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Horarios literales del trozo de dossier (07.30h Desayuno…). */
export function parseScheduleSlotsFromSection(body: string): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  for (const line of body.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    let m = t.match(/^(\d{1,2})[.:](\d{2})\s*h\s*(.+)$/i);
    if (m) {
      const time = `${Number(m[1]).toString().padStart(2, "0")}:${m[2]}`;
      slots.push({ time, label: m[3]!.trim(), line: t });
      continue;
    }
    m = t.match(/^(.+?)\s+(\d{1,2})[.:](\d{2})\s*h?\s*$/i);
    if (m) {
      const time = `${Number(m[2]).toString().padStart(2, "0")}:${m[3]}`;
      slots.push({ time, label: m[1]!.trim(), line: t });
    }
  }
  return slots;
}

function tokenOverlapScore(a: string, b: string): number {
  const na = normalizeTextForMatch(a);
  const nb = normalizeTextForMatch(b);
  if (!na || !nb) return 0;
  if (na.includes(nb) || nb.includes(na)) return 1;
  const wordsA = na.split(" ").filter((w) => w.length >= 3);
  const wordsB = new Set(nb.split(" ").filter((w) => w.length >= 3));
  if (!wordsA.length) return 0;
  let hits = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) hits += 1;
    else {
      for (const bw of wordsB) {
        if (bw.includes(w) || w.includes(bw)) {
          hits += 0.75;
          break;
        }
      }
    }
  }
  return hits / wordsA.length;
}

function inferKindFromSlotLabel(label: string): string | null {
  const l = label.toLowerCase();
  if (/vuelo|flight|aterrizaje|airport|factur|aterriz/i.test(l)) return "transport";
  if (/desayuno|comida|cena/.test(l)) return "restaurant";
  if (/hotel|check[- ]?in|check[- ]?out|llegada a hotel|early check/i.test(l)) return "lodging";
  if (/excursi|glaciar|catarata|parque|quedada|bus al airport|mañana libre|tarde libre|noche libre|partido/i.test(l))
    return "activity";
  return "activity";
}

function scoreItemForSlot(item: ItineraryDayPayload["items"][number], slot: ScheduleSlot): number {
  const itemTime = normalizeTimeForMatch(item.start_time);
  if (!itemTime || itemTime !== slot.time) return 0;
  const blob = [item.title, item.place_name, item.notes].filter(Boolean).join(" ");
  const labelScore = tokenOverlapScore(blob, slot.label);
  if (labelScore >= 0.2) return 0.45 + labelScore * 0.55;
  return 0.12;
}

/**
 * Una actividad por línea con hora del dossier. Descarta items de otros días aunque compartan hora.
 */
export function alignItemsToSectionSchedule(
  items: ItineraryDayPayload["items"],
  sectionBody: string
): ItineraryDayPayload["items"] {
  const slots = parseScheduleSlotsFromSection(sectionBody);
  const pool = dedupeItineraryItems(items);
  if (!slots.length) return pool.slice(0, maxItemsForSectionBody(sectionBody));

  const used = new Set<number>();
  const result: ItineraryDayPayload["items"] = [];

  for (const slot of slots) {
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < pool.length; i++) {
      if (used.has(i)) continue;
      const score = scoreItemForSlot(pool[i]!, slot);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0 && bestScore >= 0.35) {
      used.add(bestIdx);
      result.push(pool[bestIdx]!);
    } else {
      result.push(
        normalizeItineraryItem({
          title: slot.label,
          start_time: slot.time,
          activity_kind: inferKindFromSlotLabel(slot.label),
        })
      );
    }
  }
  return result;
}

function sectionBodyByDate(sourceText: string, tripSummary: string): Map<string, string> {
  const map = new Map<string, string>();
  const normalized = normalizeAgencyCalendarSourceText(sourceText);
  for (const section of splitSourceForImport(normalized).filter((s) => s.header !== "Todo")) {
    const iso = resolveSectionDate(section.header, tripSummary);
    if (iso) map.set(iso, section.body);
  }
  return map;
}

/**
 * Un trozo = un solo día en el resultado. Evita que la IA devuelva varios days[] o actividades de otros días.
 */
function itineraryAlignmentScore(
  itinerary: ExecutableItineraryPayload,
  sourceText: string,
  tripSummary: string
): number {
  const bodies = sectionBodyByDate(sourceText, tripSummary);
  let score = countItineraryItems(itinerary);
  for (const d of itinerary.days) {
    const body = d.date ? bodies.get(d.date) : undefined;
    const expected = body ? countScheduleLinesInText(body) : 0;
    const got = d.items?.length ?? 0;
    if (expected > 0 && got > expected) score -= (got - expected) * 12;
    if (expected > 0 && got < expected) score -= (expected - got) * 2;
  }
  return score;
}

/**
 * Un trozo = un solo día en el resultado. Evita que la IA devuelva varios days[] o actividades de otros días.
 */
export function normalizeChunkImportResult(
  parsed: ExecutableItineraryPayload,
  chunkLabel: string,
  chunkBody: string,
  tripSummary: string
): ExecutableItineraryPayload {
  const range = parseTripDateRangeFromSummary(tripSummary);
  const dayOfMonth = parseDayOfMonthFromCalendarHeader(chunkLabel);
  let date: string | null = null;
  if (range && dayOfMonth != null) {
    date = resolveDayOfMonthInTripRange(dayOfMonth, range.start, range.end);
  }

  const allItems = dedupeItineraryItems(parsed.days.flatMap((d) => d.items ?? []));
  const items = alignItemsToSectionSchedule(allItems, chunkBody);

  if (!items.length) return { version: 1, title: parsed.title, days: [] };

  return {
    version: 1,
    title: parsed.title,
    days: [{ day: 1, date, items }],
  };
}

/** Alinea cada día con las horas literales de su bloque en el dossier. */
export function sanitizeItineraryBySourceSections(
  itinerary: ExecutableItineraryPayload,
  sourceText: string,
  tripSummary: string
): ExecutableItineraryPayload {
  const bodies = sectionBodyByDate(sourceText, tripSummary);

  const days = itinerary.days
    .map((d) => {
      const body = d.date ? bodies.get(d.date) : undefined;
      const items = body
        ? alignItemsToSectionSchedule(d.items ?? [], body)
        : dedupeItineraryItems(d.items ?? []);
      return { ...d, items };
    })
    .filter((d) => (d.items?.length ?? 0) > 0);

  return {
    ...itinerary,
    days: days.map((d, idx) => ({ ...d, day: idx + 1 })),
  };
}

function dayMergeKey(d: ItineraryDayPayload, partIndex: number, dayIndexInPart: number): string {
  if (typeof d.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.date)) {
    return `date:${d.date}`;
  }
  const items = d.items ?? [];
  if (items.length) {
    const sig = items.slice(0, 2).map(itineraryItemFingerprint).join("|");
    return `part:${partIndex}:sig:${sig}`;
  }
  return `part:${partIndex}:day:${dayIndexInPart}`;
}

export function mergeImportedItineraries(parts: ExecutableItineraryPayload[]): ExecutableItineraryPayload {
  const dayByKey = new Map<string, ItineraryDayPayload>();
  const keyOrder: string[] = [];

  for (let partIndex = 0; partIndex < parts.length; partIndex++) {
    const p = parts[partIndex]!;
    for (let dayIndexInPart = 0; dayIndexInPart < p.days.length; dayIndexInPart++) {
      const d = p.days[dayIndexInPart]!;
      if (!d.items?.length) continue;
      const key = dayMergeKey(d, partIndex, dayIndexInPart);
      const prev = dayByKey.get(key);
      if (!prev) {
        dayByKey.set(key, { ...d, items: [...d.items] });
        keyOrder.push(key);
        continue;
      }
      const seen = new Set((prev.items ?? []).map(itineraryItemFingerprint));
      for (const it of d.items) {
        const fp = itineraryItemFingerprint(it);
        if (!seen.has(fp)) {
          prev.items!.push(it);
          seen.add(fp);
        }
      }
      if (!prev.date && d.date) prev.date = d.date;
    }
    }
  }

  const days = keyOrder
    .map((k) => dayByKey.get(k)!)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  return {
    version: 1,
    title: parts.find((p) => p.title)?.title || "Itinerario importado",
    days: days.map((d, idx) => ({ ...d, day: idx + 1 })),
  };
}

function pickBestItinerary(
  candidates: ExecutableItineraryPayload[],
  sourceText: string,
  tripSummary: string
): ExecutableItineraryPayload | null {
  if (!candidates.length) return null;
  return candidates.reduce((best, cur) =>
    itineraryAlignmentScore(cur, sourceText, tripSummary) >
    itineraryAlignmentScore(best, sourceText, tripSummary)
      ? cur
      : best
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
  const scheduleLines = countScheduleLinesInText(chunkBody);
  const prompt = buildJsonOnlyPrompt(
    tripSummary,
    chunkBody.slice(0, 12000),
    "",
    `Fragmento «${chunkLabel}»: devuelve days[] con UN SOLO día y como máximo ${scheduleLines || "?"} actividades con hora de ESTE trozo; no incluyas otros días del viaje.`
  );
  const answer = await callImportModel(prompt, true, usageAgg);
  const parsed = parseFromRawAnswer(answer);
  if (!parsed) return null;
  return normalizeChunkImportResult(parsed, chunkLabel, chunkBody, tripSummary);
}

async function importByChunks(
  tripSummary: string,
  sourceText: string,
  usageAgg: TripAiUsage
): Promise<ExecutableItineraryPayload | null> {
  const sections = splitSourceForImport(sourceText);
  if (sections.length < 2) return null;

  const active = sections.filter((s) => s.body.trim());
  const parts = await mapWithConcurrency(active, 2, async (section) => {
    try {
      return await importChunk(tripSummary, section.body, section.header, usageAgg);
    } catch {
      return null;
    }
  });
  const merged: ExecutableItineraryPayload[] = [];
  for (const part of parts) {
    if (part?.days?.length) merged.push(part);
  }
  if (!merged.length) return null;
  const itinerary = mergeImportedItineraries(merged);
  if (!itinerary.days.length) return null;
  return sanitizeItineraryBySourceSections(itinerary, sourceText, tripSummary);
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
  const sourceText = normalizeAgencyCalendarSourceText(params.sourceText.trim());
  const assistantHint = params.assistantHint?.trim() || "";
  const tripSummary = params.tripSummary;
  const usageAgg: TripAiUsage = { provider: "gemini", model: null, inputTokens: 0, outputTokens: 0 };
  const pasted = looksLikePastedItineraryImport(sourceText);
  const isAgencyCalendar = looksLikeAgencyWeekdayCalendar(sourceText);
  const sections = splitSourceForImport(sourceText);
  const useChunkedFirst = !isAgencyCalendar && pasted && (sections.length >= 2 || sourceText.length > 1800);

  const finish = (itinerary: ExecutableItineraryPayload, answer: string) => ({
    itinerary: sanitizeItineraryBySourceSections(
      alignItineraryDatesForImport(itinerary, tripSummary, sourceText),
      sourceText,
      tripSummary
    ),
    answer,
    usage: usageAgg,
  });

  if (looksLikeAgencyWeekdayCalendar(sourceText)) {
    const fast = parseAgencyCalendarItinerary(sourceText, tripSummary);
    if (fast && isAgencyCalendarParseAcceptable(fast, sourceText, tripSummary)) {
      const total = countItineraryItems(fast);
      return finish(
        fast,
        `Calendario importado (${fast.days.length} días, ${total} actividades).`
      );
    }
  }

  const candidates: ExecutableItineraryPayload[] = [];

  // 1) Por tramos (prioritario en agendas pegadas largas)
  if (useChunkedFirst) {
    try {
      const chunked = await importByChunks(tripSummary, sourceText, usageAgg);
      if (chunked) {
        if (isItineraryImportSufficient(chunked, sourceText)) {
          const total = countItineraryItems(chunked);
          return finish(
            chunked,
            `Itinerario importado por tramos (${chunked.days.length} días, ${total} actividades).`
          );
        }
        candidates.push(chunked);
      }
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
      buildMarkerPrompt(tripSummary, sourceText.slice(0, 28000), assistantHint),
      false,
      usageAgg
    );
    const itinerary = parseFromRawAnswer(answer);
    if (itinerary) candidates.push(itinerary);
  } catch {
    // sigue
  }

  // 4) Tramos si aún no se intentó
  if (!useChunkedFirst && !isAgencyCalendar && sections.length >= 2) {
    try {
      const chunked = await importByChunks(tripSummary, sourceText, usageAgg);
      if (chunked) candidates.push(chunked);
    } catch {
      // sigue
    }
  }

  const best = pickBestItinerary(candidates, sourceText, tripSummary);
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
