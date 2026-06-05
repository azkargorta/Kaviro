"use client";

import { useMemo } from "react";
import L from "leaflet";
import type { RoutePoint } from "@/hooks/useTripRoutes";
import type { TripMapRoute } from "@/components/trip/map/trip-map-types";
import type { PlanPlace } from "@/components/trip/map/tripMapNormalize";
import { dateInFilterRange } from "@/components/trip/map/tripMapNormalize";
import { getLegendItem, normalizePlaceKind } from "@/components/trip/map/tripMapMarkerConfig";
import { emojiIcon, numberIcon } from "@/components/trip/map/tripMapLeafletIcons";

export type MapMarkerEntity = {
  key: string;
  lat: number;
  lng: number;
  title: string;
  icon: L.Icon | L.DivIcon;
  subtitle?: string;
};

export type MapLineEntity = {
  key: string;
  points: RoutePoint[];
  color: string;
  label: string;
};

type RoutePreviewSlice = {
  key: string;
  points: RoutePoint[];
  color: string;
  label: string;
} | null;

type CustomKindMeta = { label: string; emoji?: string | null; color?: string | null };

function markerAppearance(kindRaw: string, custom?: Map<string, CustomKindMeta>) {
  const k = normalizePlaceKind(kindRaw);
  const meta = custom?.get(k);
  const legend = getLegendItem(kindRaw);
  return {
    emoji: meta?.emoji || legend.emoji,
    color: meta?.color || legend.markerColor,
  };
}

export function buildTripMapEntities(params: {
  allPlanPlaces: PlanPlace[];
  customByKey?: Map<string, CustomKindMeta>;
  focusedRouteKey: string | null;
  isRouteFormOpen: boolean;
  planKindFilter: Set<string>;
  routePreview: RoutePreviewSlice;
  filterDateFrom: string;
  filterDateTo: string;
  showPlanMarkers: boolean;
  showCityRoute: boolean;
  visibleRoutes: TripMapRoute[];
}): { markers: MapMarkerEntity[]; lines: MapLineEntity[] } {
  const {
    allPlanPlaces,
    customByKey,
    focusedRouteKey,
    isRouteFormOpen,
    planKindFilter,
    routePreview,
    filterDateFrom,
    filterDateTo,
    showPlanMarkers,
    showCityRoute,
    visibleRoutes,
  } = params;

  const markers: MapMarkerEntity[] = [];
  const hasPreview = isRouteFormOpen && !!routePreview;

  if (showPlanMarkers && !focusedRouteKey && !hasPreview) {
    for (const p of allPlanPlaces) {
      if (!dateInFilterRange(p.activityDate, filterDateFrom, filterDateTo)) continue;
      const k = normalizePlaceKind(p.kind) || "visit";
      if (planKindFilter.size && !planKindFilter.has(k)) continue;
      const appearance = markerAppearance(k, customByKey);
      markers.push({
        key: `plan:${p.id}`,
        lat: p.latitude,
        lng: p.longitude,
        title: p.title,
        subtitle: p.address,
        icon: emojiIcon(appearance.emoji, appearance.color),
      });
    }
  }

  const lines: MapLineEntity[] = [];

  if (showCityRoute && !filterDateFrom && !filterDateTo && !hasPreview && !focusedRouteKey) {
    const byDate = new Map<string, { lats: number[]; lngs: number[] }>();
    for (const p of allPlanPlaces) {
      const d = p.activityDate || "";
      if (!d) continue;
      const entry = byDate.get(d) ?? { lats: [], lngs: [] };
      entry.lats.push(p.latitude);
      entry.lngs.push(p.longitude);
      byDate.set(d, entry);
    }
    const centroids: RoutePoint[] = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        lat: v.lats.reduce((a, b) => a + b, 0) / v.lats.length,
        lng: v.lngs.reduce((a, b) => a + b, 0) / v.lngs.length,
      }));

    if (centroids.length >= 2) {
      lines.push({
        key: "city-overview-route",
        points: centroids,
        color: "#7c3aed",
        label: "Ruta del viaje",
      });
    }
  }

  if (hasPreview && routePreview) {
    lines.push({
      key: "route-preview",
      points: routePreview.points,
      color: routePreview.color,
      label: routePreview.label,
    });
  } else {
    let routeIdx = 0;
    for (const r of visibleRoutes) {
      const key = `${r.source || "trip_routes"}:${r.id}`;
      const pts = (Array.isArray(r.path_points) && r.path_points.length ? r.path_points : r.route_points) || [];
      const normalized = Array.isArray(pts)
        ? pts.filter(
            (x) =>
              x &&
              typeof x.lat === "number" &&
              typeof x.lng === "number" &&
              Number.isFinite(x.lat) &&
              Number.isFinite(x.lng)
          )
        : [];
      const color = (r.color && String(r.color).trim()) || "#6366f1";

      if (normalized.length >= 2) {
        lines.push({ key, points: normalized, color, label: String(r.title || r.route_name || "Ruta") });
        const start = normalized[0]!;
        const end = normalized[normalized.length - 1]!;
        const n1 = routeIdx * 2 + 1;
        const n2 = routeIdx * 2 + 2;
        markers.push({
          key: `${key}:start`,
          lat: start.lat,
          lng: start.lng,
          title: `${n1}. Origen`,
          subtitle: String(r.origin_name || "Origen"),
          icon: numberIcon(n1, color),
        });
        markers.push({
          key: `${key}:end`,
          lat: end.lat,
          lng: end.lng,
          title: `${n2}. Destino`,
          subtitle: String(r.destination_name || "Destino"),
          icon: numberIcon(n2, color),
        });
        routeIdx += 1;
        continue;
      }
      if (
        typeof r.origin_latitude === "number" &&
        typeof r.origin_longitude === "number" &&
        typeof r.destination_latitude === "number" &&
        typeof r.destination_longitude === "number"
      ) {
        lines.push({
          key,
          points: [
            { lat: r.origin_latitude, lng: r.origin_longitude },
            { lat: r.destination_latitude, lng: r.destination_longitude },
          ],
          color,
          label: String(r.title || r.route_name || "Ruta"),
        });
        const n1 = routeIdx * 2 + 1;
        const n2 = routeIdx * 2 + 2;
        markers.push({
          key: `${key}:start`,
          lat: r.origin_latitude,
          lng: r.origin_longitude,
          title: `${n1}. Origen`,
          subtitle: String(r.origin_name || "Origen"),
          icon: numberIcon(n1, color),
        });
        markers.push({
          key: `${key}:end`,
          lat: r.destination_latitude,
          lng: r.destination_longitude,
          title: `${n2}. Destino`,
          subtitle: String(r.destination_name || "Destino"),
          icon: numberIcon(n2, color),
        });
        routeIdx += 1;
      }
    }
  }

  return { markers, lines };
}

