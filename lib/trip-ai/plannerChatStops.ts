import { addDaysIso, daysBetweenInclusive, isIsoDate } from "@/lib/trip-ai/tripCreationDates";

const STOPWORDS = new Set(
  [
    "coche",
    "avion",
    "avión",
    "bus",
    "tren",
    "hotel",
    "aeropuerto",
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "mi",
    "tu",
    "su",
    "este",
    "esta",
    "grupo",
    "pareja",
    "familia",
    "coche de",
  ].map((s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())
);

function titleCasePlace(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function normWord(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const PLACE_SKIP = new Set(
  [
    ...STOPWORDS,
    "dia",
    "dias",
    "en",
    "y",
    "de",
    "con",
    "para",
    "por",
    "del",
    "al",
    "que",
    "orden",
    "dormir",
    "duermo",
    "noche",
    "noches",
    "base",
    "bases",
    "este",
  ].map((s) => normWord(s))
);

function isSkippablePlace(raw: string): boolean {
  const n = normWord(raw);
  if (!n || PLACE_SKIP.has(n)) return true;
  const first = n.split(/\s+/)[0] || "";
  return PLACE_SKIP.has(first);
}

/** Ciudades mencionadas tras «en …» o pegadas a un día («7cafayate»). */
export function extraStopsFromChat(message: string): string[] {
  const out: string[] = [];
  const enRe = /\ben\s+([a-záéíóúüñ]{3,}(?:\s+[a-záéíóúüñ]{3,})?)/gi;
  for (const m of message.matchAll(enRe)) {
    const raw = (m[1] || "").trim();
    if (!raw || isSkippablePlace(raw)) continue;
    out.push(titleCasePlace(raw));
  }
  const gluedRe = /(\d{1,2})([a-záéíóúüñ]{4,})/gi;
  for (const m of message.matchAll(gluedRe)) {
    const raw = (m[2] || "").trim();
    if (!raw || isSkippablePlace(raw)) continue;
    out.push(titleCasePlace(raw));
  }
  const dayPlaceRe =
    /(?:d[ií]as?\s*)?\d{1,2}(?:\s*(?:y|e|,|\/)\s*\d{1,2})*\s+(?!en\b)([a-záéíóúüñ]{3,})/gi;
  for (const m of message.matchAll(dayPlaceRe)) {
    const raw = (m[1] || "").trim();
    if (!raw || isSkippablePlace(raw)) continue;
    out.push(titleCasePlace(raw));
  }
  return uniquePlaces(out);
}

export function chatWantsNewSleepPlan(message: string): boolean {
  return /\b(dormir|duermo|duermen|noches?|aloj|quedarme|quedamos|bases?)\b/i.test(message);
}

export function uniquePlaces(...lists: Array<string[] | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const raw of list || []) {
      const t = String(raw || "").trim();
      if (!t) continue;
      const k = normWord(t);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
  }
  return out;
}

export type SleepStayRow = { stop: string; nights: number; reason: string };
export type ParsedSleepPlan = { stays: SleepStayRow[]; places: string[] };

function matchKnownPlace(raw: string, known: string[], requireKnown = false): string | null {
  const n = normWord(raw);
  if (!n) return requireKnown ? null : titleCasePlace(raw);
  let best: string | null = null;
  let bestScore = 0;
  for (const k of known) {
    const kn = normWord(k);
    if (!kn) continue;
    let score = 0;
    if (kn === n) score = 100;
    else if (n.includes(kn)) score = 80 + kn.length;
    else if (kn.includes(n)) score = 60 + n.length;
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  if (bestScore >= 50 && best) return best;
  if (requireKnown) return null;
  return titleCasePlace(raw);
}

/** «el 6» en un viaje 6–11 dic = 6 dic (día 1), no el día 6 del itinerario. */
export function resolveChatDayNumber(n: number, startDate: string, endDate: string): number | null {
  if (!Number.isInteger(n) || n < 1 || n > 31 || !isIsoDate(startDate) || !isIsoDate(endDate)) return null;
  const total = daysBetweenInclusive(startDate, endDate);
  for (let i = 0; i < total; i++) {
    const iso = addDaysIso(startDate, i);
    if (Number(iso.slice(8, 10)) === n) return i + 1;
  }
  if (n <= total) return n;
  return null;
}

function fillDayBases(assigned: Array<string | null>, hub: string | null): string[] | null {
  const out: Array<string | null> = assigned.slice();
  if (hub) {
    if (!out[0]) out[0] = hub;
    if (!out[out.length - 1]) out[out.length - 1] = hub;
  }
  let last: string | null = null;
  for (let i = 0; i < out.length; i++) {
    if (out[i]) last = out[i];
    else if (last) out[i] = last;
  }
  let next: string | null = null;
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i]) next = out[i];
    else if (next) out[i] = next;
  }
  if (out.some((x) => !x)) return null;
  return out as string[];
}

