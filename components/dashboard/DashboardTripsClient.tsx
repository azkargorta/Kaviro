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
import { DashboardAnnouncementUnreadProvider } from "@/components/dashboard/DashboardAnnouncementUnreadContext";
import { openCreateTripForm } from "@/lib/open-create-trip";
import { tripTimelineProgress } from "@/lib/trip-timeline-progress";
import { useRouter } from "next/navigation";

type Trip = DashboardTrip;
type FavoriteTrip = Trip & { badge: string; accent: string; is_favorite: true };
type TripWithMeta = Trip & { badge: string; accent: string };
type Filter = "all" | "upcoming" | "past" | "favorites" | "expenses";
type ViewMode = "grid" | "list";

const ACCENT_CURRENT = DASHBOARD_TRIP_BADGE_ACCENTS.current;
const ACCENT_FUTURE = DASHBOARD_TRIP_BADGE_ACCENTS.future;
const ACCENT_PAST = DASHBOARD_TRIP_BADGE_ACCENTS.past;
const ACCENT_UNSCHED = DASHBOARD_TRIP_BADGE_ACCENTS.unscheduled;

// ── Empty state ───────────────────────────────────────────────────────────────

function DashboardEmptyState() {
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl dark:bg-[#1E293B]">
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

  return (
    <div
      className={`group flex min-h-[52px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:-translate-y-px hover:border-slate-300 hover:shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] dark:hover:border-slate-600 ${locked ? "opacity-80" : "cursor-pointer"}`}
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
      {isActive && progress !== null ? (
        <div
          className="h-8 w-1.5 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1E293B]"
          aria-hidden
        >
          <div
            className="w-full rounded-full bg-[var(--brand)] transition-[height] duration-500"
            style={{ height: `${progress}%` }}
          />
        </div>
      ) : (
        <div className="h-8 w-1.5 shrink-0 rounded-full bg-slate-100 dark:bg-[#1E293B]" aria-hidden />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{trip.name}</p>
        {trip.destination ? (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{trip.destination}</p>
        ) : null}
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Calendar className="h-3 w-3" aria-hidden />
          {dateLabel}
        </span>
      </div>

      <TripStatusBadge badge={badge} className="hidden shrink-0 sm:inline-flex" />

      <span className="shrink-0 text-slate-400 transition group-hover:text-[var(--brand)] dark:text-slate-500">
        <ArrowRight className="h-4 w-4" aria-hidden />
      </span>
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
    <div className="space-y-1.5">
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
  trips,
  lockedTripIds,
  viewMode,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  trips: TripWithMeta[];
  lockedTripIds: string[];
  viewMode: ViewMode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!trips.length) return null;

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        className={`flex w-full items-center justify-between gap-2 text-left ${collapsible ? "cursor-pointer" : "cursor-default"}`}
        onClick={() => collapsible && setOpen((v) => !v)}
        aria-expanded={collapsible ? open : undefined}
        disabled={!collapsible}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
          <span className="ml-2 text-[10px] font-bold text-slate-400">{trips.length}</span>
        </span>
        {collapsible ? (
          open ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
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
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const travelCount = current.length + future.length + past.length + unscheduled.length;
  const totalTrips = travelCount + (showExpenseGroupsSection ? expenseGroups.length : 0);

  const allWithMeta = useMemo<TripWithMeta[]>(
    () => [
      ...current.map((t) => ({ ...t, badge: "En curso", accent: ACCENT_CURRENT })),
      ...future.map((t) => ({ ...t, badge: "Próximo", accent: ACCENT_FUTURE })),
      ...past.map((t) => ({ ...t, badge: "Finalizado", accent: ACCENT_PAST })),
      ...unscheduled.map((t) => ({ ...t, badge: "Pendiente", accent: ACCENT_UNSCHED })),
      ...(showExpenseGroupsSection
        ? expenseGroups.map((t) => ({
            ...t,
            badge: "Grupo de gastos",
            accent: DASHBOARD_TRIP_BADGE_ACCENTS.expenseGroup,
          }))
        : []),
    ],
    [current, future, past, unscheduled, expenseGroups, showExpenseGroupsSection]
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
    if (filter === "expenses") return allWithMeta.filter((t) => isExpenseGroupTrip(t));
    if (filter === "favorites") return allWithMeta.filter((t) => favoriteIds.has(t.id));
    if (filter === "upcoming")
      return excludeHero(
        allWithMeta.filter(
          (t) =>
            !isExpenseGroupTrip(t) &&
            (future.some((f) => f.id === t.id) || unscheduled.some((u) => u.id === t.id))
        )
      );
    if (filter === "past")
      return excludeHero(
        allWithMeta.filter((t) => !isExpenseGroupTrip(t) && past.some((p) => p.id === t.id))
      );
    return excludeHero(allWithMeta);
  }, [filter, allWithMeta, favoriteIds, future, unscheduled, past, excludeHero]);

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
    { key: "all", label: "Todos", count: totalTrips },
    { key: "upcoming", label: "Próximos", count: future.length + unscheduled.length },
    { key: "past", label: "Pasados", count: past.length },
  ];
  if (favoriteTrips.length > 0)
    tabs.push({ key: "favorites", label: "Favoritos", count: favoriteTrips.length });
  if (showExpenseGroupsSection && expenseGroups.length > 0)
    tabs.push({ key: "expenses", label: "Gastos", count: expenseGroups.length });

  const viewToggleClass = (active: boolean) =>
    `inline-flex h-7 w-7 items-center justify-center rounded-lg transition ${
      active
        ? "bg-white text-slate-900 shadow-sm dark:bg-[#1E293B] dark:text-white"
        : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
    }`;

  return (
    <DashboardAnnouncementUnreadProvider unreadByTripId={announcementUnreadByTripId}>
      <div className="space-y-5">

        {/* Chips de favoritos */}
        <DashboardFavoriteChips
          trips={favoriteTrips}
          onSelectFilter={() => setFilter("favorites")}
        />

        {/* Toolbar: búsqueda + tabs + toggle vista */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Búsqueda */}
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar viaje o destino…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-border)] dark:border-slate-700 dark:bg-[#0f1623] dark:text-slate-100"
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
          <div className="flex items-center gap-2">
            <div
              className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-[#0F1623]"
              role="tablist"
              aria-label="Filtrar viajes"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    filter === tab.key
                      ? "bg-white text-slate-900 shadow-sm dark:bg-[#1E293B] dark:text-white"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                  <span className="text-[10px] font-bold text-slate-400">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Toggle grid / lista */}
            <div className="inline-flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-[#0F1623]">
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
        {totalTrips === 0 ? (
          <DashboardEmptyState />
        ) : results.length === 0 && isSearching ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sin resultados</p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-3 text-xs font-semibold text-[var(--brand)] hover:underline"
            >
              Borrar búsqueda
            </button>
          </div>
        ) : showSections ? (
          <div className="space-y-8">
            <SectionBlock
              title="En curso"
              trips={sectionCurrent}
              lockedTripIds={lockedTripIds}
              viewMode={viewMode}
            />
            <SectionBlock
              title="Próximamente"
              trips={[...sectionFuture, ...sectionUnsched]}
              lockedTripIds={lockedTripIds}
              viewMode={viewMode}
            />
            <SectionBlock
              title="Pasados"
              trips={sectionPast}
              lockedTripIds={lockedTripIds}
              viewMode={viewMode}
              collapsible={sectionPast.length > 4}
              defaultOpen={sectionPast.length <= 4}
            />
            {showExpenseGroupsSection && sectionExpenses.length > 0 ? (
              <SectionBlock
                title="Gastos compartidos"
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

        {/* Pie: CTA discretos */}
        {totalTrips > 0 && !isSearching ? (
          <p className="text-center text-xs text-slate-400">
            ¿Nuevo destino?{" "}
            <button
              type="button"
              onClick={() => openCreateTripForm()}
              className="font-semibold text-[var(--brand)] hover:underline"
            >
              Crear viaje
            </button>
            {" · "}
            <Link
              href="/trips/new/planner"
              className="font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Planificar con IA
              <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          </p>
        ) : null}
      </div>
    </DashboardAnnouncementUnreadProvider>
  );
}
