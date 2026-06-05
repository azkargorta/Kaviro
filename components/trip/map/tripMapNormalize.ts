import { ROUTE_COLOR_PALETTE } from "@/lib/route-colors";
import type { RoutePoint } from "@/hooks/useTripRoutes";
import type { TripMapRoute } from "@/components/trip/map/trip-map-types";

type UnknownRow = Record<string, unknown>;

export type PlanPlace = {
  id: string;
  title: string;
  address: string;
  kind?: string | null;
  activityDate?: string | null;
  latitude: number;
  longitude: number;
};

export type PlanSelectOption = {
  id: string;
  activityId: string;
  title: string;
  address: string;
  kind: string | null;
  activityDate: string | null;
  latitude: number | null;
  longitude: number | null;
  hasCoords: boolean;
};

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type RouteFormState = {
  editingRouteId: string | null;
  routeDate: string;
  routeName: string;
  departureTime: string;
  color: string;
  autoColor: boolean;
  stopEnabled: boolean;
  restStopsEnabled: boolean;
  restStopsCount: number;
  restStopMinutes: number;
  noteText: string;
  checklist: ChecklistItem[];
};

function rowStr(row: UnknownRow, key: string) {
  const v = row[key];
  return typeof v === "string" ? v : null;
}

function rowNum(row: UnknownRow, key: string) {
  const v = row[key];
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function rowPointArray(row: UnknownRow, key: "route_points" | "path_points"): RoutePoint[] | null {
  const v = row[key];
  return Array.isArray(v) ? (v as RoutePoint[]) : null;
}

type RouteChecklistRaw = { id?: unknown; text?: unknown; done?: unknown };

export function randomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export function parseRouteChecklist(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item && typeof item === "object" ? (item as RouteChecklistRaw) : {};
    return {
      id: String(row.id || randomId()),
      text: typeof row.text === "string" ? row.text : "",
      done: Boolean(row.done),
    };
  });
}

export function normalizePlanPlaces(rows: unknown[] | undefined, prefix: string): PlanPlace[] {
  const list: PlanPlace[] = [];
  for (const raw of rows || []) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as UnknownRow;
    const id = rowStr(row, "id");
    const lat = rowNum(row, "latitude");
    const lng = rowNum(row, "longitude");
    if (!id || lat == null || lng == null) continue;
    const title =
      rowStr(row, "title") ||
      rowStr(row, "place_name") ||
      rowStr(row, "location_name") ||
      rowStr(row, "name") ||
      "Lugar";
    const address = rowStr(row, "address") || rowStr(row, "location_name") || title;
    const kind = rowStr(row, "activity_kind") || rowStr(row, "activity_type") || null;
    const activityDate = rowStr(row, "activity_date") || null;
    list.push({ id: `${prefix}:${id}`, title, address, kind, activityDate, latitude: lat, longitude: lng });
  }
  return list;
}

export function normalizePlanSelectOptions(rows: unknown[] | undefined, prefix: string): PlanSelectOption[] {
  const list: PlanSelectOption[] = [];
  for (const raw of rows || []) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as UnknownRow;
    const activityId = rowStr(row, "id");
    if (!activityId) continue;
    const lat = rowNum(row, "latitude");
    const lng = rowNum(row, "longitude");
    const title =
      rowStr(row, "title") ||
      rowStr(row, "place_name") ||
      rowStr(row, "location_name") ||
      rowStr(row, "name") ||
      "Lugar";
    const address = rowStr(row, "address") || rowStr(row, "place_name") || rowStr(row, "location_name") || title;
    const kind = rowStr(row, "activity_kind") || rowStr(row, "activity_type") || null;
    const activityDate = rowStr(row, "activity_date") || null;
    list.push({
      id: `${prefix}:${activityId}`,
      activityId,
      title,
      address,
      kind,
      activityDate,
      latitude: lat,
      longitude: lng,
      hasCoords: lat != null && lng != null,
    });
  }
  return list;
}

export function tripMapRouteKey(r: TripMapRoute) {
  return `${r.source || "trip_routes"}:${r.id}`;
}

