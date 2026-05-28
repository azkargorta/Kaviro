import type { ExecutableItineraryPayload } from "@/lib/trip-ai/tripCreationTypes";

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
