import type { ExecutableItineraryPayload } from "@/lib/trip-ai/tripCreationTypes";
import { findItineraryJsonEnd, findItineraryJsonStart } from "@/lib/trip-ai/kaviroJsonMarkers";

export type ItineraryItemDraft = ExecutableItineraryPayload["days"][number]["items"][number];

export type ItineraryDraftPayload = ExecutableItineraryPayload;

export function itineraryItemKey(day: number, index: number) {
  return `d${day}-i${index}`;
}

export function collectItineraryItemKeys(draft: ItineraryDraftPayload): Set<string> {
  const keys = new Set<string>();
  for (const day of draft.days) {
    const items = day.items ?? [];
    items.forEach((_, idx) => keys.add(itineraryItemKey(day.day, idx)));
  }
  return keys;
}

export function countItineraryItems(draft: ItineraryDraftPayload): number {
  return draft.days.reduce((n, d) => n + (d.items?.length ?? 0), 0);
}

export function filterItineraryBySelection(
  draft: ItineraryDraftPayload,
  selected: Set<string>
): ItineraryDraftPayload {
  return {
    ...draft,
    days: draft.days
      .map((day) => ({
        ...day,
        items: (day.items ?? []).filter((_, idx) => selected.has(itineraryItemKey(day.day, idx))),
      }))
      .filter((day) => (day.items?.length ?? 0) > 0),
  };
}

export function normalizeItineraryItem(raw: unknown): ItineraryItemDraft {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const title = String(r.title ?? "").trim() || "Actividad";
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const bool = (v: unknown) => (typeof v === "boolean" ? v : null);

  return {
    title,
    activity_kind: str(r.activity_kind),
    place_name: str(r.place_name),
    address: str(r.address),
    latitude: num(r.latitude),
    longitude: num(r.longitude),
    start_time: str(r.start_time),
    duration_min: num(r.duration_min),
    end_time: str(r.end_time),
    visit_type: str(r.visit_type),
    requires_ticket: bool(r.requires_ticket),
    ticket_notes: str(r.ticket_notes),
    transport_mode: str(r.transport_mode),
    notes: str(r.notes),
  };
}

/** Respuesta del asistente o texto pegado que describe un itinerario (aunque el usuario escribiera poco). */
export function looksLikeAssistantItineraryText(text: string): boolean {
  const q = text.trim();
  if (q.length < 280) return false;
  if (looksLikePastedItineraryImport(q)) return true;
  const dayHits = (q.match(/d[ií]a\s+\d+|day\s+\d+/gi) || []).length;
  const timeHits = (q.match(/\d{1,2}[.:]\d{2}\s*h\b|\d{1,2}:\d{2}/gi) || []).length;
  const itineraryCue =
    /\bitinerario\b|\bagenda\b|\bparadas?\b|\b\d+\s*d[ií]as\b|desde el \d{1,2} de \w+/i.test(q);
  return (
    (itineraryCue && q.length >= 500) ||
    (dayHits >= 1 && timeHits >= 2) ||
    dayHits >= 2 ||
    (timeHits >= 5 && q.length > 800)
  );
}

/**
 * Quita bloques JSON ejecutables del texto; si el JSON está truncado, conserva el texto completo
 * para que la importación por IA pueda recuperar el itinerario.
 */
export function prepareItineraryTextForImport(raw: string): string {
  const text = raw.trim();
  if (!text) return text;
  const start = findItineraryJsonStart(text);
  if (!start) return text;
  const end = findItineraryJsonEnd(text, start.index + start.marker.length);
  if (end) {
    const before = text.slice(0, start.index).trim();
    const after = text.slice(end.index + end.marker.length).trim();
    const merged = [before, after].filter((s) => s.length > 0).join("\n\n");
    return merged.length >= 80 ? merged : text;
  }
  return text;
}

/** Mejor texto para importar: prioriza la respuesta larga del asistente frente a un mensaje corto del usuario. */
export function buildItineraryImportSource(userMessage: string, assistantAnswer: string): string {
  const u = prepareItineraryTextForImport(userMessage);
  const a = prepareItineraryTextForImport(assistantAnswer);
  const uScore = u.length + (looksLikeAssistantItineraryText(u) ? 800 : 0);
  const aScore = a.length + (looksLikeAssistantItineraryText(a) ? 800 : 0);
  if (aScore > uScore + 150) return a;
  if (uScore > aScore + 150) return u;
  if (a.length > 400 && u.length > 400 && a !== u) return `${u}\n\n---\n\n${a}`;
  return a.length >= u.length ? a : u;
}

/** Texto largo con horas y bloques por día → importar como itinerario ejecutable. */
export function looksLikePastedItineraryImport(question: string): boolean {
  const q = question.trim();
  if (q.length < 400) return false;
  const timeHits = (q.match(/\d{1,2}[.:]\d{2}\s*h\b|\d{1,2}:\d{2}/gi) || []).length;
  const dayHits = (q.match(/d[ií]a\s+\d+/gi) || []).length;
  const hasScheduleCue = /\d{1,2}[.:]\d{2}\s*h\s*[-–—]/i.test(q) || /quedada|llegada|vuelo|check[- ]?out/i.test(q);
  return (
    (timeHits >= 3 && (dayHits >= 1 || hasScheduleCue)) ||
    (dayHits >= 2 && q.length > 900) ||
    (timeHits >= 6 && q.length > 1200)
  );
}

/** Estima cuántas actividades debería haber en un texto pegado (heurística conservadora). */
export function estimateMinActivitiesFromSource(sourceText: string): number {
  const q = sourceText.trim();
  if (!q) return 1;
  const timeHits = (q.match(/\d{1,2}[.:]\d{2}\s*h\s*[-–—]|\d{1,2}[.:]\d{2}\s*h\s+\S/gi) || []).length;
  const dayHits = (q.match(/d[ií]a\s+\d+/gi) || []).length;
  if (dayHits >= 2) return Math.max(dayHits * 2, timeHits >= 4 ? Math.floor(timeHits * 0.65) : dayHits);
  if (timeHits >= 4) return Math.max(4, Math.floor(timeHits * 0.7));
  if (looksLikePastedItineraryImport(q)) return 3;
  return 1;
}

/** True si el borrador tiene muchas menos actividades de las que sugiere el texto original. */
export function isItineraryImportIncomplete(
  draft: ItineraryDraftPayload,
  sourceText: string
): boolean {
  const got = countItineraryItems(draft);
  const expected = estimateMinActivitiesFromSource(sourceText);
  const dayHits = (sourceText.match(/d[ií]a\s+\d+/gi) || []).length;
  if (sourceText.length > 2000 && got <= 2) return true;
  if (dayHits >= 3 && got < dayHits) return true;
  if (expected >= 5 && got < expected * 0.45) return true;
  return expected >= 3 && got < Math.min(expected, got + 2);
}
