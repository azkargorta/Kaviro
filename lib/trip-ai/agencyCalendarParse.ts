import type { ExecutableItineraryPayload, ItineraryDayPayload } from "@/lib/trip-ai/tripCreationTypes";
import { countDaySectionsInSource, countItineraryItems, normalizeItineraryItem } from "@/lib/trip-ai/itineraryDraftUtils";

const CALENDAR_HEADER_DAY_RE =
  /(?:^|\s)(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+(\d{1,2})(?![.:]\d)\b/i;
const WEEKDAY_WORD =
  /(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)/i;
const WEEKDAY_DAY_SPLIT_RE =
  /(?=(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+\d{1,2}(?![.:]\d)\b)/gi;
const WEEKDAY_DAY_INLINE_RE =
  /\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s*[:\-.]?\s*(\d{1,2})(?![.:]\d)\b/gi;
const DIA_N_HEADER_RE = /^(?:D[IÍ]A|D[ií]a|Day)\s*(\d{1,2})\b/i;
const DIA_DE_MES_HEADER_RE =
  /D[IÍ]A\s+(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)/i;
const COMPACT_CALENDAR_START_RE =
  /(?:^|\n)\s*(?:VIERNES|viernes)\s+27\b[^\n]*\n[\s\S]{0,400}?-\s*\d{1,2}[.:]\d{2}\s*h/gi;
const MONTH_NAME_TO_NUM: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

export type ScheduleSlot = { time: string; label: string; line: string };

function addUtcDays(isoDate: string, offset: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function tripDayCount(start: string, end: string): number {
  const a = new Date(`${start}T12:00:00.000Z`).getTime();
  const b = new Date(`${end}T12:00:00.000Z`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 1;
  return Math.floor((b - a) / 86400000) + 1;
}

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

export function countScheduleLinesInText(text: string): number {
  let n = 0;
  for (const line of text.split(/\n/)) {
    const t = line.trim();
    if (
      /^\d{1,2}[.:]\d{2}\s*h\b/i.test(t) ||
      /^\d{1,2}:\d{2}\b/.test(t) ||
      /^[-•●]\s*\d{1,2}[.:]\d{2}\s*h\b/i.test(t)
    ) {
      n++;
    }
  }
  return n;
}

export function parseScheduleSlotsFromSection(body: string): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  for (const line of body.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    let m = t.match(/^[-•●]\s*(\d{1,2})[.:](\d{2})\s*h?\s*(.+)$/i);
    if (m) {
      const time = `${Number(m[1]).toString().padStart(2, "0")}:${m[2]}`;
      slots.push({ time, label: m[3]!.trim(), line: t });
      continue;
    }
    m = t.match(/^(\d{1,2})[.:](\d{2})\s*h\s*[-–—]?\s*(.+)$/i);
    if (m) {
      const time = `${Number(m[1]).toString().padStart(2, "0")}:${m[2]}`;
      slots.push({ time, label: m[3]!.trim(), line: t });
      continue;
    }
    m = t.match(/^(\d{1,2}):(\d{2})\s+(.+)$/);
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

export function splitSourceByDaySections(sourceText: string): Array<{ header: string; body: string }> {
  const diaRe = /(?=(?:D[IÍ]A|D[ií]a|Day)\s*\d+\b)/gi;
  const diaParts = sourceText.split(diaRe).map((p) => p.trim()).filter(Boolean);
  if (diaParts.length >= 2) return mapDaySectionParts(diaParts, sourceText);

  const weekdayParts = sourceText.split(WEEKDAY_DAY_SPLIT_RE).map((p) => p.trim()).filter(Boolean);
  if (weekdayParts.length >= 2) return mapDaySectionParts(weekdayParts, sourceText);

  return [{ header: "Todo", body: sourceText }];
}

export function normalizeAgencyCalendarSourceText(sourceText: string): string {
  let t = sourceText.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");

  t = t.replace(/\bDOMNGO\b/gi, "DOMINGO");
  t = t.replace(/\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)(\d{1,2})\b/gi, "$1 $2");

  t = t.replace(
    /(?<=[^\n])(?=(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s*[:\-.]?\s*\d{1,2}(?![.:]\d)\b)/gi,
    "\n"
  );

  t = t.replace(/(?<=[^\n])(?=(?:D[IÍ]A|D[ií]a|Day)\s+\d{1,2}\s+de\s+\w+)/gi, "\n");
  t = t.replace(/(?<=[^\n])(?=(?:D[IÍ]A|D[ií]a|Day)\s*\d+\b)/gi, "\n");

  t = t.replace(/(?<=[^\n])(?=\d{1,2}[.:]\d{2}\s*h\s)/gi, "\n");
  t = t.replace(/(?<=[^\n])(?=\d{1,2}:\d{2}\s+\S)/gi, "\n");
  t = t.replace(/(?<=[^\n])(?=-\s*\d{1,2}[.:]\d{2}\s*h\b)/gi, "\n");

  t = t.replace(/(\d{1,2}[.:]\d{2})\s+h\b/gi, "$1h");

  return t
    .split("\n")
    .map((line) => line.trim())
    .filter((line, idx, arr) => line.length > 0 || (idx > 0 && arr[idx - 1]?.length))
    .join("\n")
    .trim();
}

/** Bloque resumen al final del dossier (p. ej. «VIERNES 27» con viñetas «- 16.00h …»). */
export function extractCompactAgencyCalendarBlock(sourceText: string): string | null {
  const normalized = normalizeAgencyCalendarSourceText(sourceText);
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(COMPACT_CALENDAR_START_RE.source, "gi");
  while ((m = re.exec(normalized)) !== null) {
    starts.push(m.index);
  }
  if (!starts.length) return null;

  const start = starts[starts.length - 1]!;
  const tail = normalized.slice(start);
  const endMatch = tail.search(/\b(?:Precios|Periodo de Inscripciones|El precio incluye)\b/i);
  const block = (endMatch > 120 ? tail.slice(0, endMatch) : tail).trim();
  const markers = splitSourceByDayMarkers(block);
  if (markers.length >= 8 && countScheduleLinesInText(block) >= 20) return block;
  return markers.length >= 6 ? block : null;
}

export function splitSourceByDiaDeMesMarkers(
  sourceText: string
): Array<{ header: string; body: string }> {
  const lines = sourceText.split("\n");
  const markers: Array<{ header: string; lineIndex: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;
    if (DIA_DE_MES_HEADER_RE.test(line)) {
      markers.push({ header: line.slice(0, 100), lineIndex: i });
    }
  }

  if (markers.length < 2) return [];

  return markers.map((marker, idx) => {
    const end = idx + 1 < markers.length ? markers[idx + 1]!.lineIndex : lines.length;
    return {
      header: marker.header,
      body: lines.slice(marker.lineIndex, end).join("\n").trim(),
    };
  });
}

export function splitSourceByDayMarkers(
  sourceText: string
): Array<{ header: string; body: string }> {
  const lines = sourceText.split("\n");
  const markers: Array<{ header: string; lineIndex: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;

    if (WEEKDAY_WORD.test(line) && parseDayOfMonthFromCalendarHeader(line) != null) {
      markers.push({ header: line.slice(0, 80), lineIndex: i });
      continue;
    }

    if (DIA_N_HEADER_RE.test(line)) {
      markers.push({ header: line.slice(0, 80), lineIndex: i });
      continue;
    }

    const next = lines[i + 1]?.trim() ?? "";
    if (WEEKDAY_WORD.test(line) && /^\d{1,2}$/.test(next)) {
      markers.push({ header: `${line} ${next}`.slice(0, 80), lineIndex: i });
      i += 1;
    }
  }

  if (markers.length < 2) return [];

  return markers.map((marker, idx) => {
    const end = idx + 1 < markers.length ? markers[idx + 1]!.lineIndex : lines.length;
    return {
      header: marker.header,
      body: lines.slice(marker.lineIndex, end).join("\n").trim(),
    };
  });
}

export function countDayMarkersInText(sourceText: string): number {
  return splitSourceByDayMarkers(normalizeAgencyCalendarSourceText(sourceText)).length;
}

function resolveDateFromDiaDeMesHeader(header: string, tripSummary: string): string | null {
  const m = header.match(DIA_DE_MES_HEADER_RE);
  if (!m) return null;
  const dom = Number(m[1]);
  const month = MONTH_NAME_TO_NUM[m[2]!.toLowerCase()];
  if (!Number.isFinite(dom) || !month) return null;

  const range = parseTripDateRangeFromSummary(tripSummary);
  if (!range) return null;

  const years = new Set([range.start.slice(0, 4), range.end.slice(0, 4)]);
  const matches: string[] = [];
  for (const year of years) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(dom).padStart(2, "0")}`;
    if (iso >= range.start && iso <= range.end) matches.push(iso);
  }
  if (matches.length) return matches.sort()[0]!;
  return resolveDayOfMonthInTripRange(dom, range.start, range.end);
}

function resolveSectionDate(header: string, tripSummary: string): string | null {
  const fromDiaDeMes = resolveDateFromDiaDeMesHeader(header, tripSummary);
  if (fromDiaDeMes) return fromDiaDeMes;

  const range = parseTripDateRangeFromSummary(tripSummary);
  if (!range) return null;

  const dom = parseDayOfMonthFromCalendarHeader(header);
  if (dom != null) {
    return resolveDayOfMonthInTripRange(dom, range.start, range.end);
  }

  const diaM = header.match(DIA_N_HEADER_RE);
  if (diaM) {
    const n = Number(diaM[1]);
    if (Number.isFinite(n) && n >= 1) {
      const iso = addUtcDays(range.start, n - 1);
      if (iso >= range.start && iso <= range.end) return iso;
    }
  }

  return null;
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

function buildDaysFromSections(
  sections: Array<{ header: string; body: string }>,
  tripSummary: string
): ItineraryDayPayload[] {
  const days: ItineraryDayPayload[] = [];

  for (const section of sections) {
    const date = resolveSectionDate(section.header, tripSummary);
    if (!date) continue;
    const slots = parseScheduleSlotsFromSection(section.body);
    if (!slots.length) continue;

    const items = slots.map((slot) =>
      normalizeItineraryItem({
        title: slot.label,
        start_time: slot.time,
        activity_kind: inferKindFromSlotLabel(slot.label),
      })
    );

    days.push({ day: days.length + 1, date, items });
  }

  return days;
}

function parseByInlineDayMarkers(sourceText: string, tripSummary: string): ItineraryDayPayload[] | null {
  const markers: Array<{ header: string; index: number }> = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(WEEKDAY_DAY_INLINE_RE.source, "gi");
  while ((m = re.exec(sourceText)) !== null) {
    const dom = Number(m[2]);
    if (dom >= 1 && dom <= 31) {
      markers.push({ header: `${m[1]} ${m[2]}`, index: m.index });
    }
  }

  if (markers.length < 2) return null;

  const sections = markers.map((marker, idx) => {
    const start = marker.index;
    const end = idx + 1 < markers.length ? markers[idx + 1]!.index : sourceText.length;
    return { header: marker.header, body: sourceText.slice(start, end) };
  });

  const days = buildDaysFromSections(sections, tripSummary);
  return days.length >= 2 ? days : null;
}

export function looksLikeAgencyWeekdayCalendar(sourceText: string): boolean {
  const normalized = normalizeAgencyCalendarSourceText(sourceText);
  const sections = countDaySectionsInSource(normalized);
  const markers = countDayMarkersInText(normalized);
  const times = countScheduleLinesInText(normalized);
  const travelCue = /calendario|itinerario|programa|vuelo|excursi|stripes|argentina/i.test(normalized);

  return (
    (times >= 8 && (sections >= 2 || markers >= 2)) ||
    (times >= 15 && travelCue) ||
    (times >= 6 && markers >= 2)
  );
}

export function isAgencyCalendarParseAcceptable(
  draft: ExecutableItineraryPayload,
  sourceText: string,
  tripSummary: string
): boolean {
  const normalized = normalizeAgencyCalendarSourceText(sourceText);
  const times = countScheduleLinesInText(normalized);
  const items = countItineraryItems(draft);
  if (times >= 8 && items < times * 0.65) return false;

  const range = parseTripDateRangeFromSummary(tripSummary);
  if (range) {
    const markers = Math.max(countDayMarkersInText(normalized), countDaySectionsInSource(normalized));
    const tripDays = tripDayCount(range.start, range.end);
    const minExpected = markers >= 2 ? Math.min(markers, tripDays) : 2;
    if (draft.days.length < Math.min(minExpected, tripDays) * 0.55) return false;
  }

  for (const d of draft.days) {
    if ((d.items?.length ?? 0) > 18) return false;
  }

  return draft.days.length >= 2;
}

function scoreAgencyDayParse(days: ItineraryDayPayload[], sourceText: string): number {
  const items = days.reduce((n, d) => n + (d.items?.length ?? 0), 0);
  const times = countScheduleLinesInText(sourceText);
  const maxPerDay = Math.max(...days.map((d) => d.items?.length ?? 0), 0);
  let score = days.length * 100 + items * 3;
  if (times >= 8 && items >= times * 0.65) score += 80;
  if (maxPerDay > 18) score -= 500;
  if (maxPerDay > 12) score -= (maxPerDay - 12) * 40;
  return score;
}

function pickBestAgencyDayParse(
  candidates: ItineraryDayPayload[][],
  sourceText: string
): ItineraryDayPayload[] {
  let best: ItineraryDayPayload[] = [];
  let bestScore = -Infinity;
  for (const days of candidates) {
    if (days.length < 2) continue;
    const score = scoreAgencyDayParse(days, sourceText);
    if (score > bestScore) {
      bestScore = score;
      best = days;
    }
  }
  return best;
}

function buildDaysFromSourceSections(
  sections: Array<{ header: string; body: string }>,
  tripSummary: string
): ItineraryDayPayload[] {
  return buildDaysFromSections(sections, tripSummary);
}

export function parseAgencyCalendarItinerary(
  sourceText: string,
  tripSummary: string
): ExecutableItineraryPayload | null {
  const normalized = normalizeAgencyCalendarSourceText(sourceText);
  if (!parseTripDateRangeFromSummary(tripSummary)) return null;

  const candidates: ItineraryDayPayload[][] = [];
  const compact = extractCompactAgencyCalendarBlock(normalized);

  if (compact) {
    const compactSections =
      splitSourceByDayMarkers(compact).length >= 2
        ? splitSourceByDayMarkers(compact)
        : splitSourceByDaySections(compact).filter((s) => s.header !== "Todo");
    const compactDays = buildDaysFromSourceSections(compactSections, tripSummary);
    if (compactDays.length >= 2) candidates.push(compactDays);
  }

  let sections = splitSourceByDayMarkers(normalized);
  if (sections.length < 2) {
    sections = splitSourceByDiaDeMesMarkers(normalized);
  }
  if (sections.length < 2) {
    sections = splitSourceByDaySections(normalized).filter((s) => s.header !== "Todo");
  }

  const fullDays = buildDaysFromSourceSections(sections, tripSummary);
  if (fullDays.length >= 2) candidates.push(fullDays);

  const inline = parseByInlineDayMarkers(compact ?? normalized, tripSummary);
  if (inline?.length) candidates.push(inline);

  const days = pickBestAgencyDayParse(candidates, compact ?? normalized);
  if (days.length < 2) return null;

  return {
    version: 1,
    title: "Itinerario importado",
    days: days.map((d, idx) => ({ ...d, day: idx + 1 })),
  };
}

export function splitSourceForAgencyCalendar(sourceText: string): Array<{ header: string; body: string }> {
  const normalized = normalizeAgencyCalendarSourceText(sourceText);
  const compact = extractCompactAgencyCalendarBlock(normalized);
  const base = compact ?? normalized;
  const byMarkers = splitSourceByDayMarkers(base);
  if (byMarkers.length >= 2) return byMarkers;
  const byDiaDeMes = splitSourceByDiaDeMesMarkers(normalized);
  if (byDiaDeMes.length >= 2) return byDiaDeMes;
  const byDay = splitSourceByDaySections(base);
  if (byDay.length >= 2) return byDay;
  return [{ header: "Todo", body: normalized }];
}
