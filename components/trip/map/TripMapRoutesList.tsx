"use client";

import type { KeyboardEvent } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import { DndContext, closestCenter, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  normalizeTripRouteTravelMode,
  travelModeLabel,
} from "@/lib/route-travel-mode";
import type { TripMapRoute } from "@/components/trip/map/trip-map-types";
import { tripMapRouteKey } from "@/components/trip/map/tripMapNormalize";
import TripMapSortableRouteRow from "@/components/trip/map/TripMapSortableRouteRow";

export type TripMapRoutesListProps = {
  routesForList: TripMapRoute[];
  filteredRouteKeys: string[];
  reorderDay: string | null;
  routesBulkMode: boolean;
  focusedRouteKey: string | null;
  selectedRouteKeys: Set<string>;
  canManageMap: boolean;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void | Promise<void>;
  onFocusRoute: (key: string) => void;
  onToggleRouteSelection: (key: string) => void;
  onEditRoute: (route: TripMapRoute) => void;
  onDuplicateRoute: (route: TripMapRoute) => void;
  onRemoveRoute: (route: TripMapRoute) => void;
};

function routeSubtitle(route: TripMapRoute) {
  return [
    route.travel_mode ? travelModeLabel(normalizeTripRouteTravelMode(route.travel_mode)) : "",
    route.departure_time ? `Salida ${route.departure_time}` : "",
    route.distance_text || "",
    route.duration_text || "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function TripMapRoutesList({
  routesForList,
  filteredRouteKeys,
  reorderDay,
  routesBulkMode,
  focusedRouteKey,
  selectedRouteKeys,
  canManageMap,
  sensors,
  onDragEnd,
  onFocusRoute,
  onToggleRouteSelection,
  onEditRoute,
  onDuplicateRoute,
  onRemoveRoute,
}: TripMapRoutesListProps) {
  if (reorderDay && !routesBulkMode) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={filteredRouteKeys} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {routesForList.map((r) => (
              <TripMapSortableRouteRow
                key={tripMapRouteKey(r)}
                route={r}
                focusedRouteKey={focusedRouteKey}
                canManageMap={canManageMap}
                onFocusRoute={(key) => onFocusRoute(key)}
                onEditRoute={onEditRoute}
                onDuplicateRoute={onDuplicateRoute}
                onRemoveRoute={onRemoveRoute}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  return (
    <div className="space-y-2">
      {routesForList.map((r) => {
        const key = tripMapRouteKey(r);
        const active = focusedRouteKey === key;
        const bulkSelected = selectedRouteKeys.has(key);
        const title = String(r.title || r.route_name || "Ruta");
        const subtitle = routeSubtitle(r);

        const handleBulkKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleRouteSelection(key);
          }
        };

        return (
          <div
            key={key}
            role={routesBulkMode ? "button" : undefined}
            tabIndex={routesBulkMode ? 0 : undefined}
            onClick={routesBulkMode ? () => onToggleRouteSelection(key) : undefined}
            onKeyDown={routesBulkMode ? handleBulkKeyDown : undefined}
            className={`rounded-2xl border p-3 transition ${
              routesBulkMode
                ? bulkSelected
                  ? "border-violet-500 bg-violet-50 ring-2 ring-violet-400/60"
                  : "cursor-pointer border-slate-200 bg-white hover:border-violet-200"
                : active
                  ? "border-violet-300 bg-violet-50"
                  : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                {routesBulkMode ? (
                  <button
                    type="button"
                    aria-label={bulkSelected ? "Quitar selección" : "Seleccionar"}
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 shadow-sm ${
                      bulkSelected
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : "border-slate-300 bg-white text-transparent dark:border-[#334155] dark:bg-[#0F1623]"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleRouteSelection(key);
                    }}
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocusRoute(key);
                  }}
                  className="min-w-0 flex-1 text-left"
                  title="Enfocar/mostrar en el mapa"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: r.color || "#6366f1" }}
                    />
                    <div className="text-sm font-semibold text-slate-950 line-clamp-1">{title}</div>
                    {r.source === "legacy_routes" ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-amber-800">
                        Legacy
                      </span>
                    ) : null}
                  </div>
                  {subtitle ? <div className="mt-1 text-xs text-slate-600 line-clamp-2">{subtitle}</div> : null}
                </button>
              </div>
              {!routesBulkMode && canManageMap ? (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {r.source === "trip_routes" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditRoute(r)}
                        className="inline-flex min-h-[34px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateRoute(r)}
                        className="inline-flex min-h-[34px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        title="Duplicar ruta"
                      >
                        <Copy className="h-4 w-4" aria-hidden />
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void onRemoveRoute(r)}
                    className="inline-flex min-h-[34px] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                    title={r.source === "legacy_routes" ? "Eliminar ruta legacy" : "Eliminar ruta"}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
