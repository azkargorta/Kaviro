import type { ItineraryDayPayload, ItineraryItemPayload } from "@/lib/trip-ai/tripCreationTypes";
import { readRecord, readString } from "@/lib/parse-unknown";

export function itineraryItemKind(item: Pick<ItineraryItemPayload, "activity_kind">): string {
  return String(item.activity_kind || "").toLowerCase();
}

export function isTransportItineraryItem(item: ItineraryItemPayload): boolean {
  return itineraryItemKind(item) === "transport";
}

export function itineraryItemStartTime(item: ItineraryItemPayload): string | null {
  const t = item.start_time;
  return typeof t === "string" && t.trim() ? t.trim() : null;
}

export function itineraryItemAddress(item: ItineraryItemPayload): string {
  return String(item.address || "").trim();
}

export function itineraryItemPlaceName(item: ItineraryItemPayload): string {
  return String(item.place_name || "").trim();
}

export function itineraryItemTitle(item: ItineraryItemPayload): string {
  return String(item.title || "").trim();
}

export function itineraryItemVisitType(item: ItineraryItemPayload): string {
  return readString(item.visit_type).trim();
}

export function itineraryItemDurationMin(item: ItineraryItemPayload): number | null {
  const n = item.duration_min;
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n) : null;
}

export function itineraryItemRequiresTicket(item: ItineraryItemPayload): boolean | null {
  return typeof item.requires_ticket === "boolean" ? item.requires_ticket : null;
}

export function itineraryItemTicketNotes(item: ItineraryItemPayload): string {
  return readString(item.ticket_notes).trim();
}

export function itineraryItemTransportMode(item: ItineraryItemPayload): string {
  return readString(item.transport_mode).trim();
}

export function itineraryItemCoords(item: ItineraryItemPayload): { lat: number | null; lng: number | null } {
  const lat = item.latitude;
  const lng = item.longitude;
  const valid = (v: unknown) => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 180;
  return {
    lat: valid(lat) ? Number(lat) : null,
    lng: valid(lng) ? Number(lng) : null,
  };
}

/** Número de día (1-based) del payload; si falta, usa el índice del array + 1. */
export function itineraryDayNumber(day: ItineraryDayPayload, dayIndex: number): number {
  return typeof day.day === "number" && Number.isFinite(day.day) ? Math.round(day.day) : dayIndex + 1;
}

export function itineraryDayItems(day: ItineraryDayPayload): ItineraryItemPayload[] {
  return Array.isArray(day.items) ? day.items : [];
}

export function countNonTransportItems(items: ItineraryItemPayload[]): number {
  return items.filter((it) => !isTransportItineraryItem(it)).length;
}

/** Extrae items anidados en un objeto plano (respuestas IA con claves dinámicas). */
export function extractNestedItineraryItems(obj: unknown): ItineraryItemPayload[] {
  const record = readRecord(obj);
  if (!record) return [];
  const out: ItineraryItemPayload[] = [];
  for (const k of Object.keys(record)) {
    const v = record[k];
    const row = readRecord(v);
    if (!row) continue;
    const title = readString(row.title);
    const place = readString(row.place_name);
    const kind = readString(row.activity_kind);
    if (title && place && kind) {
      out.push(row as ItineraryItemPayload);
      delete record[k];
    }
  }
  return out;
}
