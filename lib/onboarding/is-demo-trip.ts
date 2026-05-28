import { DEMO_TRIP_DESTINATION, DEMO_TRIP_NAME } from "@/lib/onboarding/demo-trip-seed";

export type TripDemoFields = {
  id?: string;
  name?: string | null;
  destination?: string | null;
  is_demo?: boolean | null;
};

/** Viaje demo canónico actual (Londres). */
export function isCurrentCanonicalDemoTrip(trip: TripDemoFields): boolean {
  const name = String(trip.name || "").trim();
  const dest = String(trip.destination || "").trim();
  return (
    name === DEMO_TRIP_NAME ||
    (name.includes("Demo") && name.includes("Londres")) ||
    dest === DEMO_TRIP_DESTINATION
  );
}

export const isCurrentLondonDemoTrip = isCurrentCanonicalDemoTrip;

const LEGACY_DEMO_PATTERNS: RegExp[] = [
  /viaje\s+con\s+stripes/i,
  /stripes\s*·/i,
  /lambeau/i,
  /chicago,\s*illinois/i,
  /viaje\s+a\s+usa/i,
  /trip\s+to\s+usa/i,
];

function matchesLegacyDemoSignature(trip: TripDemoFields): boolean {
  if (isCurrentCanonicalDemoTrip(trip)) return false;
  const haystack = `${trip.name || ""} ${trip.destination || ""}`.trim().toLowerCase();
  if (!haystack) return false;
  return LEGACY_DEMO_PATTERNS.some((rx) => rx.test(haystack));
}

/** Viaje de práctica: flag, perfil, joined_via demo o demos antiguos (p. ej. Stripes/USA). */
export function isDemoTripForListing(
  trip: TripDemoFields,
  options?: { demoTripId?: string | null; joinedViaDemo?: boolean }
): boolean {
  if (trip.is_demo) return true;
  if (options?.demoTripId && trip.id && trip.id === options.demoTripId) return true;
  if (options?.joinedViaDemo) return true;
  if (isCurrentCanonicalDemoTrip(trip)) return true;
  return matchesLegacyDemoSignature(trip);
}
