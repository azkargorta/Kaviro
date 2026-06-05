"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { CalendarDays, ChevronDown, Clock, MapPin, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import PlaceAutocompleteInput from "@/components/PlaceAutocompleteInput";
import { btnPrimary } from "@/components/ui/brandStyles";
import PremiumUpsell from "@/components/premium/PremiumUpsell";
import TripReadOnlyBanner from "@/components/trip/common/TripReadOnlyBanner";
import { useTripRoutes, type RoutePoint, type SaveRouteInput } from "@/hooks/useTripRoutes";
import { useTripActivityKinds } from "@/hooks/useTripActivityKinds";
import DuplicateRouteDialog from "@/components/trip/map/DuplicateRouteDialog";
import RouteTravelModePicker from "@/components/trip/map/RouteTravelModePicker";
import RouteEditorPanel from "@/components/trip/map/RouteEditorPanel";
import {
  applyTravelModeToOsrmMetrics,
  normalizeTripRouteTravelMode,
  osrmProfileForTravelMode,
  travelModeDurationHint,
  travelModeLabel,
  type TripRouteTravelMode,
} from "@/lib/route-travel-mode";
import { PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import TripMapRoutesList from "@/components/trip/map/TripMapRoutesList";
import { useTripMapBounds, useTripMapEntities } from "@/components/trip/map/useTripMapEntities";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTE_COLOR_PALETTE, pickNextRouteColor, pickRouteColorByIndex } from "@/lib/route-colors";
import {
  KAVIRO_TRIP_PLAN_REFRESH_EVENT,
  type TripPlanRefreshDetail,
} from "@/lib/trip-plan-events";
import type { RoutesDraftPayload } from "@/lib/trip-ai/routesDraftTypes";
import type { TripMapRoute } from "@/components/trip/map/trip-map-types";
export type { TripMapRoute } from "@/components/trip/map/trip-map-types";
import {
  addDurationToTime,
  buildRouteNotes,
  defaultNewRouteDate,
  defaultRouteForm,
  describeDateFilter,
  filterRoutesByDateRange,
  formatDuration,
  formatKm,
  isSingleDayFilter,
  normalizeFilterDate,
  normalizeIsoDate,
  normalizePlanPlaces,
  normalizePlanSelectOptions,
  normalizeRoutes,
  parseRouteChecklist,
  parseRouteNotes,
  pathLengthMeters,
  randomId,
  todayISO,
  tripMapRouteKey,
  type ChecklistItem,
  type PlanPlace,
  type PlanSelectOption,
  type RouteFormState,
} from "@/components/trip/map/tripMapNormalize";

type UnknownRow = Record<string, unknown>;
type AutocompletePayload = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};

type RoutePreview = {
  key: string;
  /** Modo con el que se calculó distancia/tiempo (debe coincidir con el selector actual). */
  calculatedTravelMode: TripRouteTravelMode;
  points: RoutePoint[];
  distanceText: string | null;
  durationText: string | null;
  durationSeconds: number | null;
  arrivalTime: string | null;
  color: string;
  label: string;
  durationAdjusted?: boolean;
};

type RouteSources = {
  tripRoutes?: unknown[];
  legacyRoutes?: unknown[];
};

type PlanSources = {
  tripActivities?: unknown[];
  legacyActivities?: unknown[];
};

type Props = {
  tripId: string;
  isPremium?: boolean;
  canManageMap?: boolean;
  trip?: { id: string; name: string; destination?: string | null; start_date?: string | null; end_date?: string | null };
  tripDates?: string[];
  planSources?: PlanSources;
  routeSources?: RouteSources;
  // compat vieja (hay una ruta legacy que lo llama así)
  points?: unknown[];
  routes?: unknown[];
  selectedDate?: string;
  availableDates?: string[];
};

const DEFAULT_CENTER: [number, number] = [40.4168, -3.7038];

function FitToBounds({ bounds, boundsKey }: { bounds: L.LatLngBounds | null; boundsKey: string }) {
  const map = useMap();
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    if (!bounds) return;
    if (boundsKey && boundsKey === lastKeyRef.current) return;
    lastKeyRef.current = boundsKey;
    try {
      map.fitBounds(bounds, { padding: [44, 44] });
    } catch {
      // noop
    }
  }, [bounds, boundsKey, map]);

  return null;
}

function MapReporter({ onMap }: { onMap?: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onMap?.(map);
  }, [map, onMap]);
  return null;
}

async function fetchOsrmRoute(params: {
  origin: RoutePoint;
  destination: RoutePoint;
  stop?: RoutePoint | null;
  profile?: "driving" | "walking" | "cycling";
}) {
  const resp = await fetch("/api/osrm/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin: params.origin,
      destination: params.destination,
      stop: params.stop ?? null,
      profile: params.profile ?? "driving",
    }),
  });
  const payload = await resp.json().catch(() => null);
  if (!resp.ok) throw new Error(payload?.error || `Error ${resp.status}`);
  return payload as {
    points: RoutePoint[];
    distanceMeters: number | null;
    durationSeconds: number | null;
  };
}

function normalizeKind(kind: unknown) {
  return typeof kind === "string" ? kind.trim().toLowerCase() : "";
}

function kindLabel(kindRaw: string) {
  const k = normalizeKind(kindRaw);
  if (k === "visit") return "Visita";
  if (k === "museum") return "Museo";
  if (k === "restaurant") return "Restaurante";
  if (k === "transport") return "Transporte";
  if (k === "activity") return "Actividad";
  if (k === "lodging") return "Alojamiento";
  return kindRaw.trim().slice(0, 1).toUpperCase() + kindRaw.trim().slice(1);
}

function StatusChip({
  active = false,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex min-h-[30px] items-center rounded-full border px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] ${
        active ? "border-violet-300 bg-violet-50 text-violet-900" : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      {children}
    </span>
  );
}

