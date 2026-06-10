"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MapPin, Sparkles, ArrowRight, Search, X } from "lucide-react";
import TripCardItem from "@/components/dashboard/TripCardItem";
import DashboardFavoriteChips from "@/components/dashboard/DashboardFavoriteChips";
import { DASHBOARD_TRIP_BADGE_ACCENTS, isExpenseGroupTrip, type DashboardTrip } from "@/lib/dashboard-trip-types";
import { DashboardAnnouncementUnreadProvider } from "@/components/dashboard/DashboardAnnouncementUnreadContext";
import { openCreateTripForm } from "@/lib/open-create-trip";

type Trip = DashboardTrip;

type FavoriteTrip = Trip & {
  badge: string;
  accent: string;
  is_favorite: true;
};

type Filter = "all" | "upcoming" | "past" | "favorites" | "expenses";

type TripWithMeta = Trip & { badge: string; accent: string };

const ACCENT_CURRENT = DASHBOARD_TRIP_BADGE_ACCENTS.current;
const ACCENT_FUTURE = DASHBOARD_TRIP_BADGE_ACCENTS.future;
const ACCENT_PAST = DASHBOARD_TRIP_BADGE_ACCENTS.past;
const ACCENT_UNSCHED = DASHBOARD_TRIP_BADGE_ACCENTS.unscheduled;

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
          Generar con IA
        </Link>
      </div>
    </div>
  );
}

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

function SectionBlock({
  title,
  trips,
  lockedTripIds,
}: {
  title: string;
  trips: TripWithMeta[];
  lockedTripIds: string[];
}) {
  if (!trips.length) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <TripGrid trips={trips} lockedTripIds={lockedTripIds} />
    </div>
  );
}

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

  function matchesQuery(trip: Trip) {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      trip.name.toLowerCase().includes(q) ||
      (trip.destination?.toLowerCase().includes(q) ?? false)
    );
  }

  const favoriteIds = useMemo(() => new Set(favoriteTrips.map((t) => t.id)), [favoriteTrips]);

  const excludeHero = (list: TripWithMeta[]) =>
    heroTripId && filter === "all" && !query.trim()
      ? list.filter((t) => t.id !== heroTripId)
      : list;

  const pool: TripWithMeta[] = useMemo(() => {
    let base = allWithMeta;
    if (filter === "expenses") base = allWithMeta.filter((t) => isExpenseGroupTrip(t));
    else if (filter === "favorites") base = allWithMeta.filter((t) => favoriteIds.has(t.id));
    else if (filter === "upcoming")
      base = allWithMeta.filter(
        (t) =>
          !isExpenseGroupTrip(t) &&
          (future.some((f) => f.id === t.id) || unscheduled.some((u) => u.id === t.id))
      );
    else if (filter === "past")
      base = allWithMeta.filter((t) => !isExpenseGroupTrip(t) && past.some((p) => p.id === t.id));
    return excludeHero(base);
  }, [filter, allWithMeta, favoriteIds, future, unscheduled, current, past, heroTripId, query]);

  const results = pool.filter(matchesQuery);
  const isSearching = query.trim() !== "";

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Todos", count: totalTrips },
    { key: "upcoming", label: "Próximos", count: current.length + future.length + unscheduled.length },
    { key: "past", label: "Pasados", count: past.length },
  ];
  if (favoriteTrips.length > 0) {
    tabs.push({ key: "favorites", label: "Favoritos", count: favoriteTrips.length });
  }
  if (showExpenseGroupsSection && expenseGroups.length > 0) {
    tabs.push({ key: "expenses", label: "Gastos", count: expenseGroups.length });
  }

  const currentMeta = excludeHero(
    current.map((t) => ({ ...t, badge: "En curso", accent: ACCENT_CURRENT }))
  ).filter(matchesQuery);
  const futureMeta = excludeHero(
    future.map((t) => ({ ...t, badge: "Próximo", accent: ACCENT_FUTURE }))
  ).filter(matchesQuery);
  const unscheduledMeta = excludeHero(
    unscheduled.map((t) => ({ ...t, badge: "Pendiente", accent: ACCENT_UNSCHED }))
  ).filter(matchesQuery);
  const pastMeta = excludeHero(
    past.map((t) => ({ ...t, badge: "Finalizado", accent: ACCENT_PAST }))
  ).filter(matchesQuery);
  const expenseMeta = expenseGroups
    .map((t) => ({
      ...t,
      badge: "Grupo de gastos",
      accent: DASHBOARD_TRIP_BADGE_ACCENTS.expenseGroup,
    }))
    .filter(matchesQuery);

  const showSections = filter === "all" && !isSearching;

  return (
    <DashboardAnnouncementUnreadProvider unreadByTripId={announcementUnreadByTripId}>
      <div className="space-y-6">
        <DashboardFavoriteChips
          trips={favoriteTrips}
          onSelectFilter={() => setFilter("favorites")}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar viaje…"
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
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
                <span className="text-[10px] font-bold text-slate-400">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {isSearching && (
          <p className="text-xs text-slate-500">
            {results.length === 0
              ? "No se encontraron viajes."
              : `${results.length} resultado${results.length !== 1 ? "s" : ""}`}{" "}
            para <strong className="text-slate-700 dark:text-slate-200">"{query.trim()}"</strong>
          </p>
        )}

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
            <SectionBlock title="En curso" trips={currentMeta} lockedTripIds={lockedTripIds} />
            <SectionBlock title="Próximamente" trips={[...futureMeta, ...unscheduledMeta]} lockedTripIds={lockedTripIds} />
            <SectionBlock title="Pasados" trips={pastMeta} lockedTripIds={lockedTripIds} />
            {showExpenseGroupsSection ? (
              <SectionBlock title="Gastos compartidos" trips={expenseMeta} lockedTripIds={lockedTripIds} />
            ) : null}
          </div>
        ) : (
          <TripGrid trips={results} lockedTripIds={lockedTripIds} />
        )}

        {totalTrips > 0 && !isSearching ? (
          <p className="text-center text-xs text-slate-400">
            ¿Otro destino?{" "}
            <button
              type="button"
              onClick={() => openCreateTripForm()}
              className="font-semibold text-[var(--brand)] hover:underline"
            >
              Crear viaje
            </button>
            {" · "}
            <Link href="/trips/new/planner" className="font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              Planificar con IA
              <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          </p>
        ) : null}
      </div>
    </DashboardAnnouncementUnreadProvider>
  );
}