export function useTripMapEntities({
  allPlanPlaces,
  customByKey,
  focusedRouteKey,
  isRouteFormOpen,
  planKindFilter,
  routePreview,
  filterDateFrom,
  filterDateTo,
  showPlanMarkers,
  showCityRoute,
  visibleRoutes,
}: {
  allPlanPlaces: PlanPlace[];
  customByKey?: Map<string, CustomKindMeta>;
  focusedRouteKey: string | null;
  isRouteFormOpen: boolean;
  planKindFilter: Set<string>;
  routePreview: RoutePreviewSlice;
  filterDateFrom: string;
  filterDateTo: string;
  showPlanMarkers: boolean;
  showCityRoute: boolean;
  visibleRoutes: TripMapRoute[];
}) {
  return useMemo(
    () =>
      buildTripMapEntities({
        allPlanPlaces,
        customByKey,
        focusedRouteKey,
        isRouteFormOpen,
        planKindFilter,
        routePreview,
        filterDateFrom,
        filterDateTo,
        showPlanMarkers,
        showCityRoute,
        visibleRoutes,
      }),
    [
      allPlanPlaces,
      customByKey,
      focusedRouteKey,
      isRouteFormOpen,
      planKindFilter,
      routePreview,
      filterDateFrom,
      filterDateTo,
      showPlanMarkers,
      showCityRoute,
      visibleRoutes,
    ]
  );
}

export function useTripMapBounds(
  mapEntities: { markers: MapMarkerEntity[]; lines: MapLineEntity[] },
  opts: {
    filterDateFrom: string;
    filterDateTo: string;
    showPlanMarkers: boolean;
    visibleRoutes: TripMapRoute[];
    routePreviewKey: string;
  }
) {
  const bounds = useMemo(() => {
    const latlngs: Array<[number, number]> = [];
    if (mapEntities.lines.length) {
      for (const l of mapEntities.lines) for (const p of l.points) latlngs.push([p.lat, p.lng]);
    } else {
      for (const m of mapEntities.markers) latlngs.push([m.lat, m.lng]);
    }
    if (!latlngs.length) return null;
    const b = L.latLngBounds(latlngs);
    return b.isValid() ? b : null;
  }, [mapEntities.lines, mapEntities.markers]);

  const boundsKey = useMemo(() => {
    return [
      `d:${opts.filterDateFrom}|${opts.filterDateTo}`,
      `m:${opts.showPlanMarkers ? 1 : 0}`,
      `r:${opts.visibleRoutes.map((r) => `${r.source || "trip_routes"}:${r.id}`).join(",")}`,
      `p:${opts.routePreviewKey || ""}`,
    ].join("|");
  }, [
    opts.filterDateFrom,
    opts.filterDateTo,
    opts.showPlanMarkers,
    opts.visibleRoutes,
    opts.routePreviewKey,
  ]);

  return { bounds, boundsKey };
}
