"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MapPin, Plus, Sparkles, ArrowRight, Search, X } from "lucide-react";
import TripCardItem from "@/components/dashboard/TripCardItem";
import { DASHBOARD_TRIP_BADGE_ACCENTS, isExpenseGroupTrip, type DashboardTrip } from "@/lib/dashboard-trip-types";
import { DashboardAnnouncementUnreadProvider } from "@/components/dashboard/DashboardAnnouncementUnreadContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type Trip = DashboardTrip;

type FavoriteTrip = Trip & {
  badge: string;
  accent: string;
  is_favorite: true;
};

type Filter = "all" | "travel" | "expenses" | "active" | "future" | "past" | "favorites";

type TripWithMeta = Trip & { badge: string; accent: string };

// ── Accent helpers ─────────────────────────────────────────────────────────────

const ACCENT_CURRENT = DASHBOARD_TRIP_BADGE_ACCENTS.current;
const ACCENT_FUTURE  = DASHBOARD_TRIP_BADGE_ACCENTS.future;
const ACCENT_PAST    = DASHBOARD_TRIP_BADGE_ACCENTS.past;
const ACCENT_UNSCHED = DASHBOARD_TRIP_BADGE_ACCENTS.unscheduled;

// ── Empty state ──────────────────────────────────────────────────────────────

