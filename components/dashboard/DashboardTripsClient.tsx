"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import TripCardItem from "@/components/dashboard/TripCardItem";
import TripStatusBadge from "@/components/dashboard/TripStatusBadge";
import DashboardFavoriteChips from "@/components/dashboard/DashboardFavoriteChips";
import {
  DASHBOARD_TRIP_BADGE_ACCENTS,
  isExpenseGroupTrip,
  type DashboardTrip,
} from "@/lib/dashboard-trip-types";
import {
  DASHBOARD_CARD,
  DASHBOARD_CARD_HOVER,
  DASHBOARD_FILTER_SHELL,
  DASHBOARD_SECTION_EYEBROW,
} from "@/components/dashboard/dashboard-ui";
import { DashboardAnnouncementUnreadProvider } from "@/components/dashboard/DashboardAnnouncementUnreadContext";
import { openCreateTripForm } from "@/lib/open-create-trip";
import { tripTimelineProgress } from "@/lib/trip-timeline-progress";
import { useRouter } from "next/navigation";

type Trip = DashboardTrip;
type FavoriteTrip = Trip & { badge: string; accent: string; is_favorite: true };
type TripWithMeta = Trip & { badge: string; accent: string };
type Filter = "all" | "current" | "upcoming" | "past" | "favorites" | "expenses";
type ViewMode = "grid" | "list";

const ACCENT_CURRENT = DASHBOARD_TRIP_BADGE_ACCENTS.current;
const ACCENT_FUTURE = DASHBOARD_TRIP_BADGE_ACCENTS.future;
const ACCENT_PAST = DASHBOARD_TRIP_BADGE_ACCENTS.past;
const ACCENT_UNSCHED = DASHBOARD_TRIP_BADGE_ACCENTS.unscheduled;

// ── Empty state ───────────────────────────────────────────────────────────────

function DashboardEmptyState() {
  return (
    <div className={`mx-auto max-w-lg py-12 text-center ${DASHBOARD_CARD} px-6`}>
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-light)] text-3xl ring-1 ring-[var(--brand-border)]">
        ✈️
      </div>
      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        Tu primer viaje te está esperando
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Organiza plan, gastos y rutas en un solo lugar.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => openCreateTripForm()}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-hover)]"
        >
          <MapPin className="h-4 w-4" aria-hidden />
          Crear mi primer viaje
        </button>
        <Link
          href="/trips/new/planner"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-200"
        >
          <Sparkles className="h-4 w-4 text-[var(--brand)]" aria-hidden />
          Planificar con IA
        </Link>
      </div>
    </div>
  );
}

function listRowAccent(badge: string) {
  if (badge === "En curso") return "border-l-[4px] border-l-[var(--brand)]";
  if (badge === "Próximo") return "border-l-[4px] border-l-sky-300 dark:border-l-sky-600/70";
  if (badge === "Finalizado") return "border-l-[4px] border-l-slate-300 dark:border-l-slate-600";
  if (badge === "Pendiente") return "border-l-[4px] border-l-amber-300 dark:border-l-amber-700/55";
  return "border-l-[4px] border-l-slate-200/90 dark:border-l-slate-700";
}

