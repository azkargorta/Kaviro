export type RoutePathPoint = { lat: number; lng: number };

export function asRoutePathPoints(value: unknown): RoutePathPoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const row = p as Record<string, unknown>;
      const lat = typeof row.lat === "number" ? row.lat : null;
      const lng = typeof row.lng === "number" ? row.lng : null;
      if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    })
    .filter((p): p is RoutePathPoint => p !== null);
}
