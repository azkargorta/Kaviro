/**
 * Core types for the new trip planner pipeline.
 * Days are the single source of truth; stays are always derived from days.
 */

// ─── Brief (input from interview) ─────────────────────────────────────────────

export type TripLeg = {
  place: string | null;
  date: string | null;
  time: string | null;
};

export type TripTransport = "driving" | "transit" | "walking" | "mixed";
export type TripPace = "relaxed" | "balanced" | "intense";

export type TripBrief = {
  destinations: string[];
  sleepBases: string[];
  startDate: string;
  endDate: string;
  arrival: TripLeg;
  departure: TripLeg;
  transport: TripTransport | null;
  pace: TripPace | null;
  travelersType: "solo" | "couple" | "friends" | "family" | null;
  travelerCount: number | null;
  interests: string[];
  avoid: string[];
  mustDo: string[];
  constraints: string[];
  freeText: string;
};

// ─── Skeleton (Phase 1 output) ────────────────────────────────────────────────

export type SkeletonDayType =
  | "arrival"
  | "departure"
  | "full"
  | "transfer_scenic"
  | "transfer_practical"
  | "rest";

export type SkeletonDay = {
  dayNum: number;
  date: string;
  dayType: SkeletonDayType;
  base: string;
  summary: string;
  transferFrom: string | null;
  transferTo: string | null;
  mainActivities: string[];
  availableHours: number;
  notes: string | null;
};

export type SkeletonStay = {
  stop: string;
  nights: number;
};

export type TripSkeleton = {
  days: SkeletonDay[];
  stays: SkeletonStay[];
  reasoning: string | null;
};

// ─── Itinerary (Phase 2 output) ───────────────────────────────────────────────

export type ActivityKind =
  | "culture"
  | "nature"
  | "viewpoint"
  | "neighborhood"
  | "market"
  | "excursion"
  | "gastro"
  | "shopping"
  | "night"
  | "transport"
  | "rest";

export type TripActivity = {
  title: string;
  description: string | null;
  time: string | null;
  durationMinutes: number | null;
  kind: ActivityKind;
  placeName: string | null;
  lat: number | null;
  lng: number | null;
  geocodeStatus: "ok" | "not_found" | "pending";
};

export type TripDay = {
  dayNum: number;
  date: string;
  base: string;
  summary: string;
  activities: TripActivity[];
};

export type TripItinerary = {
  brief: TripBrief;
  skeleton: TripSkeleton;
  days: TripDay[];
  generatedAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function staysFromDays(days: SkeletonDay[]): SkeletonStay[] {
  const out: SkeletonStay[] = [];
  for (const day of days) {
    const stop = day.base.trim();
    if (!stop) continue;
    const last = out[out.length - 1];
    if (last && last.stop.toLowerCase() === stop.toLowerCase()) {
      last.nights += 1;
    } else {
      out.push({ stop, nights: 1 });
    }
  }
  return out;
}

export function totalDaysBetween(start: string, end: string): number {
  const a = new Date(`${start}T12:00:00Z`).getTime();
  const b = new Date(`${end}T12:00:00Z`).getTime();
  return Math.max(1, Math.round((b - a) / (86400 * 1000)) + 1);
}

export function addDaysToIso(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
