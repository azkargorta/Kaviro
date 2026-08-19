/**
 * Phase 3: Validate + Geocodify.
 * Takes raw TripDay[] and geocodes each activity in parallel.
 * Flags unresolvable places but does NOT remove them.
 * Checks geographic coherence and deduplicates.
 */

import { geocodePhotonPreferred, geocodeTripAnchor, regionHintsFromDestination } from "@/lib/geocoding/photonGeocode";
import { haversineKm } from "@/lib/trip-ai/plannerStayRoute";
import type { TripDay, TripActivity } from "./types";

type LatLng = { lat: number; lng: number };

const GEOCODE_CONCURRENCY = 10;
const MAX_DISTANCE_FROM_BASE_KM = 200;

// ─── Geocodify ────────────────────────────────────────────────────────────────

async function geocodeActivity(
  activity: TripActivity,
  anchor: LatLng | null,
  regionHints: string[]
): Promise<TripActivity> {
  if (!activity.placeName) return { ...activity, geocodeStatus: "not_found" };
  try {
    const result = await geocodePhotonPreferred(activity.placeName, {
      anchor,
      regionHints,
      maxDistanceKm: 50000,
    });
    if (result) {
      return { ...activity, lat: result.lat, lng: result.lng, geocodeStatus: "ok" };
    }
    return { ...activity, geocodeStatus: "not_found" };
  } catch {
    return { ...activity, geocodeStatus: "not_found" };
  }
}

async function batchGeocode(
  activities: TripActivity[],
  anchor: LatLng | null,
  regionHints: string[]
): Promise<TripActivity[]> {
  const results: TripActivity[] = [];
  for (let i = 0; i < activities.length; i += GEOCODE_CONCURRENCY) {
    const batch = activities.slice(i, i + GEOCODE_CONCURRENCY);
    const resolved = await Promise.all(batch.map((a) => geocodeActivity(a, anchor, regionHints)));
    results.push(...resolved);
  }
  return results;
}

// ─── Coherence check ──────────────────────────────────────────────────────────

function checkCoherence(
  days: TripDay[],
  baseCenters: Map<string, LatLng>
): TripDay[] {
  return days.map((day) => {
    const baseCenter = baseCenters.get(day.base.toLowerCase());
    if (!baseCenter) return day;

    const activities = day.activities.map((act) => {
      if (act.lat == null || act.lng == null || act.geocodeStatus !== "ok") return act;
      const dist = haversineKm(baseCenter, { lat: act.lat, lng: act.lng });
      if (dist > MAX_DISTANCE_FROM_BASE_KM) {
        return { ...act, geocodeStatus: "not_found" as const, lat: null, lng: null };
      }
      return act;
    });

    return { ...day, activities };
  });
}

// ─── Dedup ────────────────────────────────────────────────────────────────────

function dedup(days: TripDay[]): TripDay[] {
  const seen = new Set<string>();
  return days.map((day) => {
    const activities = day.activities.filter((act) => {
      const key = act.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { ...day, activities };
  });
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function validateAndGeocode(
  days: TripDay[],
  baseCenters: Map<string, LatLng>,
  destinationLabel: string
): Promise<TripDay[]> {
  const anchor = await geocodeTripAnchor(destinationLabel);
  const regionHints = regionHintsFromDestination(destinationLabel);

  const allActivities = days.flatMap((d) => d.activities);
  const geocoded = await batchGeocode(allActivities, anchor, regionHints);

  let actIdx = 0;
  let result = days.map((day) => {
    const activities = day.activities.map(() => geocoded[actIdx++]!);
    return { ...day, activities };
  });

  result = checkCoherence(result, baseCenters);
  result = dedup(result);

  return result;
}