export function normalizeRoutes(rows: unknown[] | undefined, source: "trip_routes" | "legacy_routes"): TripMapRoute[] {
  const list: TripMapRoute[] = [];
  for (const raw of rows || []) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as UnknownRow;
    const id = rowStr(row, "id");
    if (!id) continue;
    list.push({
      id,
      source,
      route_order: rowNum(row, "route_order"),
      route_day: rowStr(row, "route_day") || rowStr(row, "route_date") || null,
      route_date: rowStr(row, "route_date") || rowStr(row, "route_day") || null,
      departure_time: rowStr(row, "departure_time") || null,
      title: rowStr(row, "title") || null,
      route_name: rowStr(row, "route_name") || null,
      travel_mode: rowStr(row, "travel_mode") || null,
      color: rowStr(row, "color") || null,
      origin_name: rowStr(row, "origin_name") || null,
      origin_address: rowStr(row, "origin_address") || null,
      origin_latitude: rowNum(row, "origin_latitude"),
      origin_longitude: rowNum(row, "origin_longitude"),
      stop_name: rowStr(row, "stop_name") || null,
      stop_address: rowStr(row, "stop_address") || null,
      stop_latitude: rowNum(row, "stop_latitude"),
      stop_longitude: rowNum(row, "stop_longitude"),
      destination_name: rowStr(row, "destination_name") || null,
      destination_address: rowStr(row, "destination_address") || null,
      destination_latitude: rowNum(row, "destination_latitude"),
      destination_longitude: rowNum(row, "destination_longitude"),
      distance_text: rowStr(row, "distance_text") || null,
      duration_text: rowStr(row, "duration_text") || null,
      arrival_time: rowStr(row, "arrival_time") || null,
      route_points: rowPointArray(row, "route_points"),
      path_points: rowPointArray(row, "path_points"),
      notes: rowStr(row, "notes") || null,
    });
  }
  return list;
}

export function formatKm(meters: number) {
  const km = meters / 1000;
  return km >= 10 ? `${km.toFixed(0)} km` : `${km.toFixed(1)} km`;
}

export function pathLengthMeters(points: RoutePoint[]): number {
  if (points.length < 2) return 0;
  const R = 6371000;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    total += 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  return total;
}

export function formatDuration(seconds: number) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `${h}h ${mm}min` : `${h}h`;
}

export function addDurationToTime(time: string, durationSeconds: number | null) {
  if (!time || typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds)) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const totalMinutes = hours * 60 + minutes + Math.round(durationSeconds / 60);
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(normalized / 60)).padStart(2, "0");
  const mm = String(normalized % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function normalizeIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const d = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

export function defaultNewRouteDate(opts: {
  preferred?: string | null;
  tripStart?: string | null;
  tripDates?: string[];
}): string {
  const preferred = normalizeIsoDate(opts.preferred);
  if (preferred) return preferred;
  const tripStart = normalizeIsoDate(opts.tripStart);
  if (tripStart) return tripStart;
  for (const d of opts.tripDates ?? []) {
    const iso = normalizeIsoDate(d);
    if (iso) return iso;
  }
  return todayISO();
}

export function normalizeFilterDate(v: string): string {
  const t = v.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : "";
}

export function dateInFilterRange(dateStr: string | null | undefined, from: string, to: string): boolean {
  const d = (dateStr || "").trim();
  if (!from && !to) return true;
  if (!d) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export function filterRoutesByDateRange(routes: TripMapRoute[], from: string, to: string): TripMapRoute[] {
  if (!from && !to) return routes;
  return routes.filter((r) => dateInFilterRange(r.route_day || r.route_date, from, to));
}

export function describeDateFilter(from: string, to: string): string {
  if (!from && !to) return "Todos los días";
  if (from && to && from === to) return from;
  if (from && to) return `${from} — ${to}`;
  if (from) return `Desde ${from}`;
  return `Hasta ${to}`;
}

export function isSingleDayFilter(from: string, to: string): string | null {
  if (from && to && from === to) return from;
  return null;
}

export function parseRouteNotes(notes: unknown): Record<string, unknown> | null {
  if (typeof notes !== "string" || !notes.trim()) return null;
  try {
    return JSON.parse(notes) as Record<string, unknown>;
  } catch {
    return { noteText: String(notes) };
  }
}

export function buildRouteNotes(form: RouteFormState, previousNotes: string | null) {
  const prev = parseRouteNotes(previousNotes) || {};
  const noteText = String(form.noteText || "").trim();
  const checklist = Array.isArray(form.checklist)
    ? form.checklist
        .filter((x) => x && typeof x.text === "string")
        .map((x) => ({ id: String(x.id || randomId()), text: String(x.text || ""), done: !!x.done }))
    : [];

  const restStops =
    form.restStopsEnabled && form.restStopsCount > 0
      ? {
          enabled: true,
          count: Math.max(0, Math.floor(form.restStopsCount || 0)),
          minutesEach: Math.max(0, Math.floor(form.restStopMinutes || 0)),
        }
      : { enabled: false, count: 0, minutesEach: 0 };

  return JSON.stringify({ ...prev, noteText, checklist, restStops });
}

export function defaultRouteForm(date: string): RouteFormState {
  return {
    editingRouteId: null,
    routeDate: date || todayISO(),
    routeName: "",
    departureTime: "",
    color: ROUTE_COLOR_PALETTE[0],
    autoColor: true,
    stopEnabled: false,
    restStopsEnabled: false,
    restStopsCount: 1,
    restStopMinutes: 15,
    noteText: "",
    checklist: [],
  };
}
