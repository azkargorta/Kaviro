import type { TripActivityRow } from "@/lib/trip-activities/types";

export function calculateNights(checkInDate?: string | null, checkOutDate?: string | null): number | null {
  if (!checkInDate || !checkOutDate) return null;
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const diffMs = end.getTime() - start.getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return null;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function isLodgingActivityRow(
  row: Pick<TripActivityRow, "activity_type" | "activity_kind">
): boolean {
  const t = String(row.activity_type || "").toLowerCase();
  const k = String(row.activity_kind || "").toLowerCase();
  return t === "lodging" || k === "lodging" || k === "hotel";
}

export function lodgingReservationNameFromActivity(
  row: Pick<TripActivityRow, "title" | "place_name">
): string {
  const place = typeof row.place_name === "string" ? row.place_name.trim() : "";
  if (place) return place;
  const title = typeof row.title === "string" ? row.title.trim() : "";
  return title.replace(/^Check-in\s*·\s*/i, "").trim() || title;
}

export function lodgingReservationPatchFromActivity(
  activity: TripActivityRow,
  checkOutDate: string | null,
  checkOutTime: string | null
): Record<string, unknown> {
  return {
    reservation_name: lodgingReservationNameFromActivity(activity),
    notes: activity.description ?? null,
    check_in_date: activity.activity_date ?? null,
    check_in_time: activity.activity_time ?? null,
    check_out_date: checkOutDate,
    check_out_time: checkOutTime,
    address: activity.address ?? null,
    latitude: typeof activity.latitude === "number" ? activity.latitude : null,
    longitude: typeof activity.longitude === "number" ? activity.longitude : null,
    nights: calculateNights(activity.activity_date ?? null, checkOutDate),
  };
}
