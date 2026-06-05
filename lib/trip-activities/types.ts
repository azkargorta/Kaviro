/** Campos habituales de `trip_activities` usados en APIs. */
export type TripActivityRow = {
  id: string;
  trip_id: string;
  title?: string | null;
  description?: string | null;
  activity_date?: string | null;
  activity_time?: string | null;
  place_name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  activity_type?: string | null;
  activity_kind?: string | null;
  linked_reservation_id?: string | null;
  invite_scope?: string | null;
  source?: string | null;
  created_by_user_id?: string | null;
};

export type BulkActivityInput = {
  title?: string;
  description?: string | null;
  activity_date?: string | null;
  activity_time?: string | null;
  place_name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  activity_type?: string | null;
  activity_kind?: string | null;
  source?: string | null;
};

export type BulkActivityInsertRow = {
  trip_id: string;
  title: string;
  description: string | null;
  activity_date: string | null;
  activity_time: string | null;
  place_name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  activity_type: string;
  activity_kind: string;
  source: string;
  created_by_user_id: string;
};

export function asTripActivityRow(row: unknown): TripActivityRow | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.trip_id !== "string") return null;
  return row as TripActivityRow;
}

export function activityTitle(row: Pick<TripActivityRow, "title">): string {
  const title = typeof row.title === "string" ? row.title.trim() : "";
  return title || "Sin título";
}

export function linkedReservationId(row: Pick<TripActivityRow, "linked_reservation_id">): string | null {
  const id = row.linked_reservation_id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}
