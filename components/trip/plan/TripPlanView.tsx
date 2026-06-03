
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PlanActivityRow from "@/components/trip/plan/PlanActivityRow";
import PlanItineraryCard from "@/components/trip/plan/PlanItineraryCard";
import PlanExpenseFooter from "@/components/trip/plan/PlanExpenseFooter";
import PlanDocumentImportPanel from "@/components/trip/plan/PlanDocumentImportPanel";
import PlanActivityDetailSheet from "@/components/trip/plan/PlanActivityDetailSheet";
import PlanAiSuggestBadge from "@/components/trip/plan/PlanAiSuggestBadge";
import { isLodgingPlanActivity } from "@/lib/plan-activity-meta";
import PlanForm, { type PlanFormValues } from "@/components/trip/plan/PlanForm";
import { useTripActivities, type TripActivity } from "@/hooks/useTripActivities";
import { useIsDemoTrip } from "@/components/trip/TripDemoContext";;
import {
  CalendarDays,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Compass,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import TripPlanCalendar from "@/components/trip/plan/TripPlanCalendar";
import { useTripActivityKinds } from "@/hooks/useTripActivityKinds";
import TripPlanExploreDrawer, { type ExploreCreatePlanPayload } from "@/components/trip/plan/TripPlanExploreDrawer";
import TripPlanNotesPanel from "@/components/trip/plan/TripPlanNotesPanel";
import PlanAttendanceSummary from "@/components/trip/plan/PlanAttendanceSummary";
import { useTripWorkspace } from "@/components/trip/TripWorkspaceContext";
import { SortableRow } from "@/components/trip/plan/SortableRow";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { activityLikelyNeedsTicket } from "@/lib/trip-plan-ticket-hints";
import {
  btnPrimary,
  btnSecondary,
  chipGroup,
  chipItemActive,
  chipItemBase,
  chipItemInactive,
} from "@/components/ui/brandStyles";
import TripReadOnlyBanner from "@/components/trip/common/TripReadOnlyBanner";
import type { TripActivitiesInitial } from "@/hooks/useTripActivities";
import type { PlanTripParticipant } from "@/lib/plan-trip-participants";
import { resolveCreatePlanDate } from "@/lib/plan-create-defaults";
import {
  KAVIRO_TRIP_PLAN_REFRESH_EVENT,
  type TripPlanRefreshDetail,
} from "@/lib/trip-plan-events";

const COMMON_KIND_ICONS: Array<{ emoji: string; label: string }> = [
  { emoji: "📍", label: "Visita" },
  { emoji: "🏛️", label: "Museo" },
  { emoji: "🍽️", label: "Comida" },
  { emoji: "☕", label: "Cafetería" },
  { emoji: "🏖️", label: "Playa" },
  { emoji: "⛰️", label: "Montaña" },
  { emoji: "🥾", label: "Senderismo" },
  { emoji: "🛍️", label: "Compras" },
  { emoji: "🎭", label: "Espectáculo" },
  { emoji: "🎟️", label: "Actividad" },
  { emoji: "🎉", label: "Evento" },
  { emoji: "🌿", label: "Naturaleza" },
  { emoji: "🏟️", label: "Deporte" },
  { emoji: "🍷", label: "Vinos" },
  { emoji: "🍺", label: "Cervezas" },
  { emoji: "🌙", label: "Noche" },
  { emoji: "🏨", label: "Alojamiento" },
  { emoji: "🚆", label: "Transporte" },
  { emoji: "🚗", label: "Coche" },
  { emoji: "✈️", label: "Vuelo" },
  { emoji: "🚌", label: "Bus" },
  { emoji: "⛴️", label: "Ferry" },
  { emoji: "📸", label: "Fotos" },
  { emoji: "🧭", label: "Explorar" },
  { emoji: "🧘", label: "Relax" },
  { emoji: "🧺", label: "Picnic" },
  { emoji: "🧑‍🍳", label: "Cocina" },
];

function groupByDate(activities: TripActivity[]) {
  const groups = new Map<string, TripActivity[]>();

  for (const activity of activities) {
    const key = activity.activity_date || "Sin fecha";
    const prev = groups.get(key) || [];
    prev.push(activity);
    groups.set(key, prev);
  }

  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function formatPlanDayHeading(dateKey: string): { weekday: string; dayNum: string; month: string; full: string } {
  if (dateKey === "Sin fecha") return { weekday: "", dayNum: "—", month: "Sin fecha", full: "Sin fecha" };
  const d = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { weekday: "", dayNum: "—", month: dateKey, full: dateKey };
  return {
    weekday: new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(d).replace(".", "").toUpperCase(),
    dayNum: new Intl.DateTimeFormat("es-ES", { day: "numeric" }).format(d),
    month: new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(d),
    full: new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d),
  };
}

function todayYMD() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

function activityCountLabel(n: number) {
  if (n === 1) return "1 actividad";
  return `${n} actividades`;
}

function normalizeKind(kind: unknown) {
  return typeof kind === "string" ? kind.trim().toLowerCase() : "";
}

function toSentenceCase(label: string) {
  const cleaned = String(label || "").trim().replace(/_/g, " ");
  if (!cleaned) return cleaned;
  return cleaned.slice(0, 1).toUpperCase() + cleaned.slice(1).toLowerCase();
}

function defaultKindLabelEs(kindKey: string) {
  const k = normalizeKind(kindKey);
  if (k === "visit") return "Visita";
  if (k === "museum") return "Museo";
  if (k === "restaurant") return "Restaurante";
  if (k === "transport") return "Transporte";
  if (k === "activity") return "Actividad";
  if (k === "lodging") return "Alojamiento";
  return "";
}

function isLodgingActivity(a: TripActivity) {
  return (
    a.activity_type === "lodging" ||
    a.source === "reservation" ||
    Boolean(a.linked_reservation_id) ||
    normalizeKind(a.activity_kind) === "lodging"
  );
}

function canBulkDeletePlanActivity(a: TripActivity) {
  if (a.linked_reservation_id) return false;
  return true;
}

function effectiveKind(a: TripActivity) {
  if (isLodgingActivity(a)) return "lodging";
  return normalizeKind(a.activity_kind) || "visit";
}

function kindMeta(kindRaw: unknown, custom?: Map<string, { label: string; emoji?: string | null; color?: string | null }>) {
  const kind = normalizeKind(kindRaw);
  const fromCustom = custom?.get(kind) || null;
  if (fromCustom) {
    return {
      key: kind,
      label: fromCustom.label || kind,
      glyph: fromCustom.emoji || "•",
      color: fromCustom.color || "#64748b",
    };
  }
  if (kind === "culture") return { key: "culture", label: "Cultura", glyph: "🏛️", color: "#f59e0b" };
  if (kind === "nature") return { key: "nature", label: "Naturaleza", glyph: "🌿", color: "#10b981" };
  if (kind === "viewpoint") return { key: "viewpoint", label: "Mirador", glyph: "🌄", color: "#0ea5e9" };
  if (kind === "neighborhood") return { key: "neighborhood", label: "Barrio", glyph: "🧭", color: "#64748b" };
  if (kind === "market") return { key: "market", label: "Mercado", glyph: "🧺", color: "#f97316" };
  if (kind === "excursion") return { key: "excursion", label: "Excursión", glyph: "🚌", color: "#2563eb" };
  if (kind === "gastro_experience") return { key: "gastro_experience", label: "Gastronomía", glyph: "🍷", color: "#db2777" };
  if (kind === "shopping") return { key: "shopping", label: "Compras", glyph: "🛍️", color: "#a855f7" };
  if (kind === "night") return { key: "night", label: "Noche", glyph: "🌙", color: "#334155" };
  if (kind === "museum") return { key: "museum", label: "Museo", glyph: "M", color: "#f59e0b" };
  if (kind === "restaurant") return { key: "restaurant", label: "Comida", glyph: "🍴", color: "#f97316" };
  if (kind === "transport") return { key: "transport", label: "Transporte", glyph: "✈", color: "#0ea5e9" };
  if (kind === "lodging") return { key: "lodging", label: "Alojamiento", glyph: "H", color: "#8b5cf6" };
  if (kind === "activity") return { key: "activity", label: "Actividad", glyph: "🎟️", color: "#10b981" };
  if (kind === "visit" || !kind) return { key: "visit", label: "Visita", glyph: "📍", color: "#64748b" };
  // Tipo desconocido (todavía sin catálogo): mostrar su propio nombre.
  const label = kind.slice(0, 1).toUpperCase() + kind.slice(1);
  return { key: kind, label, glyph: "🏷️", color: "#475569" };
}

function Chip({
  active,
  onClick,
  label,
  glyph,
  color,
  title,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  glyph: string;
  color: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold transition focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] ${
        active ? "border-[var(--brand-border)] bg-[var(--brand-light)] text-[var(--brand-text)]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/70" style={{ backgroundColor: color }}>
        <span className="text-[11px] font-black text-white">{glyph}</span>
      </span>
      <span className="min-w-0 max-w-[min(11rem,78vw)] whitespace-normal break-words text-left leading-tight sm:max-w-[10rem] md:max-w-[160px]">
        {label}
      </span>
    </button>
  );
}

export default function TripPlanView({
  tripId,
  premiumEnabled,
  currentUserId = null,
  currentDisplayName = "Yo",
  initialExploreOpen = false,
  initialTripDescription = null,
  canEditTripNotes = false,
  canManagePlan = true,
  initialWorkspaceTab = "itinerary",
  initialSelectedDate = null,
  initialActivities,
  participants = [],
  tripParticipants = [],
  currentParticipantId = null,
}: {
  tripId: string;
  premiumEnabled: boolean;
  currentUserId?: string | null;
  currentDisplayName?: string;
  initialExploreOpen?: boolean;
  initialTripDescription?: string | null;
  canEditTripNotes?: boolean;
  canManagePlan?: boolean;
  initialWorkspaceTab?: "itinerary" | "notes" | "attendance";
  initialSelectedDate?: string | null;
  initialActivities?: TripActivitiesInitial;
  participants?: string[];
  tripParticipants?: PlanTripParticipant[];
  currentParticipantId?: string | null;
}) {
  const { trip, activities, loading, saving, error, unseenCount = 0, clearUnseen, createActivity, updateActivity, deleteActivity, deleteActivitiesBulk } =
    useTripActivities(tripId, initialActivities);
  const {
    kinds: customKinds,
    loading: customKindsLoading,
    saving: customKindsSaving,
    error: customKindsError,
    warning: customKindsWarning,
    createKind,
    updateKind,
    deleteKind,
  } = useTripActivityKinds(tripId);

  const [editingActivity, setEditingActivity] = useState<TripActivity | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const formAnchorRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<Set<string>>(new Set());
  const [showLodging, setShowLodging] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<string | null>(initialSelectedDate);
  const [kindsOpen, setKindsOpen] = useState(false);
  const [newKind, setNewKind] = useState({ label: "", key: "", emoji: "", color: "#64748b" });
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [editIconPickerId, setEditIconPickerId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false);
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [exploreOpen, setExploreOpen] = useState(initialExploreOpen);
  const { hideSocialFeatures, isAgencyTrip } = useTripWorkspace();
  const [workspaceTab, setWorkspaceTab] = useState<"itinerary" | "notes" | "attendance">(() =>
    hideSocialFeatures && initialWorkspaceTab === "attendance" ? "itinerary" : initialWorkspaceTab
  );
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set());
  // For demo trips (detected via URL), expand all days by default
  const isDemoExpand = typeof window !== "undefined" && window.location.href.includes("tutorial=demo");
  const isDemoTrip = useIsDemoTrip();
  const [expandedDayKeys, setExpandedDayKeys] = useState<Set<string>>(() => new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailActivity, setDetailActivity] = useState<TripActivity | null>(null);
  const [localOrder, setLocalOrder] = useState<Map<string, string[]>>(new Map());
  const [plansAddedNotice, setPlansAddedNotice] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    function onPlanRefresh(event: Event) {
      const detail = (event as CustomEvent<TripPlanRefreshDetail>).detail;
      if (!detail?.tripId || detail.tripId !== tripId) return;
      if (detail.focusDate && /^\d{4}-\d{2}-\d{2}$/.test(detail.focusDate)) {
        setSelectedDate(detail.focusDate);
      }
      if (detail.plansAdded && detail.plansAdded > 0) {
        setPlansAddedNotice(
          detail.message ||
            `${detail.plansAdded} plan${detail.plansAdded === 1 ? "" : "es"} añadido${detail.plansAdded === 1 ? "" : "s"} al viaje.`
        );
      }
    }
    window.addEventListener(KAVIRO_TRIP_PLAN_REFRESH_EVENT, onPlanRefresh);
    return () => window.removeEventListener(KAVIRO_TRIP_PLAN_REFRESH_EVENT, onPlanRefresh);
  }, [tripId]);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      if (!historyOpen) return;
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const resp = await fetch(
          `/api/trip-audit?tripId=${encodeURIComponent(tripId)}&entityType=activity&limit=40`,
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

  const availableKinds = useMemo(() => {
    const s = new Set<string>();
    for (const a of activities) {
      const k = effectiveKind(a);
      if (k) s.add(k);
    }
    return Array.from(s.values()).sort();
  }, [activities]);

  const customByKey = useMemo(() => {
    const map = new Map<string, { label: string; emoji?: string | null; color?: string | null }>();
    for (const k of customKinds || []) {
      const key = normalizeKind(k.kind_key);
      if (!key) continue;
      map.set(key, { label: k.label, emoji: k.emoji ?? null, color: k.color ?? null });
    }
    return map;
  }, [customKinds]);

  const kindsForSelect = useMemo(() => {
    // Para el PlanForm: lista de tipos (key/label) desde catálogo + tipos ya usados
    const merged = new Map<string, { key: string; label: string }>();
    for (const k of customKinds || []) {
      const key = normalizeKind(k.kind_key);
      if (!key) continue;
      merged.set(key, { key, label: k.label || key });
    }
    for (const k of availableKinds) {
      const key = normalizeKind(k);
      if (!key) continue;
      if (!merged.has(key)) {
        const base = defaultKindLabelEs(key) || key;
        merged.set(key, { key, label: toSentenceCase(base) });
      }
    }
    return Array.from(merged.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [availableKinds, customKinds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activities
      .filter((a) => {
        const isLodging = isLodgingActivity(a);
        if (!showLodging && isLodging) return false;
        return true;
      })
      .filter((a) => {
        if (!kindFilter.size) return true;
        const k = effectiveKind(a);
        return kindFilter.has(k);
      })
      .filter((a) => {
        if (!q) return true;
        const hay = `${a.title || ""} ${a.place_name || ""} ${a.address || ""} ${a.description || ""}`.toLowerCase();
        return hay.includes(q);
      });
  }, [activities, kindFilter, query, showLodging]);

  /** En modo selección: todos los planes del viaje (sin filtros de búsqueda/tipo). */
  const bulkSelectionActivities = useMemo(
    () =>
      activities.filter((a) => {
        if (!showLodging && isLodgingActivity(a)) return false;
        return true;
      }),
    [activities, showLodging]
  );

  const filteredWithCalendarDate = useMemo(() => {
    if (!selectedDate) return filtered;
    return filtered.filter((a) => (a.activity_date || "") === selectedDate);
  }, [filtered, selectedDate]);

  // Auto-expand all days for demo trip
  useEffect(() => {
    if (!isDemoTrip) return;
    const dates = activities.map((a) => a.activity_date ?? "").filter(Boolean);
    if (dates.length > 0) setExpandedDayKeys(new Set(dates));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoTrip, activities.length]);

  const grouped = useMemo(() => groupByDate(filteredWithCalendarDate), [filteredWithCalendarDate]);
  const bulkSelectionGrouped = useMemo(() => groupByDate(bulkSelectionActivities), [bulkSelectionActivities]);

  const cardGrouped = useMemo(() => {
    if (bulkDeleteMode) return bulkSelectionGrouped;
    if (selectedDate) return grouped.filter(([date]) => date === selectedDate);
    return grouped.length <= 1 ? grouped : grouped.slice(0, 1);
  }, [bulkDeleteMode, bulkSelectionGrouped, grouped, selectedDate]);

  const singleDayList = grouped.length === 1;

  /** Días únicos con actividad (post-filtro de tipo/búsqueda, pre-filtro de fecha).
   *  Usados para los tabs "Día 1, Día 2…" */
  const allDaysWithActivity = useMemo(
    () =>
      [...new Set(filtered.map((a) => a.activity_date).filter((d): d is string => Boolean(d)))].sort(),
    [filtered]
  );

  const selectableActivityIds = useMemo(
    () => bulkSelectionActivities.filter(canBulkDeletePlanActivity).map((a) => a.id),
    [bulkSelectionActivities]
  );
  const selectableIdsForSelectedDay = useMemo(
    () =>
      bulkSelectionActivities
        .filter((a) => (a.activity_date || "") === (selectedDate || ""))
        .filter(canBulkDeletePlanActivity)
        .map((a) => a.id),
    [bulkSelectionActivities, selectedDate]
  );
  const allSelected =
    selectableActivityIds.length > 0 &&
    selectableActivityIds.every((id) => selectedActivityIds.has(id));
  const lodgingCount = useMemo(
    () => activities.filter((item) => isLodgingActivity(item)).length,
    [activities]
  );

  const ticketHintCount = useMemo(
    () => activities.filter((a) => !isLodgingActivity(a) && activityLikelyNeedsTicket(a)).length,
    [activities]
  );

  useEffect(() => {
    if (viewMode !== "list" && viewMode !== "calendar") return;
    if (allDaysWithActivity.length === 0) return;
    if (selectedDate && allDaysWithActivity.includes(selectedDate)) return;
    if (!selectedDate) setSelectedDate(allDaysWithActivity[0]!);
  }, [viewMode, allDaysWithActivity, selectedDate]);

  const isEditing = Boolean(editingActivity?.id);
  const showForm = isFormOpen || isEditing;

  useEffect(() => {
    if (!showForm) return;
    // Espera un tick para que el formulario esté renderizado
    const id = window.setTimeout(() => {
      formAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(id);
  }, [showForm]);

  async function handleSubmit(values: PlanFormValues) {
    try {
      if (editingActivity?.id) {
        await updateActivity(editingActivity.id, values);
      } else {
        await createActivity(values);
      }
      setEditingActivity(null);
      setIsFormOpen(false);
    } catch {
      // El error ya lo muestra useTripActivities; mantenemos el formulario abierto para corregir.
    }
  }

  function handleStartCreate() {
    const activity_date = resolveCreatePlanDate({
      selectedDate,
      tripStartDate: trip?.start_date ?? null,
      activityDays: allDaysWithActivity,
    });
    setEditingActivity({
      activity_date: activity_date ?? null,
      invite_scope: "all",
    } as TripActivity);
    setIsFormOpen(true);
  }

  function handleStartEdit(activity: TripActivity) {
    setEditingActivity(activity);
    setIsFormOpen(true);
  }

  function handleCancelEditOrClose() {
    setEditingActivity(null);
    setIsFormOpen(false);
  }

  function toggleActivitySelection(activityId: string) {
    setSelectedActivityIds((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  }

  function toggleDaySelection(activityIds: string[]) {
    if (!activityIds.length) return;
    setSelectedActivityIds((prev) => {
      const allSelected = activityIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) activityIds.forEach((id) => next.delete(id));
      else activityIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function enterBulkDeleteMode(selectAll = false) {
    setBulkDeleteMode(true);
    setSelectedActivityIds(selectAll ? new Set(selectableActivityIds) : new Set());
  }

  function selectAllPlans() {
    setSelectedActivityIds(new Set(selectableActivityIds));
  }

  function exitBulkDeleteMode() {
    setBulkDeleteMode(false);
    setSelectedActivityIds(new Set());
  }

  async function confirmBulkDelete() {
    const ids = [...selectedActivityIds];
    if (!ids.length) return;
    const ok = window.confirm(
      `¿Eliminar ${ids.length} plan${ids.length === 1 ? "" : "es"} seleccionado${ids.length === 1 ? "" : "s"}? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
      const result = await deleteActivitiesBulk(ids);
      if ((result?.deleted ?? 0) > 0) {
        exitBulkDeleteMode();
      }
    } catch {
      // useTripActivities ya muestra el error
    }
  }

  function openCreateWithExplorePlace(payload: ExploreCreatePlanPayload) {
    const activity_date = resolveCreatePlanDate({
      selectedDate,
      tripStartDate: trip?.start_date ?? null,
      activityDays: allDaysWithActivity,
    });
    setEditingActivity({
      title: payload.title,
      place_name: payload.title,
      address: payload.address,
      latitude: payload.latitude,
      longitude: payload.longitude,
      activity_kind: "visit",
      activity_date: activity_date ?? null,
      invite_scope: "all",
    } as TripActivity);
    setIsFormOpen(true);
  }

  function getOrderedItems(date: string, items: TripActivity[]): TripActivity[] {
    const order = localOrder.get(date);
    if (!order) return items;
    const idMap = new Map(items.map((a) => [a.id, a]));
    return [...order.map((id) => idMap.get(id)).filter(Boolean) as TripActivity[], ...items.filter((a) => !order.includes(a.id))];
  }
  function handleDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }
  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    for (const [date, items] of grouped) {
      const ordered = getOrderedItems(date, items);
      const oi = ordered.findIndex((a) => a.id === String(active.id));
      const ni = ordered.findIndex((a) => a.id === String(over.id));
      if (oi === -1 || ni === -1) continue;
      const reordered = arrayMove(ordered, oi, ni);
      setLocalOrder((prev) => new Map(prev).set(date, reordered.map((a) => a.id)));
      void Promise.all(
        reordered.map((activity, index) =>
          fetch(`/api/trip-activities/${activity.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sort_order: index }),
          })
        )
      ).catch(() => {});
      break;
    }
  }

  if (loading) {
    return (
      <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden p-1" aria-busy="true" aria-label="Cargando plan">
        <SkeletonCard rows={2} className="max-w-2xl" />
        <SkeletonCard rows={4} />
        <SkeletonCard rows={3} />
      </div>
    );
  }

  const isEmpty = activities.length === 0;

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {plansAddedNotice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
          <p className="font-semibold">Planes añadidos</p>
          <p className="mt-1 text-emerald-900/90 dark:text-emerald-200/90">{plansAddedNotice}</p>
          <button
            type="button"
            onClick={() => setPlansAddedNotice(null)}
            className="mt-2 text-xs font-semibold text-emerald-800 underline underline-offset-2 dark:text-emerald-300"
          >
            Entendido
          </button>
        </div>
      ) : null}
      {!canManagePlan ? <TripReadOnlyBanner moduleLabel="el plan del viaje" /> : null}

      <div
        role="tablist"
        aria-label="Vista del plan"
        className={`${chipGroup} sm:inline-flex sm:max-w-2xl`}
      >
        <button
          type="button"
          role="tab"
          aria-selected={workspaceTab === "itinerary"}
          onClick={() => setWorkspaceTab("itinerary")}
          className={`${chipItemBase} sm:flex-1 ${workspaceTab === "itinerary" ? chipItemActive : chipItemInactive}`}
        >
          Itinerario
        </button>
        {!hideSocialFeatures ? (
          <button
            type="button"
            role="tab"
            data-tour="plan-attendance-tab"
            aria-selected={workspaceTab === "attendance"}
            onClick={() => setWorkspaceTab("attendance")}
            className={`${chipItemBase} sm:flex-1 ${workspaceTab === "attendance" ? chipItemActive : chipItemInactive}`}
          >
            Asistencia
          </button>
        ) : null}
        <button
          type="button"
          role="tab"
          aria-selected={workspaceTab === "notes"}
          onClick={() => setWorkspaceTab("notes")}
          className={`${chipItemBase} sm:flex-1 ${workspaceTab === "notes" ? chipItemActive : chipItemInactive}`}
        >
          Notas
        </button>
      </div>

      {workspaceTab === "notes" ? (
        <div key="notes" className="step-enter">
          <TripPlanNotesPanel tripId={tripId} initialDescription={initialTripDescription} readOnly={!canEditTripNotes} />
        </div>
      ) : null}

      {!hideSocialFeatures && workspaceTab === "attendance" ? (
        <div key="attendance" className="step-enter">
          <PlanAttendanceSummary
            tripId={tripId}
            activities={activities}
            enabled={workspaceTab === "attendance"}
            currentUserId={currentUserId}
            currentDisplayName={currentDisplayName}
            onActivityClick={(activity) => setDetailActivity(activity)}
          />
        </div>
      ) : null}

      {workspaceTab === "itinerary" && canManagePlan && !showForm && !bulkDeleteMode ? (
        <button
          type="button"
          onClick={() => handleStartCreate()}
          data-tour="plan-add-btn" className="btn-press fixed bottom-[calc(max(env(safe-area-inset-bottom),8px)+84px)] right-[max(1rem,env(safe-area-inset-right))] z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-lg transition hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-light)] md:hidden"
          aria-label="Añadir plan"
          title="Añadir plan"
        >
          <Plus className="h-6 w-6" aria-hidden />
        </button>
      ) : null}

      {workspaceTab === "itinerary" ? (
        <div key="itinerary" className="step-enter min-w-0 max-w-full space-y-6">
          {premiumEnabled && ticketHintCount > 0 && !isEmpty ? (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/40 px-4 py-3 text-sm text-amber-950 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-amber-800">Entradas · Premium</p>
              <p className="mt-1.5 leading-relaxed text-amber-950/95">
                Hay <strong>{ticketHintCount}</strong>{" "}
                {ticketHintCount === 1 ? "actividad marcada" : "actividades marcadas"} como{" "}
                <strong>probables entradas o reservas</strong>. En cada tarjeta usa el botón{" "}
                <span className="font-bold">«Entrada»</span> para abrir una búsqueda orientada a la{" "}
                <strong>web oficial</strong> (verifica siempre la URL y el dominio antes de pagar).
              </p>
            </div>
          ) : null}

          <div data-tour="plan-toolbar" className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{trip?.name || trip?.destination || "Este viaje"}</span>
          {" · "}
          Añade planes con fecha/hora y reutilízalos en el mapa para rutas.
        </p>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {bulkDeleteMode ? (
            <>
              <button
                type="button"
                onClick={selectAllPlans}
                disabled={!selectableActivityIds.length || saving || allSelected}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-900 shadow-sm transition hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50 sm:w-auto"
              >
                Seleccionar todo ({selectableActivityIds.length})
              </button>
              {selectedDate && selectableIdsForSelectedDay.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelectedActivityIds(new Set(selectableIdsForSelectedDay))}
                  disabled={saving}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
                >
                  Solo este día
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSelectedActivityIds(new Set())}
                disabled={saving || selectedActivityIds.size === 0}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
              >
                Quitar selección
              </button>
              <button
                type="button"
                onClick={exitBulkDeleteMode}
                disabled={saving}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
              >
                Cancelar
              </button>
            </>
          ) : null}
          {canManagePlan ? (
          <button
            data-tour="plan-add-btn"
            type="button"
            onClick={() => handleStartCreate()}
            className={`btn-press hidden sm:inline-flex ${btnPrimary} w-full gap-2 sm:w-auto`}
            title="Crear un plan manual"
          >
            <Plus className="h-4 w-4" />
            Añadir plan
          </button>
          ) : null}
          {canManagePlan ? (
          <button data-tour="plan-explore-btn"
            type="button"
            onClick={() => setExploreOpen(true)}
            className={`${btnSecondary} w-full gap-2 sm:w-auto`}
            title="Buscar lugares y crear planes con coordenadas"
          >
            <Compass className="h-4 w-4" />
            Explorar
          </button>
          ) : null}
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] sm:w-auto dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
            data-tour="plan-history-btn" title="Ver historial de cambios"
          >
            <Clock className="h-4 w-4" />
            Historial
          </button>

          {/* PDF export — direct print approach */}
          <button
            type="button"
            onClick={() => {
              // Open popup synchronously (Firefox requires sync open from click handler)
              const popup = window.open("about:blank", "_blank");
              if (!popup) {
                alert("Tu navegador bloqueó la ventana. Permite ventanas emergentes para este sitio.");
                return;
              }
              popup.document.write("<html><body style='font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#64748b'><p>Generando PDF...</p></body></html>");

              // Try GET first (reuse existing token), then POST
              const fetchToken = () =>
                fetch(`/api/trip-shares?tripId=${encodeURIComponent(tripId)}`, { credentials: "include" })
                  .then((r) => r.json())
                  .then((d) => d?.share?.token ?? null)
                  .catch(() => null);

              const createToken = () =>
                fetch("/api/trip-shares", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ tripId }),
                  credentials: "include",
                })
                  .then((r) => r.json())
                  .then((d) => d?.share?.token ?? d?.token ?? null)
                  .catch(() => null);

              void fetchToken().then(async (token) => {
                const finalToken = token ?? (await createToken());
                if (finalToken && popup && !popup.closed) {
                  popup.location.href = `/share/${finalToken}/pdf`;
                } else {
                  if (popup && !popup.closed) popup.close();
                  alert("No se pudo generar el PDF. Comprueba que tienes permisos de compartir el viaje.");
                }
              });
            }}
            className="hidden sm:inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
            data-tour="plan-pdf-btn" title="Exportar itinerario como PDF"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            PDF
          </button>

          {/* Calendar export — desktop with menu */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setCalendarMenuOpen((v) => !v)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
              data-tour="plan-calendar-btn" title="Añadir actividades a tu calendario"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Calendario
            </button>
            {calendarMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setCalendarMenuOpen(false)} />
                <div className="absolute right-0 top-full z-40 mt-1 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-[#1E293B] dark:bg-[#0F1623]">
                  <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    Exportar al calendario
                  </p>
                  {activities.filter((a) => a.activity_date).length > 0 ? (
                    <div className="max-h-52 overflow-y-auto">
                      {activities.filter((a) => a.activity_date).map((a) => {
                        const d = (a.activity_date ?? "").replace(/-/g, "");
                        const t = a.activity_time ? a.activity_time.replace(/:/g, "").slice(0, 6).padEnd(6, "0") : null;
                        const start = t ? `${d}T${t}` : d;
                        const endStr = t
                          ? (() => {
                              const [h, m] = (a.activity_time ?? "09:00").split(":").map(Number);
                              const tot = h * 60 + m + 90;
                              return `${d}T${String(Math.floor(tot / 60) % 24).padStart(2, "0")}${String(tot % 60).padStart(2, "0")}00`;
                            })()
                          : (() => {
                              const nd = new Date(`${a.activity_date}T00:00:00`);
                              nd.setDate(nd.getDate() + 1);
                              return nd.toISOString().slice(0, 10).replace(/-/g, "");
                            })();
                        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(a.title || a.place_name || "Actividad")}&dates=${start}/${endStr}${a.place_name || a.address ? `&location=${encodeURIComponent(a.place_name || a.address || "")}` : ""}`;
                        return (
                          <a key={a.id} href={gcalUrl} target="_blank" rel="noopener noreferrer"
                            onClick={() => setCalendarMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition border-b border-slate-100 dark:border-[#1E293B] last:border-0"
                          >
                            <span className="text-base shrink-0">📅</span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold">{a.title || a.place_name}</p>
                              <p className="text-[10px] text-slate-400">{a.activity_date}{a.activity_time ? ` · ${a.activity_time.slice(0, 5)}` : ""}</p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">No hay actividades con fecha asignada.</p>
                  )}
                  <div className="border-t border-slate-100 dark:border-[#1E293B]">
                    <a href={`/api/trips/${tripId}/calendar`} download
                      onClick={() => setCalendarMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition"
                    >
                      <span className="text-base">⬇️</span>
                      <div>
                        <p className="text-xs font-semibold">Descargar todo (.ics)</p>
                        <p className="text-[10px] text-slate-400">Apple Calendar · Outlook · otros</p>
                      </div>
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
          {bulkDeleteMode ? (
            <button
              type="button"
              disabled={saving || selectedActivityIds.size === 0}
              onClick={() => void confirmBulkDelete()}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-900 shadow-sm transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-50 sm:w-auto"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Eliminar{selectedActivityIds.size > 0 ? ` (${selectedActivityIds.size})` : ""}
            </button>
          ) : canManagePlan ? (
            <button
              type="button"
              onClick={() => enterBulkDeleteMode(false)}
              disabled={!bulkSelectionActivities.length}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-900 shadow-sm transition hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50 sm:w-auto"
              title="Seleccionar varios planes para borrarlos a la vez"
              data-tour="plan-bulk-select-btn"
            >
              <CheckSquare className="h-4 w-4" aria-hidden />
              Seleccionar
            </button>
          ) : null}
        </div>
      </div>

      {bulkDeleteMode ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4 text-sm text-violet-950 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Modo selección</p>
              <p className="mt-1 text-violet-900/90 dark:text-violet-200/90">
                Toca los planes para marcarlos o usa el botón para seleccionar todo el viaje de una vez.
                {selectedActivityIds.size > 0
                  ? ` · ${selectedActivityIds.size} seleccionado${selectedActivityIds.size === 1 ? "" : "s"}`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={allSelected ? () => setSelectedActivityIds(new Set()) : selectAllPlans}
              disabled={!selectableActivityIds.length || saving}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-300 bg-white px-5 py-2.5 text-sm font-bold text-violet-900 shadow-sm transition hover:bg-violet-50 disabled:opacity-50 dark:border-violet-700 dark:bg-[#0F1623] dark:text-violet-100 dark:hover:bg-violet-950/50"
            >
              <CheckSquare className="h-4 w-4" aria-hidden />
              {allSelected ? "Quitar todo" : `Seleccionar todo (${selectableActivityIds.length})`}
            </button>
          </div>
        </div>
      ) : null}

      <TripPlanExploreDrawer
        tripId={tripId}
        open={exploreOpen}
        onClose={() => setExploreOpen(false)}
        onCreatePlan={openCreateWithExplorePlace}
      />

      {historyOpen ? (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-950">Historial de cambios (Plan)</div>
              <div className="mt-1 text-xs text-slate-600">Quién creó/editó/eliminó planes recientemente.</div>
            </div>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="rounded-xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>

          {historyLoading ? (
            <div className="mt-4 text-sm text-slate-600">Cargando historial…</div>
          ) : historyError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {historyError}
            </div>
          ) : history.length ? (
            <div className="mt-4 space-y-2">
              {history.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-[#1E293B] dark:bg-[#080C14] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-950">
                        {item.summary || `${item.action} ${item.entity_type}`}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        {(item.actor_email || "Alguien")} · {new Date(item.created_at).toLocaleString("es-ES")}
                      </div>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {item.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-600">Todavía no hay cambios registrados.</div>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-[#1E293B] dark:bg-[#080C14] px-3 py-2 shadow-sm md:p-4">
          {unseenCount > 0 && (
          <button
            type="button"
            onClick={clearUnseen}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-light)] px-3 py-1 text-xs font-bold text-[var(--brand)] ring-1 ring-[var(--brand-border)] transition hover:bg-[var(--brand-light)] mb-2"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)] animate-pulse" />
            {unseenCount} cambio{unseenCount !== 1 ? "s" : ""} nuevo{unseenCount !== 1 ? "s" : ""}
          </button>
        )}
        <p className="text-[11px] font-semibold leading-tight text-slate-500 md:text-sm dark:text-slate-400">Actividades totales</p>
          <p className="mt-0.5 text-2xl font-bold leading-none text-slate-950 md:mt-2 md:text-3xl">{activities.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-light)] px-3 py-2 shadow-sm md:p-4">
          <p className="text-[11px] font-semibold leading-tight text-[var(--brand-text)] md:text-sm">Alojamientos</p>
          <p className="mt-0.5 text-2xl font-bold leading-none text-[var(--brand-text)] md:mt-2 md:text-3xl">{lodgingCount}</p>
        </div>
      </div>

      {activities.length > 0 ? (
        <button
          type="button"
          onClick={() => setWorkspaceTab("attendance")}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-[var(--brand-border)] hover:bg-[var(--brand-light)]/40 dark:border-[#334155] dark:bg-[#0F1623]"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Users className="h-4 w-4 text-[var(--brand)]" aria-hidden />
            Quién se apunta a cada actividad
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        </button>
      ) : null}

      <div className="space-y-2">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-900 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] sm:w-auto sm:justify-start"
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-700" aria-hidden />
            Filtros
            {filtersOpen ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            )}
          </button>

          <div data-tour="plan-view-toggle" className="inline-flex w-full overflow-hidden rounded-xl border border-slate-200 bg-white sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 px-3 text-xs font-extrabold transition sm:min-h-[36px] sm:flex-none ${
                viewMode === "list"
                  ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                  : "text-slate-700 hover:bg-violet-50"
              }`}
              title="Vista de lista"
            >
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 px-3 text-xs font-extrabold transition sm:min-h-[36px] sm:flex-none ${
                viewMode === "calendar"
                  ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                  : "text-slate-700 hover:bg-violet-50"
              }`}
              data-tour="plan-calendar-mode" title="Vista calendario"
            >
              Calendario
            </button>
          </div>
        </div>

        {filtersOpen ? (
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
                <SlidersHorizontal className="h-4 w-4 text-slate-700" aria-hidden />
                Vista y alojamientos
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowLodging((v) => !v)}
                  className={`inline-flex min-h-[36px] items-center gap-2 rounded-xl border px-3 text-xs font-extrabold transition focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] ${
                    showLodging ? "border-[var(--brand-border)] bg-[var(--brand-light)] text-[var(--brand-text)]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  title="Mostrar/ocultar alojamientos"
                >
                  {showLodging ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Alojamiento
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por título, lugar o dirección…"
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-border)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700">
                  <Filter className="h-4 w-4" />
                  Tipos:
                </div>

                <button
                  type="button"
                  onClick={() => setKindFilter(new Set())}
                  className={`inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold transition focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] ${
                    kindFilter.size === 0 ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  title="Todos los tipos"
                >
                  <CalendarDays className="h-4 w-4" />
                  Todos
                </button>

                {availableKinds.map((k) => {
                  const active = kindFilter.has(k);
                  const meta = kindMeta(k, customByKey);
                  return (
                    <Chip
                      key={k}
                      active={active}
                      onClick={() => {
                        setKindFilter((prev) => {
                          if (prev.has(k) && prev.size === 1) return new Set();
                          return new Set([k]);
                        });
                      }}
                      label={meta.label}
                      glyph={meta.glyph}
                      color={meta.color}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <details className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-slate-950">Tipos personalizados</div>
            <div className="mt-1 text-xs text-slate-600">
              Avanzado: crea categorías reutilizables (emoji/color) para Plan y Rutas.
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <span className="group-open:hidden">Abrir</span>
            <span className="hidden group-open:inline">Cerrar</span>
            <span className="text-slate-400" aria-hidden>
              <span className="group-open:hidden">▾</span>
              <span className="hidden group-open:inline">▴</span>
            </span>
          </span>
        </summary>

        <div className="mt-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="text-xs font-semibold text-slate-600">
              Aquí puedes crear, editar o eliminar tipos. Los verás en filtros, chinchetas y formularios.
            </div>
            <button
              type="button"
              onClick={() => setKindsOpen((v) => !v)}
              className="rounded-xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {kindsOpen ? "Cerrar" : "Gestionar"}
            </button>
          </div>

          {customKindsWarning ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {customKindsWarning}
            </div>
          ) : null}
          {customKindsError ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {customKindsError}
            </div>
          ) : null}

          {kindsOpen ? (
            <div className="mt-4 grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-[#1E293B] dark:bg-[#080C14] p-4">
              <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">Nuevo tipo</div>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <label className="space-y-1 md:col-span-2">
                  <span className="text-xs font-semibold text-slate-700">Nombre</span>
                  <input
                    value={newKind.label}
                    onChange={(e) =>
                      setNewKind((s) => ({
                        ...s,
                        label: e.target.value,
                        key: s.key || normalizeKind(e.target.value).replace(/\s+/g, "_"),
                      }))
                    }
                    className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900"
                    placeholder="Ej. Playa"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Emoji</span>
                  <div className="flex gap-2">
                    <input
                      value={newKind.emoji}
                      onChange={(e) => setNewKind((s) => ({ ...s, emoji: e.target.value }))}
                      className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900"
                      placeholder="🏖️"
                      title="Puedes escribir un emoji o elegir uno de la lista"
                    />
                    <button
                      type="button"
                      onClick={() => setIconPickerOpen((v) => !v)}
                      className="inline-flex min-h-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                      title="Elegir icono"
                    >
                      {iconPickerOpen ? "Cerrar" : "Iconos"}
                    </button>
                  </div>
                  {iconPickerOpen ? (
                    <div className="mt-2 grid grid-cols-7 gap-2 rounded-2xl border border-slate-200 bg-white p-3">
                      {COMMON_KIND_ICONS.map((item) => (
                        <button
                          key={item.emoji}
                          type="button"
                          onClick={() => {
                            setNewKind((s) => ({ ...s, emoji: item.emoji }));
                            setIconPickerOpen(false);
                          }}
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-2xl leading-none transition hover:bg-slate-50 ${
                            newKind.emoji === item.emoji ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-white"
                          }`}
                          title={item.label}
                        >
                          {item.emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Color</span>
                  <input
                    type="color"
                    value={newKind.color || "#64748b"}
                    onChange={(e) => setNewKind((s) => ({ ...s, color: e.target.value }))}
                    className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-2"
                    aria-label="Color del tipo"
                  />
                </label>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={customKindsSaving || !newKind.label.trim()}
                  onClick={() =>
                    void createKind({
                      kind_key: newKind.key || newKind.label,
                      label: newKind.label,
                      emoji: newKind.emoji.trim() || null,
                      color: newKind.color || null,
                    }).then(() => setNewKind({ label: "", key: "", emoji: "", color: "#64748b" }))
                  }
                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-60"
                >
                  {customKindsSaving ? "Guardando…" : "Crear tipo"}
                </button>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">Tipos existentes</div>
              {customKindsLoading ? (
                <div className="text-sm text-slate-600">Cargando tipos…</div>
              ) : customKinds.length ? (
                customKinds.map((k) => (
                  <div key={k.id} className="rounded-2xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-950">
                          {(k.emoji ? `${k.emoji} ` : "") + k.label}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">Clave: {k.kind_key}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={k.color || "#64748b"}
                          onChange={(e) => void updateKind(k.id, { color: e.target.value })}
                          className="h-10 w-12 cursor-pointer rounded-xl border border-slate-200 bg-white px-2"
                          title="Cambiar color"
                          aria-label="Cambiar color"
                          disabled={customKindsSaving}
                        />
                        <input
                          value={k.emoji || ""}
                          onChange={(e) => void updateKind(k.id, { emoji: e.target.value.trim() || null })}
                          className="h-10 w-14 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold"
                          placeholder="😀"
                          title="Emoji"
                          disabled={customKindsSaving}
                        />
                        <button
                          type="button"
                          onClick={() => setEditIconPickerId((prev) => (prev === k.id ? null : k.id))}
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          disabled={customKindsSaving}
                          title="Elegir icono"
                        >
                          Iconos
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteKind(k.id)}
                          className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-extrabold text-rose-800 hover:bg-rose-100 disabled:opacity-60"
                          disabled={customKindsSaving}
                          title="Eliminar tipo"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    {editIconPickerId === k.id ? (
                      <div className="mt-3 grid grid-cols-10 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        {COMMON_KIND_ICONS.map((item) => (
                          <button
                            key={item.emoji}
                            type="button"
                            onClick={() => {
                              void updateKind(k.id, { emoji: item.emoji });
                              setEditIconPickerId(null);
                            }}
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-2xl leading-none transition hover:bg-white ${
                              (k.emoji || "") === item.emoji ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-white"
                            }`}
                            title={item.label}
                            disabled={customKindsSaving}
                          >
                            {item.emoji}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
                  Todavía no has creado tipos personalizados.
                </div>
              )}
            </div>
          </div>
          ) : null}
        </div>
      </details>

      {canManagePlan && showForm ? (
        <div ref={formAnchorRef} className="scroll-mt-24">
          <PlanForm
          saving={saving}
          initialData={editingActivity}
          onCancelEdit={handleCancelEditOrClose}
          onSubmit={handleSubmit}
          premiumEnabled={premiumEnabled}
          availableKinds={kindsForSelect}
          tripParticipants={tripParticipants}
          currentParticipantId={currentParticipantId}
          />
        </div>
      ) : null}

      {viewMode === "calendar" ? (
        <div data-tour="plan-calendar-grid">
        <TripPlanCalendar
          activities={filtered}
          selectedDate={selectedDate}
          onSelectDate={(d) => {
            setSelectedDate(d);
          }}
        />
        </div>
      ) : null}

      <div className="max-w-full overflow-x-hidden" data-tour="plan-day-sections">
        <PlanItineraryCard
          destination={trip?.destination}
          tripName={trip?.name || "Viaje"}
          participants={participants}
          days={allDaysWithActivity}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          tripId={tripId}
          canManagePlan={canManagePlan}
          onAddPlan={canManagePlan ? handleStartCreate : undefined}
          hideExpenseFooter={isAgencyTrip}
          expenseFooter={isAgencyTrip ? undefined : <PlanExpenseFooter tripId={tripId} />}
          aiSuggest={
            <PlanAiSuggestBadge
              tripId={tripId}
              premiumEnabled={premiumEnabled}
              isAgencyTrip={isAgencyTrip}
              tripName={trip?.name}
              selectedDate={selectedDate}
              appearance="header"
            />
          }
        >
          {cardGrouped.length === 0 ? (
            selectedDate ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">📭</div>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">Sin actividades este día</p>
                <p className="mt-1 text-sm text-slate-500">Añade una actividad para este día o prueba otra fecha.</p>
                {canManagePlan && !showForm ? (
                  <button
                    type="button"
                    onClick={() => handleStartCreate()}
                    className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-hover)]"
                  >
                    <Plus className="h-4 w-4" />
                    Añadir plan este día
                  </button>
                ) : null}
              </div>
            ) : isEmpty ? (
              <div className="py-6 text-center sm:py-8">
                {isAgencyTrip && canManagePlan ? (
                  <div className="mx-auto mb-6 max-w-lg text-left">
                    <PlanDocumentImportPanel tripId={tripId} isPremium={premiumEnabled} compact />
                  </div>
                ) : (
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-light)] text-3xl shadow-sm">
                    🗺️
                  </div>
                )}
                <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {isAgencyTrip ? "Monta el programa del viaje" : "Empieza a planificar"}
                </p>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 leading-relaxed">
                  {isAgencyTrip
                    ? "Importa el dossier de la agencia arriba o añade paradas a mano. Cada actividad llevará horario, ubicación y tipo."
                    : "Añade actividades manualmente, explora lugares en el mapa, o genera el plan completo con la IA."}
                </p>
                {canManagePlan ? (
                  <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={() => handleStartCreate()}
                      className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                      Añadir actividad
                    </button>
                    <button
                      type="button"
                      onClick={() => setExploreOpen(true)}
                      className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-light)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-text)]"
                    >
                      <Compass className="h-4 w-4" />
                      Explorar lugares
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="py-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">🔍</div>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">Sin resultados</p>
                <p className="mt-1 text-sm text-slate-500">Prueba a quitar filtros o cambiar la búsqueda.</p>
              </div>
            )
          ) : (
            <div className={bulkDeleteMode ? "space-y-6 pb-24 md:pb-0" : "space-y-6"}>
              {cardGrouped.map(([date, items], sectionIndex) => {
                if (!date) return null;
                const ordered = getOrderedItems(date, items);
                const enableDrag = canManagePlan && !bulkDeleteMode && ordered.length > 1;
                const daySelectableIds = ordered.filter(canBulkDeletePlanActivity).map((a) => a.id);
                const daySelectedCount = daySelectableIds.filter((id) => selectedActivityIds.has(id)).length;
                const dayAllSelected =
                  daySelectableIds.length > 0 && daySelectedCount === daySelectableIds.length;
                const heading = formatPlanDayHeading(date);

                const rows = ordered.map((activity, rowIndex) => {
                  const isLodging = isLodgingPlanActivity(activity);
                  const bulkSelectable = canManagePlan && bulkDeleteMode && canBulkDeletePlanActivity(activity);
                  const bulkSelected = selectedActivityIds.has(activity.id);

                  const row = (
                    <div key={activity.id} className="motion-stagger-item">
                      <PlanActivityRow
                        dataTour={sectionIndex === 0 && rowIndex === 0 ? "plan-activity-card" : undefined}
                        title={activity.title || activity.place_name || "Actividad"}
                        place={activity.place_name || activity.address}
                        time={activity.activity_time}
                        activityKind={isLodging ? "lodging" : activity.activity_kind}
                        isLodging={isLodging}
                        customByKey={customByKey}
                        selectable={bulkSelectable}
                        selected={bulkSelected}
                        onClick={
                          bulkSelectable
                            ? () => toggleActivitySelection(activity.id)
                            : () => setDetailActivity(activity)
                        }
                      />
                    </div>
                  );

                  if (enableDrag) {
                    const meta = kindMeta(isLodging ? "lodging" : activity.activity_kind, customByKey);
                    return (
                      <SortableRow key={activity.id} id={activity.id} color={meta.color}>
                        {row}
                      </SortableRow>
                    );
                  }
                  return row;
                });

                const listBody = (
                  <div
                    key={`${date}-${selectedDate ?? "all"}`}
                    className="motion-stagger-list space-y-2 overflow-x-hidden pl-7 pr-0.5"
                  >
                    {rows}
                  </div>
                );

                return (
                  <div key={date} className="space-y-2">
                    {bulkDeleteMode && cardGrouped.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => toggleDaySelection(daySelectableIds)}
                        disabled={!daySelectableIds.length}
                        className="flex w-full items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/80 px-3 py-2.5 text-left transition hover:bg-violet-100/80 disabled:opacity-50 dark:border-violet-900/30 dark:bg-violet-950/20 dark:hover:bg-violet-950/40"
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                            dayAllSelected
                              ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                              : daySelectedCount > 0
                                ? "border-[var(--brand)] bg-white text-[var(--brand)]"
                                : "border-slate-300 bg-white text-transparent"
                          }`}
                          aria-hidden
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                            {heading.weekday ? `${heading.weekday} ${heading.dayNum}` : heading.full}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {heading.month} · {activityCountLabel(daySelectableIds.length)}
                          </span>
                        </span>
                        {daySelectableIds.length > 0 ? (
                          <span className="shrink-0 text-[11px] font-bold tabular-nums text-violet-700 dark:text-violet-300">
                            {daySelectedCount}/{daySelectableIds.length}
                          </span>
                        ) : null}
                      </button>
                    ) : null}
                    {enableDrag ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={ordered.map((a) => a.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {listBody}
                        </SortableContext>
                      </DndContext>
                    ) : (
                      listBody
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </PlanItineraryCard>
      </div>

      <PlanActivityDetailSheet
        activity={detailActivity}
        onClose={() => setDetailActivity(null)}
        premiumEnabled={premiumEnabled}
        tripId={tripId}
        currentUserId={currentUserId}
        currentDisplayName={currentDisplayName}
        canManagePlan={canManagePlan}
        onEdit={(activity) => {
          setDetailActivity(null);
          handleStartEdit(activity);
        }}
        onDelete={(activity) => {
          setDetailActivity(null);
          void deleteActivity(activity.id);
        }}
      />

      {bulkDeleteMode && canManagePlan ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:hidden dark:border-[#1E293B] dark:bg-[#0F1623]/95">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exitBulkDeleteMode}
              disabled={saving}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving || selectedActivityIds.size === 0}
              onClick={() => void confirmBulkDelete()}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-900 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Eliminar ({selectedActivityIds.size})
            </button>
          </div>
        </div>
      ) : null}
        </div>
      ) : null}
    </div>
  );
}
