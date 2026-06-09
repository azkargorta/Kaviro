"use client";
import TripSearchCard from "@/components/trip/summary/TripSearchCard";

import Image from "next/image";
import Link from "next/link";
import KaviroMark from "@/components/brand/KaviroMark";
import { useState } from "react";
import type { TripWeatherCityForecast, TripWeatherResult } from "@/lib/trip-weather";
import { wmoWeatherVisual } from "@/lib/weatherPresentation";
import { getTripTabIconSrc, type TripTabKey } from "@/lib/trip-tab-assets";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import { Share2 } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import type { RevealDelay } from "@/components/ui/Reveal";
import TripBudgetSummaryCard from "@/components/trip/summary/TripBudgetSummaryCard";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TripSummaryActivityPreview = {
  id: string;
  title: string;
  activity_date: string | null;
  activity_time: string | null;
  place_name: string | null;
  address: string | null;
};

export type TripSummaryTabDef = {
  href: string;
  label: string;
  subtitle: string;
  metric: string;
  iconSrc?: string;
  iconKey?: TripTabKey;
  tone: "cyan" | "emerald" | "amber" | "violet" | "slate" | "rose";
  hint?: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatShortWeekday(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short" }).format(d);
}

function formatActivityWhen(a: TripSummaryActivityPreview) {
  const datePart = a.activity_date
    ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(`${a.activity_date}T12:00:00`))
    : "Sin fecha";
  const timePart = a.activity_time && /^\d{2}:\d{2}/.test(a.activity_time) ? ` · ${a.activity_time.slice(0, 5)}` : "";
  return `${datePart}${timePart}`;
}

