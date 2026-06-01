import type { ItineraryDayPayload } from "@/lib/trip-ai/tripCreationTypes";
import { normalizeItineraryItem } from "@/lib/trip-ai/itineraryDraftUtils";
import { enrichItemFromScheduleSlot, type ScheduleSlot } from "@/lib/trip-ai/scheduleSlotEnrich";

export type { ScheduleSlot };

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Normaliza token horario (16.00h, 19:05, OCR con O→0 en dígitos). */
export function parseHourMinuteToken(hRaw: string, mRaw: string): string | null {
  const hStr = hRaw.replace(/[Oo]/g, "0").replace(/[lI|]/g, "1");
  const mStr = mRaw.replace(/[Oo]/g, "0");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return `${pad2(h)}:${pad2(m)}`;
}

function normalizeLabel(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenOverlapScore(a: string, b: string): number {
  const na = normalizeLabel(a);
  const nb = normalizeLabel(b);
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

/** Extrae una parada con hora de una línea del dossier (tolerante a OCR). */
export function extractScheduleSlotFromLine(line: string): ScheduleSlot | null {
  const t = line.trim();
  if (!t) return null;

  const tryBuild = (time: string | null, label: string): ScheduleSlot | null => {
    const cleanLabel = label.replace(/\s+/g, " ").trim().replace(/^[-–—]\s*/, "");
    if (!time || cleanLabel.length < 2) return null;
    return { time, label: cleanLabel, line: t };
  };

  let m = t.match(/^[-•●]\s*(\d{1,2})[.:](\d{2})\s*h?\s*[-–—]?\s*(.+)$/i);
  if (m) return tryBuild(parseHourMinuteToken(m[1]!, m[2]!), m[3]!);

  m = t.match(/^(\d{1,2})[.:](\d{2})\s*h(?:\s+[-–—]?\s*|\s+)(.+)$/i);
  if (m) return tryBuild(parseHourMinuteToken(m[1]!, m[2]!), m[3]!);

  m = t.match(/^(\d{1,2})[.:](\d{2})h\s*(.+)$/i);
  if (m) return tryBuild(parseHourMinuteToken(m[1]!, m[2]!), m[3]!);

  m = t.match(/^(\d{1,2}):(\d{2})\s+(.+)$/);
  if (m) return tryBuild(parseHourMinuteToken(m[1]!, m[2]!), m[3]!);

  m = t.match(/^(.+?)\s+(\d{1,2})[.:](\d{2})\s*h?\s*$/i);
  if (m) return tryBuild(parseHourMinuteToken(m[2]!, m[3]!), m[1]!);

  const inline = t.match(/(?:^|(?<=[^\d]))(\d{1,2})[.:](\d{2})\s*h?\b/i);
  if (inline) {
    const time = parseHourMinuteToken(inline[1]!, inline[2]!);
    const label = t
      .replace(inline[0], " ")
      .replace(/^\s*[-–—]\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
    return tryBuild(time, label);
  }

  return null;
}

/** Lista ordenada de paradas con hora detectadas en el trozo de día. */
export function parseScheduleSlotsFromSection(body: string): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const seen = new Set<string>();

  for (const line of body.split("\n")) {
    const slot = extractScheduleSlotFromLine(line);
    if (!slot) continue;
    const fp = `${slot.time}|${normalizeLabel(slot.label)}`;
    if (seen.has(fp)) continue;
    seen.add(fp);
    slots.push(slot);
  }

  return slots;
}

const AI_LABEL_MATCH_MIN = 0.28;

function itineraryItemFingerprint(item: { title?: string; start_time?: string | null }): string {
  const title = String(item.title ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  const time = String(item.start_time ?? "").trim();
  return `${time}|${title}`;
}

function dedupeItineraryItems(items: ItineraryDayPayload["items"]): ItineraryDayPayload["items"] {
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

function maxItemsWhenNoScheduleSlots(body: string): number {
  const slots = parseScheduleSlotsFromSection(body);
  if (slots.length >= 1) return Math.max(slots.length + 1, Math.ceil(slots.length * 1.15));
  // Sin marcadores de hora: estimar por longitud del body
  // Un body corto (último día, vuelo de vuelta) → pocos items
  const lines = body.split("\n").filter((l) => l.trim().length > 3).length;
  if (lines <= 3) return 2;   // Último día muy corto → máximo 2 items
  if (lines <= 8) return 4;   // Día breve → máximo 4
  if (lines <= 15) return 6;  // Día normal sin horas → máximo 6
  return 8;                   // Día largo sin horas → máximo 8 (antes era 12)
}

/**
 * Fuente de verdad: líneas con hora del dossier. La IA solo aporta título/lugar/tickets;
 * nunca define start_time (evita horas inventadas o permutadas).
 */
export function buildItemsFromSectionSchedule(
  aiItems: ItineraryDayPayload["items"],
  sectionBody: string
): ItineraryDayPayload["items"] {
  const slots = parseScheduleSlotsFromSection(sectionBody);
  const pool = dedupeItineraryItems(aiItems);

  if (!slots.length) {
    return pool.slice(0, maxItemsWhenNoScheduleSlots(sectionBody));
  }

  const used = new Set<number>();

  return slots.map((slot) => {
    let bestIdx = -1;
    let bestScore = 0;

    for (let i = 0; i < pool.length; i++) {
      if (used.has(i)) continue;
      const blob = [pool[i]!.title, pool[i]!.place_name, pool[i]!.notes].filter(Boolean).join(" ");
      const score = tokenOverlapScore(blob, slot.label);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    const base =
      bestIdx >= 0 && bestScore >= AI_LABEL_MATCH_MIN
        ? pool[bestIdx]!
        : normalizeItineraryItem({ title: slot.label });

    if (bestIdx >= 0) used.add(bestIdx);

    return enrichItemFromScheduleSlot(base, slot, inferKindFromSlotLabel);
  });
}

/** @deprecated Alias: usa buildItemsFromSectionSchedule */
export function alignItemsToSectionSchedule(
  items: ItineraryDayPayload["items"],
  sectionBody: string
): ItineraryDayPayload["items"] {
  return buildItemsFromSectionSchedule(items, sectionBody);
}
