"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, Star, MapPin, Users, Sparkles, ArrowRight } from "lucide-react";
import DashboardTripSection from "@/components/dashboard/DashboardTripSection";
import DashboardFavoritesSection from "@/components/dashboard/DashboardFavoritesSection";
import TripCardItem from "@/components/dashboard/TripCardItem";

// ── Types ─────────────────────────────────────────────────────────────────────

type Trip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string | null;
  is_favorite?: boolean;
};

type FavoriteTrip = Trip & {
  badge: string;
  accent: string;
  is_favorite: true;
};

type Filter = "all" | "current" | "future" | "past" | "favorites";

type TripWithMeta = Trip & { badge: string; accent: string };

// ── Accent helpers ─────────────────────────────────────────────────────────────

const ACCENT_CURRENT   = "from-emerald-100 to-teal-50 border-emerald-200";
const ACCENT_FUTURE    = "from-[var(--brand-light)] to-slate-50 border-[var(--brand-border)]";
const ACCENT_PAST      = "from-slate-100 to-slate-50 border-slate-200";
const ACCENT_UNSCHED   = "from-amber-100 to-orange-50 border-amber-200";


// ── Empty state (zero real trips) ─────────────────────────────────────────────

function DashboardEmptyState() {
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      {/* Illustration */}
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--brand-light)] to-slate-100 text-4xl shadow-sm dark:from-[#1E1040] dark:to-[#0F1623]">
        ✈️
      </div>

      <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Tu primer viaje te está esperando
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Crea un viaje, invita a tu grupo y deja que Kaviro gestione el plan, los gastos y las rutas por vosotros.
      </p>

      {/* CTAs */}
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

      {/* Feature pills */}
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

      {/* Demo suggestion */}
      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
        ¿Quieres ver cómo funciona antes de crear el tuyo?{" "}
        <Link href="/dashboard" className="font-semibold text-[var(--brand)] hover:underline">
          Explora el viaje demo de Londres
        </Link>
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DashboardTripsClient({
  current,
  future,
  past,
  unscheduled,
  favoriteTrips,
  lockedTripIds,
}: {
  current: Trip[];
  future: Trip[];
  past: Trip[];
  unscheduled: Trip[];
  favoriteTrips: FavoriteTrip[];
  lockedTripIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const totalTrips =
    current.length + future.length + past.length + unscheduled.length;

  // Build flat list with meta for search/filter view
  const allWithMeta = useMemo<TripWithMeta[]>(
    () => [
      ...current.map((t) => ({ ...t, badge: "En curso",   accent: ACCENT_CURRENT  })),
      ...future.map((t)  => ({ ...t, badge: "Próximo",    accent: ACCENT_FUTURE   })),
      ...past.map((t)    => ({ ...t, badge: "Finalizado", accent: ACCENT_PAST     })),
      ...unscheduled.map((t) => ({ ...t, badge: "Pendiente", accent: ACCENT_UNSCHED })),
    ],
    [current, future, past, unscheduled]
  );

  const favWithMeta = useMemo<TripWithMeta[]>(
    () => favoriteTrips.map((t) => ({ ...t })),
    [favoriteTrips]
  );

  function matchesQuery(trip: Trip) {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      trip.name.toLowerCase().includes(q) ||
      (trip.destination?.toLowerCase().includes(q) ?? false)
    );
  }

  // Determine the current pool based on filter
  const pool: TripWithMeta[] =
    filter === "favorites"
      ? favWithMeta
      : filter === "current"  ? allWithMeta.filter((t) => current.some((c) => c.id === t.id))
      : filter === "future"   ? allWithMeta.filter((t) => future.some((c) => c.id === t.id))
      : filter === "past"     ? allWithMeta.filter((t) => past.some((c) => c.id === t.id))
      : allWithMeta;

  const results = pool.filter(matchesQuery);

  const isFiltering = query.trim() !== "" || filter !== "all";

  // Tab definitions
  const tabs: { key: Filter; label: string; count: number; icon?: React.ReactNode }[] = [
    { key: "all",       label: "Todos",    count: totalTrips },
    { key: "current",   label: "En curso", count: current.length },
    { key: "future",    label: "Próximos", count: future.length },
    { key: "past",      label: "Pasados",  count: past.length },
    {
      key: "favorites",
      label: "Favoritos",
      count: favoriteTrips.length,
      icon: <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />,
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Search bar ── */}
      <div className="mx-auto max-w-2xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o destino…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[color:var(--brand-border)] dark:border-slate-700 dark:bg-[#0f1623] dark:text-slate-100 dark:placeholder:text-slate-500"
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
      </div>

      {/* ── Filter tabs ── */}
      <div className="mx-auto max-w-2xl">
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
              {tab.icon}
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filter === tab.key
                    ? "bg-white/20 text-white dark:bg-black/20 dark:text-slate-900"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filtered / search results ── */}
      {isFiltering ? (
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Results count */}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {results.length === 0
              ? "No se encontraron viajes."
              : `${results.length} viaje${results.length !== 1 ? "s" : ""} encontrado${results.length !== 1 ? "s" : ""}`}
            {query.trim() && (
              <span className="ml-1">
                para <strong className="text-slate-700 dark:text-slate-200">"{query.trim()}"</strong>
              </span>
            )}
          </p>

          {results.length === 0 ? (
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
                onClick={() => { setQuery(""); setFilter("all"); }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0f1623] dark:text-slate-300"
              >
                Ver todos los viajes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {results.map((trip) => (
                <TripCardItem
                  key={trip.id}
                  trip={trip}
                  badge={trip.badge}
                  accent={trip.accent}
                  locked={lockedTripIds.includes(String(trip.id))}
                />
              ))}
            </div>
          )}
        </div>
      ) : totalTrips === 0 ? (
        <DashboardEmptyState />
      ) : (
        /* ── Normal sections view ── */
        <>
          <DashboardFavoritesSection
            trips={favoriteTrips}
            lockedTripIds={lockedTripIds}
          />
          <DashboardTripSection
            title="En curso"
            subtitle="Lo que estás viviendo ahora."
            trips={current}
            badge="En curso"
            accent={ACCENT_CURRENT}
            lockedTripIds={lockedTripIds}
          />
          <DashboardTripSection
            title="Próximos"
            subtitle="Viajes con fecha futura."
            trips={future}
            badge="Próximo"
            accent={ACCENT_FUTURE}
            lockedTripIds={lockedTripIds}
          />
          <DashboardTripSection
            title="Pasados"
            subtitle="Viajes ya cerrados en el calendario."
            trips={past}
            badge="Finalizado"
            accent={ACCENT_PAST}
            lockedTripIds={lockedTripIds}
          />
          {unscheduled.length > 0 && (
            <DashboardTripSection
              title="Sin fechas cerradas"
              subtitle="Define inicio y fin cuando puedas."
              trips={unscheduled}
              badge="Pendiente"
              accent={ACCENT_UNSCHED}
              lockedTripIds={lockedTripIds}
            />
          )}
        </>
      )}
    </div>
  );
}
