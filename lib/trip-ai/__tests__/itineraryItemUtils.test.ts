import { describe, expect, it } from "vitest";
import {
  countNonTransportItems,
  extractNestedItineraryItems,
  isTransportItineraryItem,
  itineraryDayNumber,
  itineraryItemCoords,
  itineraryItemStartTime,
} from "@/lib/trip-ai/itineraryItemUtils";
import type { ItineraryDayPayload, ItineraryItemPayload } from "@/lib/trip-ai/tripCreationTypes";

describe("itineraryItemUtils", () => {
  it("detecta transporte y cuenta items no transporte", () => {
    const items: ItineraryItemPayload[] = [
      { title: "A", activity_kind: "visit" },
      { title: "B", activity_kind: "transport" },
    ];
    expect(isTransportItineraryItem(items[1]!)).toBe(true);
    expect(countNonTransportItems(items)).toBe(1);
  });

  it("lee hora de inicio y coordenadas válidas", () => {
    const item: ItineraryItemPayload = {
      title: "Museo",
      start_time: "10:30",
      latitude: 40.4,
      longitude: -3.7,
    };
    expect(itineraryItemStartTime(item)).toBe("10:30");
    expect(itineraryItemCoords(item)).toEqual({ lat: 40.4, lng: -3.7 });
  });

  it("itineraryDayNumber usa day o índice", () => {
    const day: ItineraryDayPayload = { day: 3, date: "2026-06-03", items: [] };
    expect(itineraryDayNumber(day, 0)).toBe(3);
    expect(itineraryDayNumber({ day: Number.NaN, date: null, items: [] }, 4)).toBe(5);
  });

  it("extractNestedItineraryItems saca filas con title/place/kind", () => {
    const bag: Record<string, unknown> = {
      extra: { title: "T", place_name: "P", activity_kind: "visit", address: "X" },
      meta: { foo: 1 },
    };
    const found = extractNestedItineraryItems(bag);
    expect(found).toHaveLength(1);
    expect(found[0]?.title).toBe("T");
    expect(bag.extra).toBeUndefined();
  });
});