function MapSurface({
  visible,
  bounds,
  boundsKey,
  lines,
  markers,
  onMapCreated,
  isDarkMap = false,
  compact = false,
}: {
  visible: boolean;
  bounds: L.LatLngBounds | null;
  boundsKey: string;
  lines: Array<{ key: string; points: RoutePoint[]; color: string; label: string }>;
  markers: Array<{ key: string; lat: number; lng: number; title: string; icon: L.Icon | L.DivIcon; subtitle?: string }>;
  onMapCreated?: (map: L.Map) => void;
  isDarkMap?: boolean;
  /** Mapa más bajo cuando el editor de ruta está abierto (caber formulario sin scroll). */
  compact?: boolean;
}) {
  if (!visible) return null;

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm lg:sticky lg:top-4 lg:self-start">
      <div className="flex min-w-0 flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-slate-950">Vista del mapa</div>
          <div className="mt-1 text-xs text-slate-600">Recorridos, focos y lugares del plan en tiempo real.</div>
        </div>
        <div className="shrink-0">
          <StatusChip active>{lines.length ? `${lines.length} ruta${lines.length === 1 ? "" : "s"}` : "Sin rutas visibles"}</StatusChip>
        </div>
      </div>
      <div
        data-tour="map-container"
        className={`h-[min(420px,55vh)] w-full bg-slate-100 sm:h-[min(480px,50vh)] ${
          compact ? "lg:h-[min(340px,38vh)]" : "lg:h-[calc(100vh-7.5rem)]"
        }`}
      >
        <MapContainer center={DEFAULT_CENTER} zoom={4} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer
            attribution={isDarkMap
              ? '&copy; <a href="https://carto.com">CARTO</a>'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
            url={isDarkMap
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
          />
          <MapReporter onMap={onMapCreated} />
          <FitToBounds bounds={bounds} boundsKey={boundsKey} />

          {lines.map((l) => (
            <Polyline
              key={l.key}
              positions={l.points.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={
                l.key === "city-overview-route"
                  ? { color: l.color, weight: 3, opacity: 0.6, dashArray: "8 6" }
                  : { color: l.color, weight: 5, opacity: 0.85 }
              }
            >
              <Popup>{l.label}</Popup>
            </Polyline>
          ))}

          {markers.map((m) => (
            <Marker key={m.key} position={[m.lat, m.lng]} icon={m.icon}>
              <Popup>
                <div className="text-sm font-semibold text-slate-900">{m.title}</div>
                {m.subtitle ? <div className="mt-1 text-xs text-slate-600">{m.subtitle}</div> : null}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}

export default function TripMapView({
  tripId,
  trip,
  tripDates = [],
  planSources,
  routeSources,
  points,
  routes,
  isPremium = false,
  canManageMap = true,
}: Props) {
  const tripStartDate = useMemo(
    () => normalizeIsoDate(trip?.start_date) ?? normalizeIsoDate(tripDates[0]) ?? null,
    [trip?.start_date, tripDates]
  );
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const [liveTripActivities, setLiveTripActivities] = useState<unknown[]>(
    () => planSources?.tripActivities ?? []
  );

  const reloadPlanActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/trip-activities?tripId=${encodeURIComponent(tripId)}`, {
        cache: "no-store",
        credentials: "include",
      });
      const payload = await res.json().catch(() => null);
      if (res.ok && Array.isArray(payload?.activities)) {
        setLiveTripActivities(payload.activities);
      }
    } catch {
      // noop
    }
  }, [tripId]);

  useEffect(() => {
    void reloadPlanActivities();
  }, [reloadPlanActivities]);

  useEffect(() => {
    function onPlanRefresh(event: Event) {
      const detail = (event as CustomEvent<TripPlanRefreshDetail>).detail;
      if (!detail?.tripId || detail.tripId !== tripId) return;
      void reloadPlanActivities();
    }
    window.addEventListener(KAVIRO_TRIP_PLAN_REFRESH_EVENT, onPlanRefresh);
    return () => window.removeEventListener(KAVIRO_TRIP_PLAN_REFRESH_EVENT, onPlanRefresh);
  }, [tripId, reloadPlanActivities]);

  const allPlanPlaces = useMemo(() => {
    const legacy = planSources?.legacyActivities ?? [];
    const fromSources =
      liveTripActivities.length || legacy.length
        ? [...normalizePlanPlaces(liveTripActivities, "trip"), ...normalizePlanPlaces(legacy, "legacy")]
        : normalizePlanPlaces(points, "legacy-page");
    const byId = new Map<string, PlanPlace>();
    for (const p of fromSources) byId.set(p.id, p);
    return Array.from(byId.values());
  }, [liveTripActivities, planSources?.legacyActivities, points]);

  const allRoutes = useMemo(() => {
    const fromSources =
      routeSources && (routeSources.tripRoutes || routeSources.legacyRoutes)
        ? [
            ...normalizeRoutes(routeSources.tripRoutes, "trip_routes"),
          ]
        : normalizeRoutes(routes, "trip_routes");

    const byKey = new Map<string, TripMapRoute>();
    for (const r of fromSources) byKey.set(`${r.source || "trip_routes"}:${r.id}`, r);
    return Array.from(byKey.values());
  }, [routeSources, routes]);

  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [focusedRouteKey, setFocusedRouteKey] = useState<string | null>(null);
  const [showPlanMarkers, setShowPlanMarkers] = useState(true);
  const [showCityRoute, setShowCityRoute] = useState(true);
  const [planKindFilter, setPlanKindFilter] = useState<Set<string>>(new Set());
  const { kinds: customKinds, warning: customKindsWarning } = useTripActivityKinds(tripId);

  const [routesState, setRoutesState] = useState<TripMapRoute[]>(allRoutes);
  const [routeQuery, setRouteQuery] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateRoute, setDuplicateRoute] = useState<TripMapRoute | null>(null);
  const [isRouteFormOpen, setIsRouteFormOpen] = useState(false);
  const [routePreview, setRoutePreview] = useState<RoutePreview | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const routeFormPanelRef = useRef<HTMLElement | null>(null);
  const [autoRoutesOpen, setAutoRoutesOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showRoutesList, setShowRoutesList] = useState(false);
  const [routesBulkMode, setRoutesBulkMode] = useState(false);
  const [selectedRouteKeys, setSelectedRouteKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isRouteFormOpen) return;
    const id = window.setTimeout(() => {
      const el = routeFormPanelRef.current;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }, 180);
    return () => window.clearTimeout(id);
  }, [isRouteFormOpen]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Formulario crear/editar ruta
  const [form, setForm] = useState<RouteFormState>(() =>
    defaultRouteForm(defaultNewRouteDate({ tripStart: trip?.start_date ?? null, tripDates }))
  );
  const [travelMode, setTravelMode] = useState<TripRouteTravelMode>("DRIVING");
  const [routesAutoTravelMode, setRoutesAutoTravelMode] = useState<TripRouteTravelMode>("DRIVING");

  const [origin, setOrigin] = useState<{ address: string; latitude: number | null; longitude: number | null }>({
    address: "",
    latitude: null,
    longitude: null,
  });
  const [stop, setStop] = useState<{ address: string; latitude: number | null; longitude: number | null }>({
    address: "",
    latitude: null,
    longitude: null,
  });
  const [destination, setDestination] = useState<{ address: string; latitude: number | null; longitude: number | null }>({
    address: "",
    latitude: null,
    longitude: null,
  });

  const [originPlanId, setOriginPlanId] = useState("");
  const [stopPlanId, setStopPlanId] = useState("");
  const [destinationPlanId, setDestinationPlanId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [routesDraft, setRoutesDraft] = useState<RoutesDraftPayload | null>(null);
  const [routesDraftIndex, setRoutesDraftIndex] = useState(0);
  const draftReviewActiveRef = useRef(false);
  const [addingAllRoutes, setAddingAllRoutes] = useState(false);

  const [routesAutoNotes, setRoutesAutoNotes] = useState("");
  const [routesAutoQuestion, setRoutesAutoQuestion] = useState<string | null>(null);
  const [routesAutoFollowUp, setRoutesAutoFollowUp] = useState("");
  const [routesAutoLoading, setRoutesAutoLoading] = useState(false);
  const [routesAutoError, setRoutesAutoError] = useState<string | null>(null);

  useEffect(() => {
    const want = searchParams?.get("draftRoutes") === "1";
    if (!want) return;
    try {
      const key = `tripboard_routes_draft:${tripId}`;
      const raw = window.sessionStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.routes)) return;
      setRoutesDraft(parsed as RoutesDraftPayload);
      setRoutesDraftIndex(0);
      setShowRoutesList(true);
      setInfo("Borrador del asistente cargado. Revisa y guarda; al guardar pasaremos a la siguiente.");
      requestAnimationFrame(() => {
        loadDraftRoute(0, parsed as RoutesDraftPayload);
      });
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function generateRoutesDraft() {
    setRoutesAutoError(null);
    setRoutesAutoQuestion(null);
    setInfo(null);
    setError(null);

    const singleDay = isSingleDayFilter(filterDateFrom, filterDateTo);
    const date = singleDay;
    const dates = Array.isArray(tripDates) ? tripDates.filter((d) => typeof d === "string" && d) : [];
    const startDate = !date && filterDateFrom ? filterDateFrom : !date && dates.length ? dates[0] : null;
    const endDate = !date && filterDateTo ? filterDateTo : !date && dates.length ? dates[dates.length - 1] : null;

    if (!date && !filterDateFrom && !filterDateTo && (!startDate || !endDate)) {
      setRoutesAutoError("No encuentro el calendario del viaje. Indica un rango de fechas o define fechas del viaje.");
      return;
    }

    setRoutesAutoLoading(true);
    try {
      const resp = await fetch("/api/trip-ai/generate-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          date,
          startDate,
          endDate,
          transportNotes: routesAutoNotes,
          followUp: routesAutoFollowUp,
          travelMode: routesAutoTravelMode,
        }),
      });
      const payload = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(payload?.error || `Error ${resp.status}`);

      if (payload?.status === "needs_clarification") {
        setRoutesAutoQuestion(typeof payload?.question === "string" ? payload.question : "Necesito un poco más de información.");
        return;
      }
      if (payload?.status !== "ok" || !payload?.routesDraft) {
        throw new Error(payload?.error || "Respuesta inesperada al generar rutas.");
      }

      const draft = payload.routesDraft as RoutesDraftPayload;
      setRoutesDraft(draft);
      setRoutesDraftIndex(0);
      setShowRoutesList(true);
      if (date) {
        setFilterDateFrom(date);
        setFilterDateTo(date);
      } else if (filterDateFrom || filterDateTo) {
        /* mantiene el rango activo */
      }
      try {
        const key = `tripboard_routes_draft:${tripId}`;
        window.sessionStorage.setItem(key, JSON.stringify(draft));
      } catch {
        // ignore
      }
      router.push(`/trip/${encodeURIComponent(tripId)}/map?draftRoutes=1`);
    } catch (e) {
      setRoutesAutoError(e instanceof Error ? e.message : "No se pudieron generar las rutas.");
    } finally {
      setRoutesAutoLoading(false);
    }
  }

  const routeCalcKey = useMemo(() => {
    return JSON.stringify({
      name: form.routeName.trim() || "Ruta",
      date: form.routeDate,
      departureTime: form.departureTime,
      color: form.color,
      autoColor: form.autoColor,
      stopEnabled: form.stopEnabled,
      origin: [origin.address, origin.latitude, origin.longitude],
      stop: form.stopEnabled ? [stop.address, stop.latitude, stop.longitude] : null,
      destination: [destination.address, destination.latitude, destination.longitude],
      travelMode,
    });
  }, [
    destination.address,
    destination.latitude,
    destination.longitude,
    form.autoColor,
    form.color,
    form.departureTime,
    form.routeDate,
    form.routeName,
    form.stopEnabled,
    origin.address,
    origin.latitude,
    origin.longitude,
    stop.address,
    stop.latitude,
    stop.longitude,
    travelMode,
  ]);

  const effectiveRouteColor = useMemo(() => {
    if (!form.autoColor) return form.color || ROUTE_COLOR_PALETTE[0];
    const used = new Set(
      routesState
        .filter((r) => r.source === "trip_routes" && r.id !== form.editingRouteId)
        .map((r) => String(r.color || "").trim().toLowerCase())
        .filter(Boolean)
    );
    return pickNextRouteColor(used, routesState.length);
  }, [form.autoColor, form.color, form.editingRouteId, routesState]);

  const reloadRoutes = useCallback(async () => {
    try {
      const resp = await fetch(`/api/trip-routes?tripId=${encodeURIComponent(tripId)}`, { cache: "no-store" });
      const payload = await resp.json().catch(() => null);
      if (resp.ok && Array.isArray(payload?.routes)) {
        const nextTripRoutes = normalizeRoutes(payload.routes, "trip_routes");
        setRoutesState(nextTripRoutes);
      }
    } catch {
      // noop
    }
  }, [tripId]);

  const { saveRoute, deleteRoute, savingRoute, routeError } = useTripRoutes(tripId, reloadRoutes);

  useEffect(() => {
    if (routeError) setError(routeError);
  }, [routeError]);

  const allPlanSelectOptions = useMemo(() => {
    const legacy = planSources?.legacyActivities ?? [];
    const list = [
      ...normalizePlanSelectOptions(liveTripActivities, "trip"),
      ...normalizePlanSelectOptions(legacy, "legacy"),
    ];
    list.sort(
      (a, b) =>
        (a.activityDate || "").localeCompare(b.activityDate || "") || a.title.localeCompare(b.title)
    );
    return list;
  }, [liveTripActivities, planSources?.legacyActivities]);

  const routeDayForPlans = normalizeIsoDate(form.routeDate);

  /** Si hay día en el formulario de ruta, solo planes de esa fecha. */
  const planSelectOptions = useMemo(() => {
    if (!routeDayForPlans) return allPlanSelectOptions;
    return allPlanSelectOptions.filter((p) => p.activityDate === routeDayForPlans);
  }, [allPlanSelectOptions, routeDayForPlans]);

  const availablePlanKinds = useMemo(() => {
    const s = new Set<string>();
    for (const p of allPlanPlaces) {
      const k = normalizeKind(p.kind) || "visit";
      s.add(k);
    }
    for (const k of customKinds || []) {
      const kk = normalizeKind(k.kind_key);
      if (kk) s.add(kk);
    }
    return Array.from(s.values()).sort((a, b) => a.localeCompare(b));
  }, [allPlanPlaces, customKinds]);

  const customByKey = useMemo(() => {
    const map = new Map<string, { label: string; emoji?: string | null; color?: string | null }>();
    for (const k of customKinds || []) {
      const kk = normalizeKind(k.kind_key);
      if (!kk) continue;
      map.set(kk, { label: k.label, emoji: k.emoji ?? null, color: k.color ?? null });
    }
    return map;
  }, [customKinds]);

  const findPlanOption = useCallback(
    (planId: string) => allPlanSelectOptions.find((p) => p.id === planId) || null,
    [allPlanSelectOptions]
  );

  useEffect(() => {
    const validIds = new Set(planSelectOptions.map((p) => p.id));
    if (originPlanId && !validIds.has(originPlanId)) setOriginPlanId("");
    if (stopPlanId && !validIds.has(stopPlanId)) setStopPlanId("");
    if (destinationPlanId && !validIds.has(destinationPlanId)) setDestinationPlanId("");
  }, [planSelectOptions, originPlanId, stopPlanId, destinationPlanId]);

  const resolvePlanCoords = useCallback(
    async (opt: PlanSelectOption): Promise<{ address: string; latitude: number; longitude: number } | null> => {
      const address = (opt.address || opt.title).trim();
      if (opt.hasCoords && opt.latitude != null && opt.longitude != null) {
        return { address: address || opt.title, latitude: opt.latitude, longitude: opt.longitude };
      }
      if (!address) return null;

      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tripId, address }),
      });
      const data = await res.json().catch(() => null);
      const lat = typeof data?.latitude === "number" ? data.latitude : null;
      const lng = typeof data?.longitude === "number" ? data.longitude : null;
      if (!res.ok || lat == null || lng == null) return null;

      const formatted =
        typeof data?.formattedAddress === "string" && data.formattedAddress.trim()
          ? data.formattedAddress.trim()
          : address;

      if (opt.id.startsWith("trip:")) {
        await fetch(`/api/trip-activities/${encodeURIComponent(opt.activityId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            address: formatted,
          }),
        }).catch(() => null);
        void reloadPlanActivities();
      }

      return { address: formatted, latitude: lat, longitude: lng };
    },
    [tripId, reloadPlanActivities]
  );

  useEffect(() => {
    if (!isRouteFormOpen) return;
    void reloadPlanActivities();
  }, [isRouteFormOpen, reloadPlanActivities]);

  useEffect(() => {
    if (!originPlanId) return;
    const p = findPlanOption(originPlanId);
    if (!p) return;
    let cancelled = false;
    void resolvePlanCoords(p).then((coords) => {
      if (cancelled || !coords) return;
      setOrigin(coords);
    });
    return () => {
      cancelled = true;
    };
  }, [findPlanOption, originPlanId, resolvePlanCoords]);

  useEffect(() => {
    if (!stopPlanId) return;
    const p = findPlanOption(stopPlanId);
    if (!p) return;
    let cancelled = false;
    void resolvePlanCoords(p).then((coords) => {
      if (cancelled || !coords) return;
      setStop(coords);
    });
    return () => {
      cancelled = true;
    };
  }, [findPlanOption, stopPlanId, resolvePlanCoords]);

  useEffect(() => {
    if (!destinationPlanId) return;
    const p = findPlanOption(destinationPlanId);
    if (!p) return;
    let cancelled = false;
    void resolvePlanCoords(p).then((coords) => {
      if (cancelled || !coords) return;
      setDestination(coords);
    });
    return () => {
      cancelled = true;
    };
  }, [destinationPlanId, findPlanOption, resolvePlanCoords]);

  useEffect(() => {
    setRoutesState(allRoutes);
  }, [allRoutes]);

  useEffect(() => {
    setRoutePreview((prev) => (prev?.key === routeCalcKey ? prev : null));
  }, [routeCalcKey]);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      if (!historyOpen) return;
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const resp = await fetch(
          `/api/trip-audit?tripId=${encodeURIComponent(tripId)}&entityType=route&limit=40`,
          { cache: "no-store" }
        );
        const payload = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(payload?.error || "No se pudo cargar el historial.");
        if (!cancelled) setHistory(Array.isArray(payload?.logs) ? payload.logs : []);
      } catch (e) {
        if (!cancelled) setHistoryError(e instanceof Error ? e.message : "No se pudo cargar el historial.");
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }
    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [historyOpen, tripId]);

  const dateFilteredRoutes = useMemo(
    () => filterRoutesByDateRange(routesState, filterDateFrom, filterDateTo),
    [routesState, filterDateFrom, filterDateTo]
  );

  const visibleRoutes = useMemo(() => {
    const q = routeQuery.trim().toLowerCase();
    const base = q
      ? dateFilteredRoutes.filter((r) => String(r.title || r.route_name || "").toLowerCase().includes(q))
      : dateFilteredRoutes;
    if (!focusedRouteKey) return base;
    return base.filter((r) => `${r.source || "trip_routes"}:${r.id}` === focusedRouteKey);
  }, [focusedRouteKey, routeQuery, dateFilteredRoutes]);

  const reorderDay = isSingleDayFilter(filterDateFrom, filterDateTo);

  const mapEntities = useTripMapEntities({
    allPlanPlaces,
    customByKey,
    focusedRouteKey,
    isRouteFormOpen,
    planKindFilter,
    routePreview:
      isRouteFormOpen && routePreview
        ? {
            key: routePreview.key,
            points: routePreview.points,
            color: routePreview.color,
            label: routePreview.label,
          }
        : null,
    filterDateFrom,
    filterDateTo,
    showPlanMarkers,
    showCityRoute,
    visibleRoutes,
  });

  const { bounds, boundsKey } = useTripMapBounds(mapEntities, {
    filterDateFrom,
    filterDateTo,
    showPlanMarkers,
    visibleRoutes,
    routePreviewKey: routePreview?.key || "",
  });

  // Asegura centrado/zoom cuando cambia el día o se carga una ruta (draft/preview).
  useEffect(() => {
    if (!mapRef || !bounds) return;
    try {
      mapRef.fitBounds(bounds, { padding: [44, 44] });
    } catch {
      // noop
    }
  }, [mapRef, boundsKey, bounds]);

  const onSelectPlace = useCallback(
    (setState: (v: { address: string; latitude: number | null; longitude: number | null }) => void, payload: AutocompletePayload) => {
      setState({ address: payload.address, latitude: payload.latitude, longitude: payload.longitude });
    },
    []
  );

  function beginEditRoute(route: TripMapRoute) {
    if (!route) return;
    setIsRouteFormOpen(true);
    setFocusedRouteKey(`${route.source || "trip_routes"}:${route.id}`);
    setRoutePreview(null);
    const notes = parseRouteNotes(route.notes);
    const restStopsRaw = notes?.restStops;
    const restStops =
      restStopsRaw && typeof restStopsRaw === "object"
        ? (restStopsRaw as { enabled?: boolean; count?: number; minutesEach?: number })
        : null;
    const noteText = typeof notes?.noteText === "string" ? notes.noteText : "";
    const checklist = parseRouteChecklist(notes?.checklist);

    setForm((prev) => ({
      ...prev,
      editingRouteId: route.source === "trip_routes" ? route.id : null,
      routeDate: (route.route_day ||
        route.route_date ||
        prev.routeDate ||
        tripStartDate ||
        todayISO()) as string,
      routeName: String(route.route_name || route.title || "Ruta"),
      departureTime: route.departure_time || "",
      color: route.color || ROUTE_COLOR_PALETTE[0],
      autoColor: !route.color,
      stopEnabled: typeof route.stop_latitude === "number" && typeof route.stop_longitude === "number",
      restStopsEnabled: !!restStops?.enabled,
      restStopsCount: typeof restStops?.count === "number" ? restStops.count : 1,
      restStopMinutes: typeof restStops?.minutesEach === "number" ? restStops.minutesEach : 15,
      noteText,
      checklist,
    }));

    setOrigin({
      address: route.origin_address || route.origin_name || "",
      latitude: route.origin_latitude ?? null,
      longitude: route.origin_longitude ?? null,
    });
    setStop({
      address: route.stop_address || route.stop_name || "",
      latitude: route.stop_latitude ?? null,
      longitude: route.stop_longitude ?? null,
    });
    setDestination({
      address: route.destination_address || route.destination_name || "",
      latitude: route.destination_latitude ?? null,
      longitude: route.destination_longitude ?? null,
    });
    setTravelMode(normalizeTripRouteTravelMode(route.travel_mode));
  }

  async function calculateRoutePreview() {
    setError(null);
    setInfo(null);

    const name = form.routeName.trim() || "Ruta";
    if (!form.routeDate) {
      setError("Selecciona un día.");
      return null;
    }

    if (
      typeof origin.latitude !== "number" ||
      typeof origin.longitude !== "number" ||
      typeof destination.latitude !== "number" ||
      typeof destination.longitude !== "number"
    ) {
      setError("Origen y destino deben tener coordenadas (elige un plan con coords o usa el buscador).");
      return null;
    }

    setCalculatingRoute(true);
    try {
      const originPt: RoutePoint = { lat: origin.latitude, lng: origin.longitude };
      const destPt: RoutePoint = { lat: destination.latitude, lng: destination.longitude };
      const stopPt =
        form.stopEnabled && typeof stop.latitude === "number" && typeof stop.longitude === "number"
          ? ({ lat: stop.latitude, lng: stop.longitude } satisfies RoutePoint)
          : null;

      let routePoints: RoutePoint[] = [originPt, ...(stopPt ? [stopPt] : []), destPt];
      let distanceText: string | null = null;
      let durationText: string | null = null;
      let durationSeconds: number | null = null;

      let transitApproximate = false;
      let durationAdjusted = false;
      try {
        const profile = osrmProfileForTravelMode(travelMode);
        const osrm = await fetchOsrmRoute({ origin: originPt, destination: destPt, stop: stopPt, profile });
        if (Array.isArray(osrm.points) && osrm.points.length >= 2) {
          routePoints = osrm.points;
        }
        const adjusted = applyTravelModeToOsrmMetrics(travelMode, {
          distanceMeters: osrm.distanceMeters,
          durationSeconds: osrm.durationSeconds,
        });
        transitApproximate = Boolean(adjusted.transitApproximate);
        durationAdjusted = Boolean(adjusted.durationAdjusted);
        if (typeof adjusted.distanceMeters === "number" && Number.isFinite(adjusted.distanceMeters)) {
          distanceText = formatKm(adjusted.distanceMeters);
        }
        if (typeof adjusted.durationSeconds === "number" && Number.isFinite(adjusted.durationSeconds)) {
          durationSeconds = adjusted.durationSeconds;
          durationText = formatDuration(adjusted.durationSeconds);
        }
      } catch {
        const pathMeters = pathLengthMeters(routePoints);
        if (pathMeters > 0) {
          const fixed = applyTravelModeToOsrmMetrics(travelMode, {
            distanceMeters: pathMeters,
            durationSeconds: null,
          });
          durationAdjusted = Boolean(fixed.durationAdjusted) || durationAdjusted;
          if (typeof fixed.distanceMeters === "number") distanceText = formatKm(fixed.distanceMeters);
          if (typeof fixed.durationSeconds === "number") {
            durationSeconds = fixed.durationSeconds;
            durationText = formatDuration(fixed.durationSeconds);
          }
        }
      }

      const durationHint = travelModeDurationHint(travelMode, { transitApproximate, durationAdjusted });
      const preview: RoutePreview = {
        key: routeCalcKey,
        calculatedTravelMode: travelMode,
        points: routePoints,
        distanceText,
        durationText,
        durationSeconds,
        arrivalTime: addDurationToTime(form.departureTime, durationSeconds),
        color: effectiveRouteColor,
        label: name,
        durationAdjusted,
      };
      setFocusedRouteKey(null);
      setRoutePreview(preview);
      setInfo(
        durationHint
          ? `Ruta calculada en modo ${travelModeLabel(travelMode).toLowerCase()}. ${durationHint} Revisa el trazado y guarda cuando quieras.`
          : `Ruta calculada en modo ${travelModeLabel(travelMode).toLowerCase()}. Revisa el trazado y guarda cuando quieras.`
      );
      return preview;
    } catch (e) {
      setRoutePreview(null);
      setError(e instanceof Error ? e.message : "No se pudo calcular la ruta.");
      return null;
    } finally {
      setCalculatingRoute(false);
    }
  }

  async function createOrUpdateRoute() {
    setError(null);
    setInfo(null);

    setSaving(true);
    try {
      const name = form.routeName.trim() || "Ruta";
      const previewMatchesMode =
        routePreview?.key === routeCalcKey && routePreview.calculatedTravelMode === travelMode;
      const preview = previewMatchesMode ? routePreview : await calculateRoutePreview();
      if (!preview) return;

      const input: SaveRouteInput = {
        routeDate: form.routeDate,
        routeName: name,
        departureTime: form.departureTime,
        mode: travelMode,
        color: form.autoColor ? effectiveRouteColor : form.color || ROUTE_COLOR_PALETTE[0],
        originName: origin.address || "Origen",
        originAddress: origin.address || "Origen",
        originLatitude: origin.latitude,
        originLongitude: origin.longitude,
        stopName: stop.address || "",
        stopAddress: stop.address || "",
        stopLatitude: stop.latitude,
        stopLongitude: stop.longitude,
        destinationName: destination.address || "Destino",
        destinationAddress: destination.address || "Destino",
        destinationLatitude: destination.latitude,
        destinationLongitude: destination.longitude,
        distanceText: preview.distanceText,
        durationText: preview.durationText,
        arrivalTime: preview.arrivalTime,
        routePoints: preview.points,
        pathPoints: preview.points,
        notes: buildRouteNotes(form, form.editingRouteId ? routesState.find((r) => r.id === form.editingRouteId && r.source === "trip_routes")?.notes ?? null : null),
      };

      await saveRoute(input, form.editingRouteId || undefined);
      const savedMsg = form.editingRouteId ? "Ruta actualizada." : "Ruta guardada.";
      setForm(defaultRouteForm(form.routeDate));
      setTravelMode("DRIVING");
      setIsRouteFormOpen(false);
      setRoutePreview(null);
      setOrigin({ address: "", latitude: null, longitude: null });
      setStop({ address: "", latitude: null, longitude: null });
      setDestination({ address: "", latitude: null, longitude: null });
      setOriginPlanId("");
      setStopPlanId("");
      setDestinationPlanId("");

      // Si estamos revisando un borrador del asistente, al guardar cargamos automáticamente la siguiente ruta.
      if (draftReviewActiveRef.current && routesDraft?.routes?.length) {
        const last = routesDraft.routes.length - 1;
        const next = Math.min(routesDraftIndex + 1, last);
        if (next > routesDraftIndex) {
          setRoutesDraftIndex(next);
          setInfo(`${savedMsg} Cargando la siguiente ruta…`);
          setTimeout(() => loadDraftRoute(next), 0);
        } else {
          setInfo(`${savedMsg} Borrador completado.`);
        }
      } else {
        setInfo(savedMsg);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la ruta.");
    } finally {
      setSaving(false);
    }
  }

  async function addAllDraftRoutes() {
    if (!routesDraft?.routes?.length) return;
    setAddingAllRoutes(true);
    setError(null);
    let savedCount = 0;
    try {
      const usedColors = new Set(
        routesState
          .map((x) => String(x.color || "").trim().toLowerCase())
          .filter(Boolean)
      );
      for (let i = 0; i < routesDraft.routes.length; i++) {
        const r = routesDraft.routes[i]!;
        const color =
          typeof r.color === "string" && r.color.trim()
            ? r.color.trim()
            : pickNextRouteColor(usedColors, i);
        usedColors.add(color.toLowerCase());
        const input: SaveRouteInput = {
          routeDate: r.route_day,
          routeName: r.title,
          departureTime: r.departure_time || "",
          mode: r.travel_mode,
          color,
          originName: r.origin_name,
          originAddress: r.origin_address || "",
          originLatitude: r.origin_latitude,
          originLongitude: r.origin_longitude,
          destinationName: r.destination_name,
          destinationAddress: r.destination_address || "",
          destinationLatitude: r.destination_latitude,
          destinationLongitude: r.destination_longitude,
          distanceText: r.distance_text,
          durationText: r.duration_text,
          routePoints: r.route_points,
          pathPoints: r.path_points,
          notes: r.notes,
        };
        await saveRoute(input);
        savedCount++;
      }
      try { window.sessionStorage.removeItem(`tripboard_routes_draft:${tripId}`); } catch { /* ignore */ }
      setRoutesDraft(null);
      setRoutesDraftIndex(0);
      draftReviewActiveRef.current = false;
      setInfo(`✅ ${savedCount} ruta${savedCount !== 1 ? "s" : ""} guardada${savedCount !== 1 ? "s" : ""} correctamente.`);
      void reloadRoutes();
    } catch {
      setError("Error al guardar algunas rutas. Las rutas ya guardadas se mantienen.");
    } finally {
      setAddingAllRoutes(false);
    }
  }

  function loadDraftRoute(idx: number, draftOverride?: RoutesDraftPayload) {
    const draft = draftOverride ?? routesDraft;
    if (!draft?.routes?.length) return;
    const r = draft.routes[Math.max(0, Math.min(draft.routes.length - 1, idx))];
    if (!r) return;
    draftReviewActiveRef.current = true;

    setFocusedRouteKey(null);
    setRoutePreview(null);
    setRoutesBulkMode(false);
    setSelectedRouteKeys(new Set());

    setIsRouteFormOpen(true);
    const day =
      r.route_day ||
      draft.date ||
      defaultNewRouteDate({ tripStart: tripStartDate, tripDates });
    setFilterDateFrom(day);
    setFilterDateTo(day);

    setForm((prev) => ({
      ...prev,
      editingRouteId: null,
      routeDate: day,
      routeName: r.title || "Ruta",
      departureTime: r.departure_time || "",
      stopEnabled: false,
      color: typeof r.color === "string" && r.color.trim() ? r.color.trim() : pickRouteColorByIndex(idx),
      autoColor: !(typeof r.color === "string" && r.color.trim()),
      noteText: r.notes || "",
      checklist: [],
    }));

    setOrigin({
      address: r.origin_address || r.origin_name || "",
      latitude: r.origin_latitude ?? null,
      longitude: r.origin_longitude ?? null,
    });
    setStop({ address: "", latitude: null, longitude: null });
    setDestination({
      address: r.destination_address || r.destination_name || "",
      latitude: r.destination_latitude ?? null,
      longitude: r.destination_longitude ?? null,
    });
    setTravelMode(normalizeTripRouteTravelMode(r.travel_mode || draft.travelMode));
    setOriginPlanId("");
    setStopPlanId("");
    setDestinationPlanId("");

    setRoutePreview({
      key: `draft:${idx}`,
      calculatedTravelMode: normalizeTripRouteTravelMode(r.travel_mode || draft.travelMode),
      points:
        Array.isArray(r.path_points) && r.path_points.length
          ? r.path_points
          : Array.isArray(r.route_points) && r.route_points.length
            ? r.route_points
            : r.origin_latitude != null && r.origin_longitude != null && r.destination_latitude != null && r.destination_longitude != null
              ? [
                  { lat: r.origin_latitude, lng: r.origin_longitude },
                  { lat: r.destination_latitude, lng: r.destination_longitude },
                ]
              : [],
      distanceText: r.distance_text,
      durationText: r.duration_text,
      durationSeconds: null,
      arrivalTime: null,
      color: effectiveRouteColor,
      label: r.title,
    });

    setInfo(`Revisando borrador: ${idx + 1}/${draft.routes.length}. Ajusta y pulsa «Guardar ruta».`);
  }

  async function removeRoute(route: TripMapRoute) {
    setError(null);
    try {
      if (route.source === "trip_routes") {
        await deleteRoute(route.id);
      } else {
        const resp = await fetch(`/api/legacy-routes/${encodeURIComponent(route.id)}`, { method: "DELETE" });
        const payload = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(payload?.error || "No se pudo eliminar la ruta legacy.");
        await reloadRoutes();
      }
      setInfo(route.source === "trip_routes" ? "Ruta eliminada." : "Ruta legacy eliminada.");
      if (focusedRouteKey === `${route.source || "trip_routes"}:${route.id}`) setFocusedRouteKey(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar la ruta.");
    }
  }

  async function removeSelectedRoutes() {
    const keys = [...selectedRouteKeys];
    if (!keys.length) return;
    const ok = window.confirm(
      `¿Eliminar ${keys.length} ruta${keys.length === 1 ? "" : "s"} seleccionada${keys.length === 1 ? "" : "s"}? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    setError(null);
    try {
      for (const key of keys) {
        const r = routesForList.find((x) => tripMapRouteKey(x) === key);
        if (r) await removeRoute(r);
      }
      setSelectedRouteKeys(new Set());
      setRoutesBulkMode(false);
    } catch {
      // removeRoute ya rellenó setError
    }
  }

  const routesForList = useMemo(() => {
    const q = routeQuery.trim().toLowerCase();
    let base = dateFilteredRoutes;
    if (q) {
      base = base.filter((r) => String(r.title || r.route_name || "").toLowerCase().includes(q));
    }
    return base.slice().sort((a, b) => {
      const oa = a.route_order ?? Number.POSITIVE_INFINITY;
      const ob = b.route_order ?? Number.POSITIVE_INFINITY;
      if (oa !== ob) return oa - ob;
      return String(a.departure_time || "").localeCompare(String(b.departure_time || ""));
    });
  }, [dateFilteredRoutes, routeQuery]);

  const filteredRouteKeys = useMemo(() => routesForList.map((r) => tripMapRouteKey(r)), [routesForList]);

  const toggleFocusRoute = useCallback((key: string) => {
    setFocusedRouteKey((prev) => (prev === key ? null : key));
  }, []);

  const toggleRouteSelection = useCallback((key: string) => {
    setSelectedRouteKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (!reorderDay) return;
      const { active, over } = event;
      if (!over) return;
      if (active.id === over.id) return;

      const ids = filteredRouteKeys;
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;

      const next = arrayMove(ids, oldIndex, newIndex);

      // Optimista UI
      setRoutesState((prev) => {
        const byKey: Map<string, TripMapRoute> = new Map(
          prev.map((r) => [`${r.source || "trip_routes"}:${r.id}`, r] as [string, TripMapRoute])
        );
        next.forEach((key, index) => {
          const r = byKey.get(key);
          if (r && r.source === "trip_routes") byKey.set(key, { ...r, route_order: index + 1 });
        });
        return Array.from(byKey.values());
      });

      // Persistir solo rutas editables (trip_routes)
      const updates = next
        .map((key, index) => {
          const [source, id] = String(key).split(":");
          return { source, id, order: index + 1 };
        })
        .filter((u) => u.source === "trip_routes" && !!u.id);

      await Promise.all(
        updates.map((u) =>
          fetch(`/api/trip-routes/${encodeURIComponent(u.id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ route_order: u.order }),
          })
        )
      );
    },
    [filteredRouteKeys, reorderDay]
  );

  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden">
      {!canManageMap ? <TripReadOnlyBanner moduleLabel="rutas y mapa" /> : null}
      {canManageMap ? (
      <section
        data-tour="map-ai-section"
        className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-slate-950">Crear rutas automáticamente</div>
            <div className="mt-1 text-xs text-slate-600">
              Genera un borrador de rutas entre tus planes guardados (por día o para todo el viaje) y luego revísalas antes de guardar.
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <StatusChip active={isPremium}>Premium</StatusChip>
            <button
              type="button"
              data-tour="map-ai-open-btn"
              onClick={() => setAutoRoutesOpen((v) => !v)}
              className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              aria-expanded={autoRoutesOpen}
            >
              {autoRoutesOpen ? "Cerrar" : "Abrir"}
              <ChevronDown className={`h-4 w-4 transition ${autoRoutesOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
          </div>
        </div>
        {autoRoutesOpen ? (
        <div className="grid gap-3 px-4 py-4">
          {!isPremium ? <PremiumUpsell feature="autoRoutes" showTripCoopHint /> : null}
          {(routesAutoError || routesAutoQuestion) ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                routesAutoError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              {routesAutoError ? routesAutoError : routesAutoQuestion}
            </div>
          ) : null}

          <div>
            <div className="text-xs font-semibold text-slate-700">Modo de transporte</div>
            <p className="mt-1 text-[11px] text-slate-500">
              Distancia, trazado y tiempo se calculan según el modo elegido (el transporte público es una estimación).
            </p>
            <div className="mt-2">
              <RouteTravelModePicker
                value={routesAutoTravelMode}
                onChange={setRoutesAutoTravelMode}
                disabled={routesAutoLoading}
                compact
              />
            </div>
          </div>

          <label className="text-xs font-semibold text-slate-700">
            Preferencias adicionales (opcional)
            <textarea
              value={routesAutoNotes}
              onChange={(e) => setRoutesAutoNotes(e.target.value)}
              rows={2}
              placeholder="Ej. evitar autopista, más paradas de metro…"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>

          {routesAutoQuestion ? (
            <label className="text-xs font-semibold text-slate-700">
              Respuesta
              <input
                value={routesAutoFollowUp}
                onChange={(e) => setRoutesAutoFollowUp(e.target.value)}
                className="mt-2 min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900"
                placeholder="Escribe aquí…"
              />
            </label>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              data-tour="map-ai-btn"
              onClick={() => void generateRoutesDraft()}
              disabled={routesAutoLoading || !isPremium}
              className={`${btnPrimary} inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 py-2 text-sm disabled:opacity-60`}
              title="Crear rutas automáticamente"
            >
              {routesAutoLoading ? "Creando rutas…" : "Crear rutas"}
            </button>
          </div>
          <div className="text-[11px] text-slate-500">
            Nota: si faltan coordenadas en algún plan, esas paradas se omitirán al trazar.
          </div>
        </div>
        ) : null}
      </section>
      ) : null}

      {canManageMap && routesDraft?.routes?.length ? (
        <div className="rounded-3xl border border-[var(--brand-border)] bg-gradient-to-br from-[var(--brand-light)] via-white to-slate-50 px-5 py-4 shadow-sm dark:border-[#F87171]/20 dark:from-[#F87171]/8 dark:via-[#0F1623] dark:to-[#0F1623]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-text)]">Borrador del asistente</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {routesDraft.routes.length} ruta{routesDraft.routes.length === 1 ? "" : "s"} · {routesDraft.date}
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-600">
                Ruta {Math.min(routesDraftIndex + 1, routesDraft.routes.length)}/{routesDraft.routes.length}:
                <span className="ml-1 font-extrabold text-slate-900">
                  {routesDraft.routes[routesDraftIndex]?.title || "—"}
                </span>
              </div>

              <details data-tour="map-routes-list" className="mt-3 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2">
                <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-[0.12em] text-slate-700">
                  Ver lista de rutas ({routesDraft.routes.length})
                </summary>
                <div className="mt-3 max-h-56 overflow-auto pr-1">
                  <div className="space-y-2">
                    {routesDraft.routes.map((r, i) => (
                      <button
                        key={`${r.title}-${i}`}
                        type="button"
                        onClick={() => {
                          setRoutesDraftIndex(i);
                          loadDraftRoute(i);
                        }}
                        className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                          i === routesDraftIndex
                            ? "border-violet-300 bg-violet-50 text-violet-950"
                            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                          {i + 1}/{routesDraft.routes.length}
                        </div>
                        <div className="mt-0.5 font-semibold">{r.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </details>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              {/* ── Añadir todas de golpe ── */}
              <button
                type="button"
                disabled={addingAllRoutes || savingRoute}
                className={`${btnPrimary} inline-flex min-h-[40px] items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm disabled:opacity-60`}
                onClick={() => void addAllDraftRoutes()}
              >
                {addingAllRoutes ? "Guardando…" : `Añadir todas (${routesDraft.routes.length})`}
              </button>
              <button
                type="button"
                className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                onClick={() => loadDraftRoute(routesDraftIndex)}
              >
                Cargar actual
              </button>
              <button
                type="button"
                className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                onClick={() => {
                  const next = Math.min(routesDraftIndex + 1, routesDraft.routes.length - 1);
                  setRoutesDraftIndex(next);
                  loadDraftRoute(next);
                }}
              >
                Cargar siguiente
              </button>
              <button
                type="button"
                className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                onClick={() => {
                  try {
                    window.sessionStorage.removeItem(`tripboard_routes_draft:${tripId}`);
                  } catch {
                    // ignore
                  }
                  setRoutesDraft(null);
                  setRoutesDraftIndex(0);
                  setInfo("Borrador descartado.");
                  draftReviewActiveRef.current = false;
                }}
              >
                Descartar borrador
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-6">
      <div
        className={`grid min-w-0 gap-6 ${isMapVisible ? "xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]" : "grid-cols-1"}`}
      >
        <aside className="min-w-0 space-y-4">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
        ) : null}
        {info ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{info}</div>
        ) : null}

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-950">Filtros y contexto</div>
              <div className="mt-1 text-xs text-slate-600">
                Fechas, capas del mapa, tipos del plan y búsqueda en un solo lugar.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex min-h-[36px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              aria-expanded={filtersOpen}
            >
              {filtersOpen ? "Cerrar filtros" : "Abrir filtros"}
              <ChevronDown className={`h-4 w-4 transition ${filtersOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
          </div>

          {filtersOpen ? (
          <div className="space-y-4 px-4 py-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">
                <CalendarDays className="h-4 w-4" aria-hidden />
                Rango de fechas
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700">
                  Desde
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => {
                      const v = normalizeFilterDate(e.target.value);
                      setFilterDateFrom(v);
                      if (filterDateTo && v && v > filterDateTo) setFilterDateTo(v);
                      setFocusedRouteKey(null);
                    }}
                    className="mt-1.5 min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Hasta
                  <input
                    type="date"
                    value={filterDateTo}
                    min={filterDateFrom || undefined}
                    onChange={(e) => {
                      setFilterDateTo(normalizeFilterDate(e.target.value));
                      setFocusedRouteKey(null);
                    }}
                    className="mt-1.5 min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900"
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFilterDateFrom("");
                    setFilterDateTo("");
                    setFocusedRouteKey(null);
                  }}
                  className={`inline-flex min-h-[34px] items-center rounded-full border px-3 text-xs font-extrabold transition ${
                    !filterDateFrom && !filterDateTo
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Todos los días
                </button>
                {(Array.isArray(tripDates) ? tripDates : []).slice(0, 8).map((d) => (
                  <button
                    key={`quick-${d}`}
                    type="button"
                    onClick={() => {
                      setFilterDateFrom(d);
                      setFilterDateTo(d);
                      setFocusedRouteKey(null);
                    }}
                    className={`inline-flex min-h-[34px] items-center rounded-full border px-3 text-xs font-semibold transition ${
                      filterDateFrom === d && filterDateTo === d
                        ? "border-[var(--brand-border)] bg-[var(--brand-light)] text-[var(--brand-text)]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Mostrando: <span className="font-semibold text-slate-700">{describeDateFilter(filterDateFrom, filterDateTo)}</span>
                {reorderDay ? " · Puedes reordenar rutas de este día arrastrando." : null}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">Vista del mapa</div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setIsMapVisible((v) => !v)}
                  className={`inline-flex min-h-[40px] items-center justify-center rounded-xl border px-3 text-xs font-semibold transition ${
                    isMapVisible
                      ? "border-slate-200 bg-slate-50 text-slate-800"
                      : "border-slate-900 bg-slate-900 text-white"
                  }`}
                >
                  {isMapVisible ? "Mapa visible" : "Mapa oculto"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPlanMarkers((v) => !v)}
                  className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
                    showPlanMarkers
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  Marcadores {showPlanMarkers ? "ON" : "OFF"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCityRoute((v) => !v)}
                  disabled={Boolean(filterDateFrom || filterDateTo)}
                  className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                    showCityRoute
                      ? "border-violet-200 bg-violet-50 text-violet-900"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                  title={
                    filterDateFrom || filterDateTo
                      ? "Disponible solo con «Todos los días»"
                      : "Ruta general del viaje entre ciudades"
                  }
                >
                  🗺️ Ruta viaje {showCityRoute ? "ON" : "OFF"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">Tipos de plan</div>
              {customKindsWarning ? (
                <div className="mt-2 text-[11px] text-amber-700">{customKindsWarning}</div>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPlanKindFilter(new Set())}
                  className={`inline-flex min-h-[34px] items-center rounded-full border px-3 text-xs font-extrabold transition ${
                    planKindFilter.size === 0
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Todos
                </button>
                {availablePlanKinds.map((k) => {
                  const active = planKindFilter.has(k);
                  const label = customByKey.get(k)?.label || kindLabel(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setPlanKindFilter((prev) => {
                          const next = new Set(prev);
                          if (next.has(k)) next.delete(k);
                          else next.add(k);
                          return next;
                        });
                      }}
                      className={`inline-flex min-h-[34px] items-center rounded-full border px-3 text-xs font-extrabold transition ${
                        active
                          ? "border-violet-300 bg-violet-50 text-violet-900"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block text-xs font-semibold text-slate-700">
              Buscar ruta
              <input
                value={routeQuery}
                onChange={(e) => setRouteQuery(e.target.value)}
                className="mt-1.5 min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900"
                placeholder="Filtrar por nombre…"
              />
            </label>
          </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-extrabold text-slate-950">Rutas</div>
                <span className="inline-flex min-h-[24px] items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-extrabold text-slate-700">
                  {routesState.length} guardada{routesState.length === 1 ? "" : "s"}
                </span>
                {routesForList.length !== routesState.length ? (
                  <span className="text-[11px] font-semibold text-slate-500">
                    · {routesForList.length} visible{routesForList.length === 1 ? "" : "s"} con filtros
                  </span>
                ) : null}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Crea rutas manualmente y consulta las guardadas. Filtra por fechas o nombre arriba.
              </div>
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
              {canManageMap ? (
                isRouteFormOpen ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRouteFormOpen(false);
                      setForm(
                        defaultRouteForm(
                          defaultNewRouteDate({
                            preferred: form.routeDate,
                            tripStart: tripStartDate,
                            tripDates,
                          })
                        )
                      );
                      setRoutePreview(null);
                      setOrigin({ address: "", latitude: null, longitude: null });
                      setStop({ address: "", latitude: null, longitude: null });
                      setDestination({ address: "", latitude: null, longitude: null });
                      setOriginPlanId("");
                      setStopPlanId("");
                      setDestinationPlanId("");
                    }}
                    className="inline-flex min-h-[34px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cerrar editor
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRouteFormOpen(true);
                      setTravelMode("DRIVING");
                      setForm(
                        defaultRouteForm(
                          defaultNewRouteDate({
                            preferred: reorderDay || filterDateFrom || null,
                            tripStart: tripStartDate,
                            tripDates,
                          })
                        )
                      );
                      setRoutePreview(null);
                      setOrigin({ address: "", latitude: null, longitude: null });
                      setStop({ address: "", latitude: null, longitude: null });
                      setDestination({ address: "", latitude: null, longitude: null });
                      setOriginPlanId("");
                      setStopPlanId("");
                      setDestinationPlanId("");
                    }}
                    data-tour="map-new-route-btn"
                    className={`${btnPrimary} inline-flex min-h-[34px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs`}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Nueva ruta
                  </button>
                )
              ) : null}
              {routesBulkMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedRouteKeys(new Set(routesForList.map((r) => tripMapRouteKey(r))))}
                    disabled={!routesForList.length || saving || savingRoute}
                    className="inline-flex min-h-[34px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Seleccionar todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRouteKeys(new Set())}
                    disabled={saving || savingRoute}
                    className="inline-flex min-h-[34px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Quitar selección
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRoutesBulkMode(false);
                      setSelectedRouteKeys(new Set());
                    }}
                    disabled={saving || savingRoute}
                    className="inline-flex min-h-[34px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!selectedRouteKeys.size || saving || savingRoute}
                    onClick={() => void removeSelectedRoutes()}
                    className="inline-flex min-h-[34px] items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Eliminar{selectedRouteKeys.size > 0 ? ` (${selectedRouteKeys.size})` : ""}
                  </button>
                </>
              ) : (
                <>
                  {canManageMap ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRoutesBulkMode(true);
                        setSelectedRouteKeys(new Set());
                        setShowRoutesList(true);
                      }}
                      disabled={!routesForList.length}
                      className="inline-flex min-h-[34px] items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
                      title="Eliminar varias rutas"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      Eliminar
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShowRoutesList((v) => !v)}
                    className={`inline-flex min-h-[34px] items-center justify-center rounded-xl border px-3 text-xs font-semibold transition ${
                      showRoutesList
                        ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        : "border-[var(--brand)] bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                    }`}
                    title={showRoutesList ? "Ocultar rutas" : "Mostrar rutas"}
                  >
                    {showRoutesList ? "Ocultar rutas" : "Mostrar rutas"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocusedRouteKey(null)}
                    className="inline-flex min-h-[34px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    title="Mostrar todas"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    Todas
                  </button>
                </>
              )}
            </div>
          </div>

          {canManageMap && !isRouteFormOpen && routesState.length === 0 ? (
            <div className="border-b border-slate-100 px-4 py-5">
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">🗺️</div>
                <p className="text-sm font-bold text-slate-800">Sin rutas todavía</p>
                <p className="mt-1 text-xs text-slate-500">
                  Crea una ruta con «Nueva ruta» o abre «Crear rutas automáticamente» arriba.
                </p>
              </div>
            </div>
          ) : null}

          <div className="px-4 py-3">
            {reorderDay && routesForList.length > 0 ? (
              <div className="text-[11px] text-slate-500">
                {routesForList.length} ruta{routesForList.length === 1 ? "" : "s"} el {reorderDay}. Puedes reordenarlas arrastrando.
              </div>
            ) : (filterDateFrom || filterDateTo) && !routesForList.length ? (
              <div className="text-[11px] text-slate-500">
                No hay rutas guardadas para {describeDateFilter(filterDateFrom, filterDateTo).toLowerCase()}.
              </div>
            ) : routesBulkMode ? (
              <div className="text-[11px] text-slate-500">Toca el círculo o la fila para marcar rutas; luego pulsa Eliminar.</div>
            ) : !showRoutesList && routesState.length > 0 ? (
              <div className="text-[11px] text-slate-500">
                Lista oculta · pulsa «Mostrar rutas» para ver el detalle de cada recorrido.
              </div>
            ) : null}
          </div>

          {showRoutesList ? (
          <div data-tour="map-routes-list-panel" className="space-y-3 px-4 pb-4">
            <TripMapRoutesList
              routesForList={routesForList}
              filteredRouteKeys={filteredRouteKeys}
              reorderDay={reorderDay}
              routesBulkMode={routesBulkMode}
              focusedRouteKey={focusedRouteKey}
              selectedRouteKeys={selectedRouteKeys}
              canManageMap={!!canManageMap}
              sensors={sensors}
              onDragEnd={handleDragEnd}
              onFocusRoute={toggleFocusRoute}
              onToggleRouteSelection={toggleRouteSelection}
              onEditRoute={beginEditRoute}
              onDuplicateRoute={(route) => {
                setDuplicateRoute(route);
                setDuplicateOpen(true);
              }}
              onRemoveRoute={removeRoute}
            />
          </div>
          ) : (
            <div className="px-4 pb-4 text-sm text-slate-500">
              {routesState.length === 0
                ? "No hay rutas guardadas todavía."
                : `${routesState.length} ruta${routesState.length === 1 ? "" : "s"} guardada${routesState.length === 1 ? "" : "s"}. Pulsa «Mostrar rutas» para ver la lista.`}
            </div>
          )}
        </section>
        </aside>

        <MapSurface
          visible={isMapVisible}
          bounds={bounds}
          boundsKey={boundsKey}
          lines={mapEntities.lines}
          markers={mapEntities.markers}
          onMapCreated={(m) => setMapRef(m)}
          isDarkMap={typeof document !== "undefined" && document.documentElement.classList.contains("dark")}
          compact={isRouteFormOpen}
        />
      </div>
      {canManageMap && isRouteFormOpen ? (
        <RouteEditorPanel
          ref={routeFormPanelRef}
          editing={!!form.editingRouteId}
          form={form}
          setForm={setForm}
          travelMode={travelMode}
          onTravelModeChange={(m) => {
            setTravelMode(m);
            setRoutePreview(null);
          }}
          effectiveRouteColor={effectiveRouteColor}
          routeDayForPlans={routeDayForPlans}
          planSelectOptions={planSelectOptions}
          origin={origin}
          setOrigin={setOrigin}
          stop={stop}
          setStop={setStop}
          destination={destination}
          setDestination={setDestination}
          originPlanId={originPlanId}
          setOriginPlanId={setOriginPlanId}
          stopPlanId={stopPlanId}
          setStopPlanId={setStopPlanId}
          destinationPlanId={destinationPlanId}
          setDestinationPlanId={setDestinationPlanId}
          onSelectPlace={onSelectPlace}
          routePreview={routePreview}
          calculatingRoute={calculatingRoute}
          saving={saving}
          savingRoute={savingRoute}
          onCalculate={() => void calculateRoutePreview()}
          onSave={() => void createOrUpdateRoute()}
          saveButtonClass={btnPrimary}
        />
      ) : null}
      </div>

      <DuplicateRouteDialog
        open={duplicateOpen}
        route={duplicateRoute}
        tripId={tripId}
        tripDates={Array.isArray(tripDates) ? tripDates : []}
        defaultDate={
          reorderDay ||
          filterDateFrom ||
          tripStartDate ||
          undefined
        }
        onClose={() => setDuplicateOpen(false)}
        onDuplicated={() => void reloadRoutes()}
      />
    </div>
  );
}