function DashboardEmptyState() {
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <div className="empty-icon-bounce mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--brand-light)] to-slate-100 text-4xl shadow-sm dark:from-[#1E1040] dark:to-[#0F1623]">
        ✈️
      </div>
      <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Tu primer viaje te está esperando
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Crea un viaje, invita a tu grupo y deja que Kaviro gestione el plan, los gastos y las rutas por vosotros.
      </p>
      <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/trips/new"
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-hover)]"
        >
          <MapPin className="h-4 w-4" aria-hidden />
          Crear mi primer viaje
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href="/trips/new/planner"
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
        >
          <Sparkles className="h-4 w-4 text-[var(--brand)]" aria-hidden />
          Generar con IA
        </Link>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {[
          { icon: "📅", label: "Plan día a día" },
          { icon: "💶", label: "Gastos compartidos" },
          { icon: "🗺️", label: "Mapa de rutas" },
          { icon: "👥", label: "Hasta 5 personas gratis" },
          { icon: "✨", label: "IA en Premium" },
        ].map(({ icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-300"
          >
            {icon} {label}
          </span>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
        ¿Quieres ver cómo funciona antes de crear el tuyo?{" "}
        <Link href="/dashboard" className="font-semibold text-[var(--brand)] hover:underline">
          Explora el viaje demo de Londres
        </Link>
      </p>
    </div>
  );
}

// ── "Crear nuevo" tile ──────────────────────────────────────────────────────

function CreateNewTile() {
  return (
    <Link
      href="/trips/new"
      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center transition hover:border-[var(--brand)] hover:bg-[var(--brand-light)] dark:border-slate-700 dark:bg-[#0F1623] dark:hover:border-sky-600 dark:hover:bg-sky-950/20"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-light)] text-[var(--brand)] transition group-hover:scale-105 dark:bg-[#1E293B]">
        <Plus className="h-6 w-6" aria-hidden />
      </div>
      <div>
        <p className="font-semibold text-slate-700 dark:text-slate-200">Crear nuevo</p>
        <p className="mt-0.5 text-sm text-slate-400 dark:text-slate-500">Viaje o grupo de gastos</p>
      </div>
    </Link>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

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
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const travelCount = current.length + future.length + past.length + unscheduled.length;
  const totalTrips = travelCount + expenseGroups.length;

  // Flat list with badge + accent metadata
  const allWithMeta = useMemo<TripWithMeta[]>(
    () => [
      ...current.map((t) => ({ ...t, badge: "En curso",       accent: ACCENT_CURRENT })),
      ...future.map((t)  => ({ ...t, badge: "Próximo",        accent: ACCENT_FUTURE  })),
      ...past.map((t)    => ({ ...t, badge: "Finalizado",     accent: ACCENT_PAST    })),
      ...unscheduled.map((t) => ({ ...t, badge: "Pendiente",  accent: ACCENT_UNSCHED })),
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

  // Pool by active filter
  const pool: TripWithMeta[] = useMemo(() => {
    if (filter === "travel")    return allWithMeta.filter((t) => !isExpenseGroupTrip(t));
    if (filter === "expenses")  return allWithMeta.filter((t) =>  isExpenseGroupTrip(t));
    if (filter === "active")    return allWithMeta.filter((t) => current.some((c)    => c.id === t.id));
    if (filter === "future")    return allWithMeta.filter((t) => future.some((f)     => f.id === t.id));
    if (filter === "past")      return allWithMeta.filter((t) => past.some((p)       => p.id === t.id) || unscheduled.some((u) => u.id === t.id));
    if (filter === "favorites") return allWithMeta.filter((t) => favoriteIds.has(t.id));
    return allWithMeta; // "all"
  }, [filter, allWithMeta, current, future, past, unscheduled, favoriteIds]);

  const results = pool.filter(matchesQuery);
  const isSearching = query.trim() !== "";

  // Tab definitions
  const tabDefs: { key: Filter; label: string; count: number }[] = [
    { key: "all"       , label: "Todos",            count: totalTrips },
    { key: "favorites" , label: "Favoritos ⭐",       count: favoriteTrips.length },
    { key: "travel"    , label: "Viajes",            count: travelCount },
    { key: "expenses"  , label: "Grupos de gastos",  count: expenseGroups.length },
    { key: "active"    , label: "Activos",           count: current.length },
    { key: "future"    , label: "Próximos",          count: future.length },
    { key: "past"      , label: "Pasados",           count: past.length + unscheduled.length },
  ];
  const tabs = tabDefs.filter((t) => {
    // Hide "Grupos de gastos" si feature desactivada o sin grupos
    if (t.key === "expenses" && (!showExpenseGroupsSection || expenseGroups.length === 0)) return false;
    // Hide "Favoritos" si no hay ninguno
    if (t.key === "favorites" && favoriteTrips.length === 0) return false;
    return true;
  });

  return (
    <DashboardAnnouncementUnreadProvider unreadByTripId={announcementUnreadByTripId}>
      <div className="space-y-5">

        {/* ── Search + filter row ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar viaje…"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-10 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[color:var(--brand-border)] dark:border-slate-700 dark:bg-[#0f1623] dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Borrar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  filter === tab.key
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[var(--brand-border)] hover:bg-[var(--brand-light)] dark:border-slate-700 dark:bg-[#0f1623] dark:text-slate-300"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    filter === tab.key
                      ? "bg-white/20 text-white dark:bg-black/20"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Results count when searching ── */}
        {isSearching && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {results.length === 0
              ? "No se encontraron viajes."
              : `${results.length} viaje${results.length !== 1 ? "s" : ""} encontrado${results.length !== 1 ? "s" : ""}`}
            {" "}para{" "}
            <strong className="text-slate-700 dark:text-slate-200">"{query.trim()}"</strong>
          </p>
        )}

        {/* ── Main grid ── */}
        {totalTrips === 0 ? (
          <DashboardEmptyState />
        ) : results.length === 0 && isSearching ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-[#0f1623]">
            <p className="text-3xl">🔍</p>
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Sin resultados
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Prueba con otro nombre o destino.
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0f1623] dark:text-slate-300"
            >
              Borrar búsqueda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 xl:gap-5">
            {results.map((trip) => (
              <TripCardItem
                key={trip.id}
                trip={trip}
                badge={trip.badge}
                accent={trip.accent}
                locked={lockedTripIds.includes(String(trip.id))}
              />
            ))}
            {/* Crear nuevo tile — solo cuando no se está buscando */}
            {!isSearching && <CreateNewTile />}
          </div>
        )}
      </div>
    </DashboardAnnouncementUnreadProvider>
  );
}