function listCountdown(badge: string, startDate: string | null): string | null {
  if (badge !== "Próximo" || !startDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${startDate}T00:00:00`);
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return null;
  if (diff === 1) return "Empieza mañana";
  return `En ${diff} días`;
}

// ── Fila lista densa ──────────────────────────────────────────────────────────

function TripListRow({
  trip,
  badge,
  locked,
}: {
  trip: Trip;
  badge: string;
  locked: boolean;
}) {
  const router = useRouter();
  const isExpenseGroup = isExpenseGroupTrip(trip);
  const progress = tripTimelineProgress(trip.start_date, trip.end_date);
  const isActive = badge === "En curso";

  function fmt(v: string) {
    return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(
      new Date(`${v}T00:00:00`)
    );
  }
  const dateLabel =
    trip.start_date && trip.end_date
      ? `${fmt(trip.start_date)} – ${fmt(trip.end_date)}`
      : trip.start_date
        ? fmt(trip.start_date)
        : "Sin fechas";

  const destMark = trip.destination?.trim().charAt(0).toUpperCase();
  const countdown = listCountdown(badge, trip.start_date);

  return (
    <div
      className={`group grid min-h-[64px] grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 ${DASHBOARD_CARD} ${DASHBOARD_CARD_HOVER} px-3.5 py-3 lg:grid-cols-[40px_minmax(0,1fr)_minmax(130px,1fr)_auto_92px] lg:gap-x-4 lg:py-3.5 ${listRowAccent(badge)} ${locked ? "opacity-80" : "cursor-pointer"}`}
      onClick={() => {
        if (locked) return;
        router.push(
          isExpenseGroup
            ? `/trip/${encodeURIComponent(trip.id)}/summary`
            : `/trip/${encodeURIComponent(trip.id)}`
        );
      }}
      role={locked ? undefined : "button"}
      tabIndex={locked ? -1 : 0}
      onKeyDown={(e) => {
        if (locked) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(
            isExpenseGroup
              ? `/trip/${encodeURIComponent(trip.id)}/summary`
              : `/trip/${encodeURIComponent(trip.id)}`
          );
        }
      }}
    >
      {destMark && !isExpenseGroup ? (
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            isActive
              ? "bg-[var(--brand-light)] text-[var(--brand)] ring-1 ring-[var(--brand-border)]"
              : "bg-slate-50 text-slate-600 ring-1 ring-slate-200/80 dark:bg-[#141c2b] dark:text-slate-300"
          }`}
          aria-hidden
        >
          {destMark}
        </div>
      ) : null}

      <div className="min-w-0 flex-1 lg:col-span-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">{trip.name}</p>
          <TripStatusBadge badge={badge} className="lg:hidden" />
        </div>
        {trip.destination ? (
          <p className="flex items-center gap-1 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
            <MapPin className="h-3 w-3 shrink-0 text-[var(--brand)]" aria-hidden />
            {trip.destination}
          </p>
        ) : null}
        {countdown ? (
          <p className="mt-0.5 text-[10px] font-bold text-sky-600/90 dark:text-sky-400/90">{countdown}</p>
        ) : null}
      </div>

      <div className="hidden min-w-0 flex-col justify-center lg:flex">
        <span className="flex items-center gap-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
          <Calendar className="h-3 w-3 shrink-0" aria-hidden />
          {dateLabel}
        </span>
        {isActive && progress !== null ? (
          <div className="mt-1.5 max-w-[160px]">
            <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1E293B]">
              <div
                className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      <TripStatusBadge badge={badge} className="hidden shrink-0 lg:inline-flex" />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (locked) return;
          router.push(
            isExpenseGroup
              ? `/trip/${encodeURIComponent(trip.id)}/summary`
              : `/trip/${encodeURIComponent(trip.id)}`
          );
        }}
        disabled={locked}
        className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
          isActive && !locked
            ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
            : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
        }`}
      >
        Abrir
        <ArrowRight className="h-3 w-3" aria-hidden />
      </button>
    </div>
  );
}

// ── Grids y listas ────────────────────────────────────────────────────────────

function TripGrid({
  trips,
  lockedTripIds,
}: {
  trips: TripWithMeta[];
  lockedTripIds: string[];
}) {
  if (!trips.length) return null;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {trips.map((trip) => (
        <TripCardItem
          key={trip.id}
          trip={trip}
          badge={trip.badge}
          accent={trip.accent}
          locked={lockedTripIds.includes(String(trip.id))}
        />
      ))}
    </div>
  );
}

function TripListView({
  trips,
  lockedTripIds,
}: {
  trips: TripWithMeta[];
  lockedTripIds: string[];
}) {
  if (!trips.length) return null;
  return (
    <div className="space-y-2.5">
      {trips.map((trip) => (
        <TripListRow
          key={trip.id}
          trip={trip}
          badge={trip.badge}
          locked={lockedTripIds.includes(String(trip.id))}
        />
      ))}
    </div>
  );
}

// ── Sección con título colapsable (para "Pasados") ────────────────────────────

function SectionBlock({
  title,
  subtitle,
  trips,
  lockedTripIds,
  viewMode,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  subtitle?: string;
  trips: TripWithMeta[];
  lockedTripIds: string[];
  viewMode: ViewMode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!trips.length) return null;

  return (
    <div className="space-y-3">
      <button
        type="button"
        className={`flex w-full items-start justify-between gap-2 text-left ${collapsible ? "cursor-pointer" : "cursor-default"}`}
        onClick={() => collapsible && setOpen((v) => !v)}
        aria-expanded={collapsible ? open : undefined}
        disabled={!collapsible}
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`${DASHBOARD_SECTION_EYEBROW} flex items-center gap-2`}>
              <span className="h-1 w-5 rounded-full bg-[var(--brand)]" aria-hidden />
              {title}
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm ring-1 ring-slate-200/80 dark:bg-[#141c2b] dark:text-slate-300 dark:ring-slate-700">
              {trips.length}
            </span>
          </span>
          {subtitle ? (
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>
          ) : null}
        </span>
        {collapsible ? (
          open ? (
            <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          ) : (
            <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          )
        ) : null}
      </button>
      {open ? (
        viewMode === "list" ? (
          <TripListView trips={trips} lockedTripIds={lockedTripIds} />
        ) : (
          <TripGrid trips={trips} lockedTripIds={lockedTripIds} />
        )
      ) : null}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function DashboardTripsClient({
  current,
  future,
  past,
  unscheduled,
  expenseGroups,
  showExpenseGroupsSection = true,
  favoriteTrips,
  lockedTripIds,
  announcementUnreadByTripId = {},
  heroTripId = null,
  recentTrips = [],
}: {
  current: Trip[];
  future: Trip[];
  past: Trip[];
  unscheduled: Trip[];
  expenseGroups: Trip[];
  showExpenseGroupsSection?: boolean;
  favoriteTrips: FavoriteTrip[];
  lockedTripIds: string[];
  announcementUnreadByTripId?: Record<string, number>;
  heroTripId?: string | null;
  recentTrips?: Pick<Trip, "id" | "name" | "destination">[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const travelCount = current.length + future.length + past.length + unscheduled.length;

  const travelWithMeta = useMemo<TripWithMeta[]>(
    () => [
      ...current.map((t) => ({ ...t, badge: "En curso", accent: ACCENT_CURRENT })),
      ...future.map((t) => ({ ...t, badge: "Próximo", accent: ACCENT_FUTURE })),
      ...past.map((t) => ({ ...t, badge: "Finalizado", accent: ACCENT_PAST })),
      ...unscheduled.map((t) => ({ ...t, badge: "Pendiente", accent: ACCENT_UNSCHED })),
    ],
    [current, future, past, unscheduled]
  );

  const expenseWithMeta = useMemo<TripWithMeta[]>(
    () =>
      showExpenseGroupsSection
        ? expenseGroups.map((t) => ({
            ...t,
            badge: "Grupo de gastos",
            accent: DASHBOARD_TRIP_BADGE_ACCENTS.expenseGroup,
          }))
        : [],
    [expenseGroups, showExpenseGroupsSection]
  );

  const allWithMeta = useMemo<TripWithMeta[]>(
    () => [...travelWithMeta, ...expenseWithMeta],
    [travelWithMeta, expenseWithMeta]
  );

  const matchesQuery = useCallback(
    (trip: Trip) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        trip.name.toLowerCase().includes(q) ||
        (trip.destination?.toLowerCase().includes(q) ?? false)
      );
    },
    [query]
  );

  const favoriteIds = useMemo(() => new Set(favoriteTrips.map((t) => t.id)), [favoriteTrips]);

  // excluir el viaje ya mostrado en el Hero cuando se muestra en secciones
  const excludeHero = useCallback(
    (list: TripWithMeta[]) =>
      heroTripId && filter === "all" && !query.trim()
        ? list.filter((t) => t.id !== heroTripId)
        : list,
    [heroTripId, filter, query]
  );

  const pool: TripWithMeta[] = useMemo(() => {
    if (filter === "expenses") return expenseWithMeta;
    if (filter === "favorites") return allWithMeta.filter((t) => favoriteIds.has(t.id));
    if (filter === "current")
      return excludeHero(travelWithMeta.filter((t) => current.some((c) => c.id === t.id)));
    if (filter === "upcoming")
      return excludeHero(
        travelWithMeta.filter(
          (t) => future.some((f) => f.id === t.id) || unscheduled.some((u) => u.id === t.id)
        )
      );
    if (filter === "past")
      return excludeHero(travelWithMeta.filter((t) => past.some((p) => p.id === t.id)));
    return excludeHero(travelWithMeta);
  }, [
    filter,
    allWithMeta,
    travelWithMeta,
    expenseWithMeta,
    favoriteIds,
    future,
    unscheduled,
    past,
    current,
    excludeHero,
  ]);

  const results = pool.filter(matchesQuery);
  const isSearching = query.trim() !== "";

  // secciones individuales (solo en vista "all" sin búsqueda)
  const sectionCurrent = excludeHero(
    current.map((t) => ({ ...t, badge: "En curso", accent: ACCENT_CURRENT }))
  ).filter(matchesQuery);
  const sectionFuture = excludeHero(
    future.map((t) => ({ ...t, badge: "Próximo", accent: ACCENT_FUTURE }))
  ).filter(matchesQuery);
  const sectionUnsched = excludeHero(
    unscheduled.map((t) => ({ ...t, badge: "Pendiente", accent: ACCENT_UNSCHED }))
  ).filter(matchesQuery);
  const sectionPast = excludeHero(
    past.map((t) => ({ ...t, badge: "Finalizado", accent: ACCENT_PAST }))
  ).filter(matchesQuery);
  const sectionExpenses = expenseGroups
    .map((t) => ({
      ...t,
      badge: "Grupo de gastos",
      accent: DASHBOARD_TRIP_BADGE_ACCENTS.expenseGroup,
    }))
    .filter(matchesQuery);

  const showSections = filter === "all" && !isSearching;

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Todos", count: travelCount },
    { key: "current", label: "En curso", count: current.length },
    { key: "upcoming", label: "Próximos", count: future.length + unscheduled.length },
    { key: "past", label: "Pasados", count: past.length },
  ];
  if (favoriteTrips.length > 0)
    tabs.push({ key: "favorites", label: "Favoritos", count: favoriteTrips.length });
  if (showExpenseGroupsSection && expenseGroups.length > 0)
    tabs.push({ key: "expenses", label: "Gastos", count: expenseGroups.length });

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-[13px] ${
      active
        ? "bg-[var(--brand-light)] text-[var(--brand-text)] shadow-sm ring-1 ring-[var(--brand-border)]"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#141c2b] dark:hover:text-slate-200"
    }`;

  const viewToggleClass = (active: boolean) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
      active
        ? "bg-[var(--brand-light)] text-[var(--brand)] ring-1 ring-[var(--brand-border)]"
        : "text-slate-500 hover:bg-white hover:text-slate-700 dark:text-slate-400 dark:hover:bg-[#141c2b]"
    }`;

  return (
    <DashboardAnnouncementUnreadProvider unreadByTripId={announcementUnreadByTripId}>
      <div className="space-y-5">

        {/* Chips de favoritos */}
        <DashboardFavoriteChips
          trips={favoriteTrips}
          recentTrips={recentTrips}
          onSelectFilter={() => setFilter("favorites")}
        />

        {/* Toolbar: búsqueda + tabs + toggle vista */}
        <div className={`${DASHBOARD_CARD} space-y-3 p-3 sm:p-4`}>
        <div className="flex items-center justify-between gap-2">
          <p className={DASHBOARD_SECTION_EYEBROW}>Tu biblioteca</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Búsqueda */}
          <div className="relative min-w-0 flex-1 lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar viaje o destino…"
              className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[var(--brand-border)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-light)] dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-100"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600"
                aria-label="Borrar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* Tabs + toggle vista */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={DASHBOARD_FILTER_SHELL} role="tablist" aria-label="Filtrar viajes">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={tabClass(filter === tab.key)}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] font-semibold tabular-nums ${
                      filter === tab.key ? "text-[var(--brand)]" : "text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Toggle grid / lista */}
            <div className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200/90 bg-white p-1 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
              <button
                type="button"
                aria-label="Vista en cuadrícula"
                onClick={() => setViewMode("grid")}
                className={viewToggleClass(viewMode === "grid")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Vista en lista"
                onClick={() => setViewMode("list")}
                className={viewToggleClass(viewMode === "list")}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Contador búsqueda */}
        {isSearching && (
          <p className="text-xs text-slate-500">
            {results.length === 0
              ? "Sin resultados"
              : `${results.length} resultado${results.length !== 1 ? "s" : ""}`}{" "}
            para{" "}
            <strong className="text-slate-700 dark:text-slate-200">
              &ldquo;{query.trim()}&rdquo;
            </strong>
          </p>
        )}

        {/* Contenido principal */}
        {travelCount === 0 && expenseWithMeta.length === 0 ? (
          <DashboardEmptyState />
        ) : results.length === 0 && (isSearching || filter !== "all") ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sin resultados</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              className="mt-3 text-xs font-semibold text-slate-600 hover:underline dark:text-slate-400"
            >
              {isSearching ? "Borrar búsqueda" : "Ver todos los viajes"}
            </button>
          </div>
        ) : showSections ? (
          <div className="space-y-10">
            <SectionBlock
              title="En curso"
              subtitle="Viajes que están ocurriendo ahora"
              trips={sectionCurrent}
              lockedTripIds={lockedTripIds}
              viewMode={viewMode}
            />
            <SectionBlock
              title="Próximamente"
              subtitle="Tus próximos planes"
              trips={[...sectionFuture, ...sectionUnsched]}
              lockedTripIds={lockedTripIds}
              viewMode={viewMode}
            />
            <SectionBlock
              title="Pasados"
              subtitle="Recuerdos y viajes anteriores"
              trips={sectionPast}
              lockedTripIds={lockedTripIds}
              viewMode={viewMode}
              collapsible={sectionPast.length > 4}
              defaultOpen={sectionPast.length <= 4}
            />
            {showExpenseGroupsSection && sectionExpenses.length > 0 ? (
              <SectionBlock
                title="Gastos compartidos"
                subtitle="Grupos para liquidar gastos en equipo"
                trips={sectionExpenses}
                lockedTripIds={lockedTripIds}
                viewMode={viewMode}
              />
            ) : null}
          </div>
        ) : viewMode === "list" ? (
          <TripListView trips={results} lockedTripIds={lockedTripIds} />
        ) : (
          <TripGrid trips={results} lockedTripIds={lockedTripIds} />
        )}

      </div>
    </DashboardAnnouncementUnreadProvider>
  );
}