function compactStayBlocks(dayBases: string[]): SleepStayRow[] {
  const blocks: SleepStayRow[] = [];
  for (const stop of dayBases) {
    if (!stop) continue;
    const last = blocks[blocks.length - 1];
    if (last && normWord(last.stop) === normWord(stop)) last.nights += 1;
    else blocks.push({ stop, nights: 1, reason: "Según las noches que indicaste." });
  }
  return blocks;
}

const SLEEP_GROUP_RE =
  /(?:(?:el|los|la|las)\s+)?(?:d[ií]as?\s*)?(\d{1,2}(?:\s*(?:y|e|,|\/)\s*(?:el|los|la|las)?\s*\d{1,2})*)(\s+en\s+|\s*)([a-záéíóúüñ]{3,}(?:\s+(?!d[ií]as?\b)[a-záéíóúüñ]{3,})?)/gi;

function applySleepHit(
  assigned: Array<string | null>,
  numsRaw: string,
  place: string,
  startDate: string,
  endDate: string
): number {
  let hits = 0;
  const nums = numsRaw.match(/\d{1,2}/g) || [];
  for (const raw of nums) {
    const day = resolveChatDayNumber(Number(raw), startDate, endDate);
    if (!day) continue;
    assigned[day - 1] = place;
    hits += 1;
  }
  return hits;
}

/**
 * Plan de noches con fechas explícitas («el 6 y 10 en Salta, el 7 en Cafayate»).
 * Si no hay números de día, devuelve null para que el servidor elija la ruta.
 */
export function parseSleepAssignmentsFromChat(
  message: string,
  opts: {
    startDate: string;
    endDate: string;
    knownPlaces?: string[];
    hubPlace?: string | null;
  }
): ParsedSleepPlan | null {
  if (!message.trim() || !isIsoDate(opts.startDate) || !isIsoDate(opts.endDate)) return null;
  const total = daysBetweenInclusive(opts.startDate, opts.endDate);
  const known = (opts.knownPlaces || []).filter(Boolean);
  const assigned: Array<string | null> = Array.from({ length: total }, () => null);
  let hits = 0;

  const groupRe = new RegExp(SLEEP_GROUP_RE.source, "gi");
  for (const m of message.matchAll(groupRe)) {
    const numsRaw = m[1] || "";
    const sep = m[2] || "";
    const placeRaw = (m[3] || "").trim();
    if (!placeRaw || isSkippablePlace(placeRaw)) continue;
    const hasEn = /\ben\b/i.test(sep);
    const place = matchKnownPlace(placeRaw, known, !hasEn && known.length > 0);
    if (!place || isSkippablePlace(place)) continue;
    hits += applySleepHit(assigned, numsRaw, place, opts.startDate, opts.endDate);
  }

  const gluedRe = /(\d{1,2})([a-záéíóúüñ]{4,})/gi;
  for (const m of message.matchAll(gluedRe)) {
    const placeRaw = (m[2] || "").trim();
    if (!placeRaw || isSkippablePlace(placeRaw)) continue;
    const place = matchKnownPlace(placeRaw, known, known.length > 0);
    if (!place || isSkippablePlace(place)) continue;
    hits += applySleepHit(assigned, m[1] || "", place, opts.startDate, opts.endDate);
  }
  if (hits < 1) return null;

  const knownAll = uniquePlaces(known, assigned.filter((x): x is string => Boolean(x)));
  const hubRaw = (opts.hubPlace || "").trim();
  const hub = hubRaw ? matchKnownPlace(hubRaw, knownAll) : null;
  const hubOk = hub && !STOPWORDS.has(normWord(hub)) ? hub : null;
  const filled = fillDayBases(assigned, hubOk);
  if (!filled) return null;

  const stays = compactStayBlocks(filled);
  if (!stays.length) return null;
  return { stays, places: uniquePlaces(stays.map((s) => s.stop)) };
}
