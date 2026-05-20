import type { ItineraryItemPayload } from "@/lib/trip-ai/tripCreationTypes";

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

export function countNonTransportItems(items: ItineraryItemPayload[]): number {
  return items.filter((it) => !isTransportItineraryItem(it)).length;
}
