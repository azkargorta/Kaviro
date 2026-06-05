export type TripRouteRow = {
  id?: string;
  trip_id?: string;
  title?: string | null;
  route_name?: string | null;
  name?: string | null;
};

function bodyRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

function firstString(body: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function firstValue(body: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (body[key] !== undefined) return body[key];
  }
  return undefined;
}

export function buildTripRoutePayload(body: unknown): Record<string, unknown> {
  const b = bodyRecord(body);
  return {
    trip_id: firstString(b, ["tripId", "trip_id"]),
    route_day: firstValue(b, ["route_day", "route_date", "day_date"]) ?? null,
    route_date: firstValue(b, ["route_date", "route_day", "day_date"]) ?? null,
    day_date: firstValue(b, ["day_date", "route_date", "route_day"]) ?? null,
    title: firstValue(b, ["title", "route_name", "name"]) ?? null,
    route_name: firstValue(b, ["route_name", "title", "name"]) ?? null,
    name: firstValue(b, ["name", "route_name", "title"]) ?? null,
    departure_time: firstValue(b, ["departure_time", "start_time"]) ?? null,
    start_time: firstValue(b, ["start_time", "departure_time"]) ?? null,
    travel_mode: firstValue(b, ["travel_mode", "mode"]) ?? "driving",
    mode: firstValue(b, ["mode", "travel_mode"]) ?? "driving",
    notes: b.notes ?? null,
    color: b.color ?? null,
    route_order: typeof b.route_order === "number" ? b.route_order : null,
    origin_name: b.origin_name ?? null,
    origin_address: b.origin_address ?? b.origin_name ?? null,
    origin_latitude: b.origin_latitude ?? null,
    origin_longitude: b.origin_longitude ?? null,
    stop_name: b.stop_name ?? null,
    stop_address: b.stop_address ?? b.stop_name ?? null,
    stop_latitude: b.stop_latitude ?? null,
    stop_longitude: b.stop_longitude ?? null,
    destination_name: b.destination_name ?? null,
    destination_address: b.destination_address ?? b.destination_name ?? null,
    destination_latitude: b.destination_latitude ?? null,
    destination_longitude: b.destination_longitude ?? null,
    waypoints: Array.isArray(b.waypoints) ? b.waypoints : [],
    path_points: Array.isArray(b.path_points) ? b.path_points : [],
    route_points: Array.isArray(b.route_points) ? b.route_points : [],
    distance_text: b.distance_text ?? null,
    duration_text: b.duration_text ?? null,
    arrival_time: b.arrival_time ?? null,
  };
}

export function buildTripRoutePatchPayload(body: unknown): Record<string, unknown> {
  const b = bodyRecord(body);
  const payload: Record<string, unknown> = {};
  const assign = (key: string, value: unknown) => {
    if (value !== undefined) payload[key] = value;
  };

  assign("route_day", firstValue(b, ["route_day", "route_date", "day_date"]));
  assign("route_date", firstValue(b, ["route_date", "route_day", "day_date"]));
  assign("day_date", firstValue(b, ["day_date", "route_date", "route_day"]));
  assign("title", firstValue(b, ["title", "route_name", "name"]));
  assign("route_name", firstValue(b, ["route_name", "title", "name"]));
  assign("name", firstValue(b, ["name", "route_name", "title"]));
  assign("departure_time", firstValue(b, ["departure_time", "start_time"]));
  assign("start_time", firstValue(b, ["start_time", "departure_time"]));
  assign("travel_mode", firstValue(b, ["travel_mode", "mode"]));
  assign("mode", firstValue(b, ["mode", "travel_mode"]));
  assign("notes", b.notes);
  assign("color", b.color);
  assign("route_order", b.route_order);
  assign("origin_name", b.origin_name);
  assign("origin_address", b.origin_address);
  assign("origin_latitude", b.origin_latitude);
  assign("origin_longitude", b.origin_longitude);
  assign("stop_name", b.stop_name);
  assign("stop_address", b.stop_address);
  assign("stop_latitude", b.stop_latitude);
  assign("stop_longitude", b.stop_longitude);
  assign("destination_name", b.destination_name);
  assign("destination_address", b.destination_address);
  assign("destination_latitude", b.destination_latitude);
  assign("destination_longitude", b.destination_longitude);
  assign("waypoints", Array.isArray(b.waypoints) ? b.waypoints : b.waypoints);
  assign("path_points", Array.isArray(b.path_points) ? b.path_points : b.path_points);
  assign("route_points", Array.isArray(b.route_points) ? b.route_points : b.route_points);
  assign("distance_text", b.distance_text);
  assign("duration_text", b.duration_text);
  assign("arrival_time", b.arrival_time);

  return payload;
}

export function omitPayloadKey(
  payload: Record<string, unknown>,
  key: string
): Record<string, unknown> {
  const { [key]: _removed, ...rest } = payload;
  return rest;
}

export function routeDisplayTitle(row: TripRouteRow): string {
  const title =
    (typeof row.title === "string" ? row.title.trim() : "") ||
    (typeof row.route_name === "string" ? row.route_name.trim() : "") ||
    (typeof row.name === "string" ? row.name.trim() : "");
  return title || "Ruta";
}
