"use client";

import type { CSSProperties } from "react";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { iconSlotFill40 } from "@/components/ui/iconTokens";
import {
  normalizeTripRouteTravelMode,
  travelModeLabel,
} from "@/lib/route-travel-mode";
import type { TripMapRoute } from "@/components/trip/map/trip-map-types";
import { tripMapRouteKey } from "@/components/trip/map/tripMapNormalize";

function SortHandle() {
  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 ${iconSlotFill40}`}
    >
      <GripVertical aria-hidden />
    </span>
  );
}

export type TripMapSortableRouteRowProps = {
  route: TripMapRoute;
  focusedRouteKey: string | null;
  canManageMap: boolean;
  onFocusRoute: (key: string) => void;
  onEditRoute: (route: TripMapRoute) => void;
  onDuplicateRoute: (route: TripMapRoute) => void;
  onRemoveRoute: (route: TripMapRoute) => void;
};

export default function TripMapSortableRouteRow({
  route,
  focusedRouteKey,
  canManageMap,
  onFocusRoute,
  onEditRoute,
  onDuplicateRoute,
  onRemoveRoute,
}: TripMapSortableRouteRowProps) {
  const key = tripMapRouteKey(route);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: key });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  const active = focusedRouteKey === key;
  const title = String(route.title || route.route_name || "Ruta");
  const subtitle = [
    route.travel_mode ? travelModeLabel(normalizeTripRouteTravelMode(route.travel_mode)) : "",
    route.departure_time ? `Salida ${route.departure_time}` : "",
    route.distance_text || "",
    route.duration_text || "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-3xl border p-3 transition ${active ? "border-violet-300 bg-violet-50/80 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0" {...attributes} {...listeners} title="Arrastrar para reordenar">
          <SortHandle />
        </div>
        <button
          type="button"
          onClick={() => onFocusRoute(key)}
          className="min-w-0 flex-1 text-left"
          title="Enfocar/mostrar en el mapa"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: route.color || "#6366f1" }}
            />
            <div className="text-sm font-semibold text-slate-950 line-clamp-1">{title}</div>
          </div>
          {subtitle ? <div className="mt-1 text-xs text-slate-600 line-clamp-2">{subtitle}</div> : null}
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {canManageMap && route.source === "trip_routes" ? (
            <>
              <button
                type="button"
                onClick={() => onEditRoute(route)}
                className="inline-flex min-h-[34px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                title="Editar ruta"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => onDuplicateRoute(route)}
                className="inline-flex min-h-[34px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                title="Duplicar ruta"
              >
                <Copy className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => void onRemoveRoute(route)}
                className="inline-flex min-h-[34px] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                title="Eliminar ruta"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
