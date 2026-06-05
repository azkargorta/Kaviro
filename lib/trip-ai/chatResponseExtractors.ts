import {
  DIFF_JSON_END_ALIASES,
  DIFF_JSON_START_ALIASES,
  extractJsonBetweenMarkers,
} from "@/lib/trip-ai/kaviroJsonMarkers";
import type { RoutesDraftPayload } from "@/lib/trip-ai/routesDraftTypes";

export type DiffOperation =
  | { op: "update_activity"; id: string; patch: Record<string, unknown> }
  | { op: "create_activity"; fields: Record<string, unknown> }
  | { op: "delete_activity"; id: string }
  | { op: "update_route"; id: string; patch: Record<string, unknown> }
  | { op: "create_route"; fields: Record<string, unknown> };

export type DiffPayload = {
  version: 1;
  title?: string;
  operations: DiffOperation[];
};

export type MissingCoordsItem = { date: string; id: string; title: string };

export function tryExtractRoutesDraft(data: unknown): RoutesDraftPayload | null {
  if (!data || typeof data !== "object") return null;
  const v = (data as { routesDraft?: unknown }).routesDraft;
  if (!v || typeof v !== "object") return null;
  const row = v as Record<string, unknown>;
  if (row.version !== 1) return null;
  if (typeof row.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) return null;
  if (row.travelMode !== "DRIVING" && row.travelMode !== "WALKING" && row.travelMode !== "BICYCLING") return null;
  if (!Array.isArray(row.routes)) return null;
  return v as RoutesDraftPayload;
}

export function tryExtractMissingCoords(data: unknown): MissingCoordsItem[] | null {
  if (!data || typeof data !== "object") return null;
  const v = (data as { missingCoords?: unknown }).missingCoords;
  if (!Array.isArray(v) || v.length === 0) return null;
  const out: MissingCoordsItem[] = [];
  for (const row of v) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const date = typeof r.date === "string" ? r.date : "";
    const id = typeof r.id === "string" ? r.id : "";
    const title = typeof r.title === "string" ? r.title : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !id || !title) continue;
    out.push({ date, id, title });
  }
  return out.length ? out : null;
}

export function extractDiff(answer: string): DiffPayload | null {
  const raw = extractJsonBetweenMarkers(answer, DIFF_JSON_START_ALIASES, DIFF_JSON_END_ALIASES);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.operations)) return null;
    return parsed as DiffPayload;
  } catch {
    return null;
  }
}
