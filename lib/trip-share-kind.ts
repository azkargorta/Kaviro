export type TripShareKind = "itinerary" | "recap";

export function parseTripShareKind(value: unknown): TripShareKind {
  return value === "recap" ? "recap" : "itinerary";
}