function buildMapsUrl(a: TripSummaryActivityPreview) {
  const q = a.place_name || a.address;
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function todayYMD() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

function tripPhase(startDate: string | null | undefined, endDate: string | null | undefined) {
  const today = todayYMD();
  if (!startDate || !endDate) return "unknown" as const;
  if (today < startDate) return "before" as const;
  if (today > endDate) return "after" as const;
  return "during" as const;
}

function daysBetween(a: string, b: string) {
  return Math.round(
    (new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / (86400 * 1000)
  );
}

function formatFullDate(d: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${d}T12:00:00`)
  );
}

// ─── Tile accent colors per tone ──────────────────────────────────────────────

const TILE_ACCENT: Record<TripSummaryTabDef["tone"], { bg: string; border: string; icon: string; chip: string; arrow: string }> = {
  violet:  { bg: "bg-violet-50 dark:bg-[#0F1623]",  border: "border-violet-200/70 dark:border-[#F87171]/20", icon: "bg-violet-100 dark:bg-[#F87171]/15", chip: "bg-violet-100 text-violet-800 dark:bg-[#F87171]/15 dark:text-[#FCA5A5]",  arrow: "text-violet-600 dark:text-[#F87171]" },
  cyan:    { bg: "bg-sky-50 dark:bg-[#0F1623]",     border: "border-sky-200/70 dark:border-[#F87171]/20",    icon: "bg-sky-100 dark:bg-[#F87171]/15",    chip: "bg-sky-100 text-sky-800 dark:bg-[#F87171]/15 dark:text-[#FCA5A5]",       arrow: "text-sky-600 dark:text-[#F87171]"    },
  emerald: { bg: "bg-emerald-50 dark:bg-[#0F1623]", border: "border-emerald-200/70 dark:border-[#F87171]/20",icon: "bg-emerald-100 dark:bg-[#F87171]/15",chip: "bg-emerald-100 text-emerald-800 dark:bg-[#F87171]/15 dark:text-[#FCA5A5]",arrow: "text-emerald-600 dark:text-[#F87171]"},
  amber:   { bg: "bg-amber-50 dark:bg-[#0F1623]",   border: "border-amber-200/70 dark:border-[#F87171]/20",  icon: "bg-amber-100 dark:bg-[#F87171]/15",  chip: "bg-amber-100 text-amber-800 dark:bg-[#F87171]/15 dark:text-[#FCA5A5]",   arrow: "text-amber-600 dark:text-[#F87171]"  },
  slate:   { bg: "bg-slate-50 dark:bg-[#0F1623]",   border: "border-slate-200/70 dark:border-[#F87171]/20",  icon: "bg-slate-100 dark:bg-[#F87171]/15",  chip: "bg-slate-100 text-slate-700 dark:bg-[#F87171]/15 dark:text-[#FCA5A5]",   arrow: "text-slate-500 dark:text-[#F87171]"  },
  rose:    { bg: "bg-rose-50 dark:bg-[#0F1623]",    border: "border-rose-200/70 dark:border-[#F87171]/20",   icon: "bg-rose-100 dark:bg-[#F87171]/15",   chip: "bg-rose-100 text-rose-800 dark:bg-[#F87171]/15 dark:text-[#FCA5A5]",     arrow: "text-rose-600 dark:text-[#F87171]"   },
};

const coralBorderDark = "dark:border-[color:var(--brand-border)]";
const coralRingDark = "dark:ring-1 dark:ring-[color:var(--brand-light)]";
// Aproximación para teñir un PNG blanco al acento en dark mode.
const coralPngFilterDark =
  "dark:[filter:brightness(0)_saturate(100%)_invert(73%)_sepia(22%)_saturate(6228%)_hue-rotate(324deg)_brightness(102%)_contrast(98%)]";

// ─── Subcomponents ────────────────────────────────────────────────────────────

// R6 — Progress bar for active trip
function TripProgressBar({ startDate, endDate }: { startDate: string; endDate: string }) {
  const today = todayYMD();
  const total = daysBetween(startDate, endDate) + 1;
  const elapsed = Math.min(total, Math.max(0, daysBetween(startDate, today) + 1));
  const pct = Math.round((elapsed / total) * 100);
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
        <span>Día {elapsed} de {total}</span>
        <span>{pct}% completado</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-white/70 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TripSummaryOverview({
  tripId,
  tripName,
  weather,
  weatherByCity = [],
  activeWeatherCity = null,
  weatherHint,
  todayLabel,
  plansToday,
  nextPlan,
  tabs,
  // R1: accept trip dates for countdown
  tripStartDate,
  tripEndDate,
  tripDestination,
  activitiesCount,
  participantsCount,
  budgetTarget,
  totalSpent,
  currency,
  expenseMultiCurrency,
  hideWeather = false,
}: {
  tripId: string;
  tripName?: string | null;
  hideWeather?: boolean;
  weather: TripWeatherResult | null;
  weatherByCity?: TripWeatherCityForecast[];
  activeWeatherCity?: string | null;
  weatherHint: "ok" | "no-destination" | "unavailable";
  todayLabel: string;
  plansToday: Array<TripSummaryActivityPreview & { isPast: boolean }>;
  nextPlan: TripSummaryActivityPreview | null;
  tabs: TripSummaryTabDef[];
  // Optional — for R1 hero and R6 progress bar
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  tripDestination?: string | null;
  activitiesCount?: number;
  participantsCount?: number;
  budgetTarget?: number | null;
  totalSpent?: number;
  currency?: string;
  expenseMultiCurrency?: boolean;
}) {
  const isDark = useIsDarkMode();
  const planHref = `/trip/${tripId}/plan`;
  const phase = tripPhase(tripStartDate, tripEndDate);
  const today = todayYMD();

  const [selectedWeatherCity, setSelectedWeatherCity] = useState<string | null>(
    activeWeatherCity || weatherByCity[0]?.city || null
  );

  const displayedWeather =
    weatherByCity.find((c) => c.city === selectedWeatherCity)?.weather ??
    weather;

  // Countdown / progress data
  const daysUntilStart = tripStartDate && phase === "before"
    ? daysBetween(today, tripStartDate)
    : null;
  const daysLeft = tripEndDate && phase === "during"
    ? daysBetween(today, tripEndDate)
    : null;
  const totalDays = tripStartDate && tripEndDate
    ? daysBetween(tripStartDate, tripEndDate) + 1
    : null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 md:gap-6">

      {/* ── R1+R2+R4+R5+R6 — Hero rediseñado ─────────────────────────────── */}
      <div
        className={`grid gap-4 md:gap-5 lg:items-start ${
          hideWeather ? "" : "lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]"
        }`}
      >

        {/* Hero card — countdown + today's plan + next activity */}
        <Reveal variant="fade" as="section" data-tour="summary-countdown" className="relative overflow-hidden rounded-2xl border border-slate-900/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white shadow-xl md:rounded-3xl md:p-7">
          {/* Subtle glow — solo escritorio */}
          <div
            className="pointer-events-none absolute -right-20 -top-10 hidden h-52 w-52 rounded-full bg-violet-500/15 blur-3xl dark:bg-[var(--brand-light)] md:block"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-10 -left-10 hidden h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl dark:bg-[var(--brand-light)] md:block"
            aria-hidden
          />

          <div className="relative">
            {/* R1 — Countdown / state hero */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 md:mb-5 md:items-start">
              <div>
                {/* Phase-aware headline */}
                {phase === "before" && daysUntilStart !== null && (
                  <>
                    <p className="text-xs font-bold text-violet-200 dark:text-[var(--accent)] md:text-sm">
                      <span className="md:hidden">⏳ </span>
                      Faltan <span className="tabular-nums">{daysUntilStart}</span> día{daysUntilStart !== 1 ? "s" : ""}
                      <span className="hidden md:inline">
                        {" "}para el viaje{tripStartDate ? ` · ${formatFullDate(tripStartDate)}` : ""}
                      </span>
                    </p>
                  </>
                )}
                {phase === "during" && daysLeft !== null && (
                  <>
                    <p className="text-xs font-bold text-emerald-200 dark:text-[var(--accent)] md:text-sm">
                      ✈️ En curso · <span className="tabular-nums">{daysLeft}</span>d
                      <span className="hidden md:inline">
                        {" "}restantes{tripDestination ? ` · ${tripDestination}` : ""}
                      </span>
                    </p>
                  </>
                )}
                {phase === "after" && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Viaje completado 🏁</p>
                    <p className="mt-1 text-2xl font-extrabold">
                      {totalDays !== null ? `${totalDays} días` : "Resumen"}
                    </p>
                    {tripDestination && <p className="mt-1 text-sm text-slate-400">{tripDestination}</p>}
                  </>
                )}
                {phase === "unknown" && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Tu viaje</p>
                    <p className="mt-1 text-2xl font-extrabold">Añade fechas para ver la cuenta atrás</p>
                  </>
                )}
              </div>

              <Link
                href={planHref}
                className="hidden min-h-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20 md:inline-flex"
              >
                Ver Plan →
              </Link>
              {phase === "before" && daysUntilStart !== null ? (
                <p className="shrink-0 text-base font-black tabular-nums text-white md:hidden">{daysUntilStart}d</p>
              ) : null}
              {phase === "during" && daysLeft !== null ? (
                <p className="shrink-0 text-base font-black tabular-nums text-white md:hidden">{daysLeft}d</p>
              ) : null}
            </div>

            {/* R6 — Progress bar (only during) */}
            {phase === "during" && tripStartDate && tripEndDate && (
              <div className="max-md:scale-y-90 max-md:origin-top">
                <TripProgressBar startDate={tripStartDate} endDate={tripEndDate} />
              </div>
            )}

            {/* R5 — Empty state */}
            {(activitiesCount ?? 0) === 0 && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 md:mt-5 md:px-4 md:py-4">
                <p className="text-sm font-bold text-white">🗺️ Sin actividades todavía</p>
                <p className="mt-1 text-xs text-slate-300">Crea tu primer plan o usa el asistente IA para generar el itinerario completo.</p>
                <Link
                  href={planHref}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--brand-hover)]"
                >
                  Ir al Plan →
                </Link>
              </div>
            )}

            {/* Today's activities — detalle solo en escritorio */}
            {plansToday.length > 0 && (
              <div className="mt-5 hidden md:block">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300/90 mb-2 dark:text-[var(--accent)]">Planes para hoy</p>
                <ul className="space-y-2">
                  {plansToday.map((a) => (
                    <li
                      key={a.id}
                      className={`rounded-2xl border px-4 py-3 ${
                        a.isPast
                          ? "border-white/5 bg-black/15 text-slate-400"
                          : "border-white/10 bg-white/5 text-white"
                      }`}
                    >
                      <p className={`text-sm font-semibold ${a.isPast ? "line-through decoration-slate-500/80" : ""}`}>
                        {a.title}
                      </p>
                      <p className="mt-0.5 text-xs text-violet-200/80 dark:text-[var(--brand-text)]">{formatActivityWhen(a)}</p>
                      {(a.place_name || a.address) && (
                        <p className="mt-0.5 text-xs text-slate-400">{a.place_name || a.address}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* R4 — Next activity as featured card (escritorio) */}
            {nextPlan && (
              <div
                className={`mt-5 hidden rounded-2xl border border-[#F87171]/30 bg-gradient-to-br from-[#F87171]/20 to-transparent p-4 ring-1 ring-[#F87171]/15 md:block
                dark:border-[color:var(--brand-border)] dark:bg-[var(--brand-light)] dark:ring-[color:var(--brand-light)]`}
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#FCA5A5] dark:text-[var(--accent)]">Próximo en el calendario</p>
                <p className="mt-1.5 text-xl font-extrabold text-white leading-snug">{nextPlan.title}</p>
                <p className="mt-1 text-sm font-semibold text-white/70 dark:text-[var(--brand-text)]">{formatActivityWhen(nextPlan)}</p>
                {(nextPlan.place_name || nextPlan.address) && (
                  <p className="mt-0.5 text-xs text-slate-300">{nextPlan.place_name || nextPlan.address}</p>
                )}
                {/* Maps button */}
                {buildMapsUrl(nextPlan) && (
                  <a
                    href={buildMapsUrl(nextPlan)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                  >
                    📍 Cómo llegar
                  </a>
                )}
              </div>
            )}

            {!nextPlan && (activitiesCount ?? 0) > 0 && (
              <p className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                No hay planes futuros con fecha. Añade fechas en Plan.
              </p>
            )}
          </div>
        </Reveal>

        {/* R3 — Módulos del viaje (móvil: antes de presupuesto/clima) */}
        <section className="order-2 col-span-full min-w-0 space-y-2 lg:col-span-2 md:space-y-3">
          <Reveal variant="fade">
            <div className="hidden flex-wrap items-end justify-between gap-2 md:flex">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">Navegación rápida</p>
                <h2 className="mt-0.5 text-xl font-extrabold text-slate-950 dark:text-slate-50">Módulos del viaje</h2>
              </div>
            </div>
          </Reveal>

          <div data-tour="summary-stats" className="grid grid-cols-4 gap-1.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
            {tabs.map((tab, tabIdx) => {
              const ac = TILE_ACCENT[tab.tone];
              const iconSrc = tab.iconKey ? getTripTabIconSrc(tab.iconKey, isDark) : tab.iconSrc || "";
              const tileBorder = isDark ? "border-[color:var(--brand-border)] hover:border-[var(--accent)]" : ac.border;
              const tileBg = isDark ? "bg-[var(--surface-card)]/80 hover:bg-[var(--surface-card)]" : "bg-white";
              const tileShadow = isDark ? "shadow-[0_10px_30px_rgba(0,0,0,0.40)]" : "shadow-sm";
              return (
                <Reveal
                  key={tab.href}
                  variant="scale"
                  delay={(tabIdx % 4) as RevealDelay}
                  className="h-full"
                >
                  <Link
                    href={tab.href}
                    className={`trip-tile-hover group flex h-full flex-col items-center rounded-xl border p-2 text-center sm:items-stretch sm:rounded-2xl sm:p-4 sm:text-left ${tileBg} ${tileShadow} ${tileBorder} ${coralRingDark}`}
                  >
                    <div
                      className={
                        isDark
                          ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-light)] ring-1 ring-[color:var(--brand-border)] sm:h-11 sm:w-11 sm:rounded-xl"
                          : `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl ${ac.icon}`
                      }
                    >
                      <Image
                        src={iconSrc}
                        alt=""
                        width={24}
                        height={24}
                        className={`h-5 w-5 object-contain sm:h-6 sm:w-6 ${isDark ? coralPngFilterDark : ""}`}
                      />
                    </div>
                    <p className="mt-1 text-[10px] font-extrabold leading-tight text-slate-950 dark:text-slate-50 sm:mt-3 sm:text-[15px]">
                      {tab.label}
                    </p>
                    <span
                      className={`mt-1 hidden rounded-full px-2.5 py-1 text-[11px] font-extrabold sm:inline-block ${
                        isDark
                          ? "bg-[var(--brand-light)] text-[var(--brand-text)] ring-1 ring-[color:var(--brand-border)]"
                          : ac.chip
                      }`}
                    >
                      {tab.metric}
                    </span>
                    <p className="mt-0.5 hidden text-xs text-slate-500 dark:text-slate-300 sm:block">{tab.subtitle}</p>
                    {tab.hint ? (
                      <p className="mt-2 hidden rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-700 line-clamp-2 dark:border-[color:var(--brand-border)] dark:bg-black/20 dark:text-slate-200 sm:block">
                        {tab.hint}
                      </p>
                    ) : null}
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>

        <div className="order-3 flex min-w-0 flex-col gap-4 md:order-2 md:gap-5">
        {budgetTarget != null && budgetTarget > 0 ? (
          <Reveal variant="slide" delay={1} as="div" data-tour="summary-budget">
            <TripBudgetSummaryCard
              tripId={tripId}
              budgetTarget={budgetTarget}
              totalSpent={totalSpent ?? 0}
              currency={currency || "EUR"}
              multiCurrency={expenseMultiCurrency}
            />
          </Reveal>
        ) : (
          <Reveal variant="slide" delay={1} as="div" data-tour="summary-budget">
            <section className="rounded-3xl border border-amber-200/70 bg-gradient-to-b from-amber-50 via-white to-slate-50 p-5 shadow-md md:p-6 dark:border-[color:var(--brand-border)] dark:from-[var(--surface-card)] dark:via-[var(--surface-card)] dark:to-[var(--surface-card)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-800 dark:text-[var(--accent)]">
                Presupuesto del viaje
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Aún no has definido un presupuesto objetivo. Configúralo en Ajustes para ver la barra de progreso aquí y en Gastos.
              </p>
              <Link
                href={`/trip/${tripId}/settings#presupuesto`}
                className="mt-3 inline-flex min-h-9 items-center gap-1 text-xs font-bold text-[var(--brand)] hover:underline md:mt-4 md:min-h-10 md:rounded-xl md:bg-[var(--brand)] md:px-4 md:py-2 md:text-white md:no-underline md:hover:bg-[var(--brand-hover)]"
              >
                <span className="md:hidden">Definir presupuesto →</span>
                <span className="hidden md:inline">Definir presupuesto en Ajustes</span>
              </Link>
            </section>
          </Reveal>
        )}

        {!hideWeather ? (
        <Reveal
          variant="slide"
          delay={budgetTarget != null && budgetTarget > 0 ? 2 : 1}
          as="section"
          data-tour="summary-weather"
          className={`min-w-0 rounded-3xl border border-sky-200/60 bg-gradient-to-b from-sky-50 via-white to-slate-50 p-5 shadow-md md:p-6
          dark:border-[color:var(--brand-border)] dark:from-[var(--surface-card)] dark:via-[var(--surface-card)] dark:to-[var(--surface-card)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.45)]`}
        >
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-sky-700 dark:text-[var(--accent)]">Clima en el destino</p>
              <p className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-slate-50">Previsión</p>
            </div>
            <span className="text-2xl">🌤️</span>
          </div>

          {weatherHint === "no-destination" ? (
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Configura las{" "}
              <Link href={`/trip/${tripId}/settings#clima`} className="font-semibold text-sky-700 underline dark:text-sky-300">
                ciudades y fechas en Ajustes
              </Link>{" "}
              para ver el clima.
            </p>
          ) : weatherHint === "unavailable" ? (
            <p className="text-sm text-slate-500 dark:text-slate-300">No se pudo obtener la previsión. Revisa que el destino sea reconocible.</p>
          ) : displayedWeather && displayedWeather.days.length ? (
            <div className="space-y-3">
              {weatherByCity.length > 1 ? (
                <div className="flex flex-wrap gap-1.5">
                  {weatherByCity.map((entry) => (
                    <button
                      key={entry.city}
                      type="button"
                      onClick={() => setSelectedWeatherCity(entry.city)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        selectedWeatherCity === entry.city
                          ? "border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-100"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#080C14] dark:text-slate-300"
                      }`}
                    >
                      {entry.city}
                      {entry.city === activeWeatherCity ? " · hoy" : ""}
                    </button>
                  ))}
                </div>
              ) : null}
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">{displayedWeather.locationLabel}</p>

              {/* Today highlight */}
              {(() => {
                const todayW = displayedWeather.days.find((d) => d.date === today);
                const vis = todayW ? wmoWeatherVisual(todayW.code) : null;
                if (!todayW || !vis) return null;
                return (
                  <div
                    className={`flex items-center gap-4 rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm
                    dark:bg-[var(--surface-page)]/55 dark:border-[color:var(--brand-border)] dark:shadow-[0_10px_26px_rgba(0,0,0,0.35)]`}
                  >
                    <span className="text-4xl">{vis.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide dark:text-slate-300">Hoy</p>
                      <p className="text-2xl font-extrabold text-slate-900 tabular-nums leading-tight dark:text-slate-50">
                        {todayW.tempMax != null ? `${Math.round(todayW.tempMax)}°` : "—"}
                        <span className="text-base font-semibold text-slate-400 ml-1 dark:text-slate-400">
                          / {todayW.tempMin != null ? `${Math.round(todayW.tempMin)}°` : "—"}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-300">{vis.label}</p>
                    </div>
                    {/* Today rain */}
                    {(todayW as any).precipProb != null && (
                      <div className="text-right shrink-0">
                        <p className="text-lg font-extrabold text-sky-600 tabular-nums dark:text-[var(--accent)]">{(todayW as any).precipProb}%</p>
                        <p className="text-[10px] text-slate-400 leading-none mt-0.5 dark:text-slate-400">lluvia</p>
                        {(todayW as any).precipMm != null && (todayW as any).precipMm > 0 && (
                          <p className="text-[10px] font-semibold text-sky-500 dark:text-[var(--brand-text)]">{(todayW as any).precipMm} mm</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* All days — horizontal scroll with precipitation */}
              <div className="overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollSnapType: "x mandatory" }}>
                <div className="flex gap-2" style={{ width: "max-content" }}>
                  {displayedWeather.days.map((day) => {
                    const vis = wmoWeatherVisual(day.code);
                    const isToday = day.date === today;
                    const prob = (day as any).precipProb as number | null;
                    const mm = (day as any).precipMm as number | null;
                    const hasRain = prob != null && prob > 20;
                    return (
                      <div
                        key={day.date}
                        style={{ scrollSnapAlign: "start" }}
                        className={`w-[52px] shrink-0 rounded-xl border px-1.5 py-2 text-center shadow-sm transition-all max-md:py-2 md:w-[84px] md:rounded-2xl md:px-2.5 md:py-3 ${
                          isToday
                            ? "border-[#F87171]/40 bg-[#FEF2F2] ring-1 ring-[#F87171]/25 dark:border-[color:var(--brand-border)] dark:bg-[var(--surface-page)]/55 dark:ring-[color:var(--brand-light)]"
                            : "border-slate-200 bg-white dark:border-[color:var(--border-default)] dark:bg-[var(--surface-card)]"
                        }`}
                      >
                        <p className={`text-[10px] font-bold uppercase tracking-wide ${isToday ? "text-[var(--brand)] dark:text-[var(--accent)]" : "text-slate-400 dark:text-slate-400"}`}>
                          {isToday ? "HOY" : formatShortWeekday(day.date)}
                        </p>
                        <p className="mt-1 text-lg leading-none md:mt-1.5 md:text-2xl">{vis.emoji}</p>
                        <p className="mt-1 text-[11px] font-extrabold text-slate-900 tabular-nums leading-tight dark:text-slate-50 md:mt-2 md:text-xs">
                          {day.tempMax != null ? `${Math.round(day.tempMax)}°` : "—"}
                        </p>
                        <p className="hidden text-[10px] text-slate-400 tabular-nums dark:text-slate-400 md:block">
                          {day.tempMin != null ? `${Math.round(day.tempMin)}°` : "—"}
                        </p>
                        {/* Precipitation — solo escritorio */}
                        <div className={`mt-2 hidden rounded-lg px-1.5 py-1 md:block ${hasRain ? "bg-sky-50 dark:bg-[color:var(--border-default)]/50" : "bg-transparent"}`}>
                          {prob != null ? (
                            <>
                              <p className={`text-[11px] font-extrabold tabular-nums ${hasRain ? "text-sky-600 dark:text-[var(--accent)]" : "text-slate-300 dark:text-slate-500"}`}>
                                💧{prob}%
                              </p>
                              {mm != null && mm > 0 && (
                                <p className="text-[9px] text-sky-400 tabular-nums dark:text-[var(--brand-text)]">{mm}mm</p>
                              )}
                            </>
                          ) : (
                            <p className="text-[10px] text-slate-200 dark:text-slate-600">—</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 dark:text-slate-500">Open-Meteo · 14 días · orientativo</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-300">Sin datos de previsión.</p>
          )}
        </Reveal>
        ) : null}
        </div>
      </div>

      {nextPlan ? (
        <Link
          href={planHref}
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:hover:bg-[#1a2438] md:hidden"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--brand)]" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 dark:text-white">{nextPlan.title}</span>
          <span className="shrink-0 text-[10px] font-semibold text-slate-500 dark:text-slate-400">{formatActivityWhen(nextPlan)}</span>
        </Link>
      ) : null}

      <details className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1E293B] dark:bg-[#0F1623]">
        <summary className="cursor-pointer text-sm font-bold text-slate-800 dark:text-slate-200">
          Buscar vuelos y alojamiento
        </summary>
        <div className="mt-4">
          <TripSearchCard
            destination={tripDestination ?? null}
            startDate={tripStartDate ?? null}
            endDate={tripEndDate ?? null}
            participants={Math.max(1, participantsCount ?? 1)}
            tripId={tripId}
          />
        </div>
      </details>

      {/* ── Recap CTA — escritorio (móvil: menú Más) ─────────────── */}
      <Reveal variant="slide" delay={2} className="hidden md:block">
      <SummaryRecapCta
        tripId={tripId}
        tripName={tripName ?? ""}
        destination={tripDestination ?? null}
        startDate={tripStartDate ?? null}
        endDate={tripEndDate ?? null}
      />
      </Reveal>
    </div>
  );
}

// ── Recap CTA ────────────────────────────────────────────────────────────────
function SummaryRecapCta({
  tripId, tripName, destination, startDate, endDate,
}: {
  tripId: string;
  tripName: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
}) {
  const [shared, setShared] = useState(false);

  function formatDate(d: string | null) {
    if (!d) return "";
    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${d}T12:00:00`));
  }

  async function handleShare() {
    const text = [
      `✈️ ${tripName}${destination ? ` — ${destination}` : ""}`,
      startDate ? `📅 ${formatDate(startDate)}${endDate ? ` → ${formatDate(endDate)}` : ""}` : "",
      "",
      "Organizado con Kaviro · kaviro.app",
    ].filter(Boolean).join("\n");

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `Recap: ${tripName}`, text });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      }
    } catch { /* user cancelled */ }
  }

  return (
    <div data-tour="summary-recap-cta" className="rounded-2xl overflow-hidden border border-slate-200 dark:border-[#1E293B] shadow-sm">
      <div className="bg-gradient-to-br from-[#F87171] via-[#ef4444] to-[#0f172a] px-5 py-4 flex items-center gap-3">
        <KaviroMark size={32} className="shrink-0 rounded-full" title="Kaviro" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Kaviro · Recap</p>
          <p className="text-base font-extrabold text-white leading-tight">Crea el recap de tu viaje</p>
        </div>
      </div>
      <div className="bg-white dark:bg-[#0F1623] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">
          Estadísticas, foto del destino y tarjeta para compartir con el grupo.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-300"
          >
            <Share2 className="h-3.5 w-3.5" />
            {shared ? "¡Copiado!" : "Compartir"}
          </button>
          <Link
            href={`/trip/${tripId}/recap`}
            className="btn-press inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
          >
            Crear Recap
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
