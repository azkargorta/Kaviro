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
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  MapPin,
  Share2,
  Users,
  Wallet,
  FileText,
  Route,
} from "lucide-react";
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

const TILE_CARD =
  "trip-tile-hover group flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_6px_20px_rgba(15,23,42,0.08)] dark:border-[#1E293B] dark:bg-[#0F1623] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:hover:border-slate-600";
const TILE_CARD_HIGHLIGHT =
  "trip-tile-hover group flex h-full flex-col rounded-2xl border border-[var(--brand-border)] bg-white p-4 shadow-[0_4px_16px_rgba(248,113,113,0.1)] ring-1 ring-[var(--brand-border)]/40 transition hover:-translate-y-0.5 hover:shadow-[0_6px_22px_rgba(248,113,113,0.14)] dark:border-[var(--brand-border)] dark:bg-[#0F1623]";
const TILE_ICON_WRAP =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-light)] ring-1 ring-[var(--brand-border)]";
const coralPngFilterDark =
  "dark:[filter:brightness(0)_saturate(100%)_invert(73%)_sepia(22%)_saturate(6228%)_hue-rotate(324deg)_brightness(102%)_contrast(98%)]";

// ─── Subcomponents ────────────────────────────────────────────────────────────

function TripProgressBar({ startDate, endDate }: { startDate: string; endDate: string }) {
  const today = todayYMD();
  const total = daysBetween(startDate, endDate) + 1;
  const elapsed = Math.min(total, Math.max(0, daysBetween(startDate, today) + 1));
  const pct = Math.round((elapsed / total) * 100);
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
        <span>
          Día {elapsed} de {total}
        </span>
        <span className="tabular-nums text-[var(--brand-text)]">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/70 shadow-inner ring-1 ring-slate-200/80 dark:bg-[#1E293B] dark:ring-[#334155]">
        <div
          className="h-full rounded-full bg-[var(--brand)] shadow-[0_0_8px_rgba(248,113,113,0.35)] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuickStatCard({
  icon,
  label,
  value,
  href,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  highlight?: boolean;
}) {
  const cardClass = highlight ? TILE_CARD_HIGHLIGHT : TILE_CARD;
  const inner = (
    <>
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          highlight
            ? "bg-[var(--brand-light)] text-[var(--brand)] ring-1 ring-[var(--brand-border)]"
            : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 dark:bg-[#141c2b] dark:text-slate-300 dark:ring-slate-700"
        }`}
      >
        {icon}
      </div>
      <div className="mt-2.5 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${cardClass} p-3.5`}>
        {inner}
      </Link>
    );
  }

  return <div className={`${cardClass} p-3.5`}>{inner}</div>;
}

function TodayActivityRow({
  activity,
}: {
  activity: TripSummaryActivityPreview & { isPast: boolean };
}) {
  if (activity.isPast) {
    return (
      <li className="relative rounded-xl border border-dashed border-slate-200 bg-slate-100/90 px-4 py-3 dark:border-[#334155] dark:bg-[#0a0e14]/50">
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:bg-[#1E293B] dark:text-slate-400">
          <Check className="h-2.5 w-2.5" aria-hidden />
          Hecha
        </span>
        <p className="pr-16 text-sm font-medium text-slate-400 line-through decoration-slate-400/80 dark:text-slate-500">
          {activity.title}
        </p>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{formatActivityWhen(activity)}</p>
        {(activity.place_name || activity.address) ? (
          <p className="mt-0.5 text-xs text-slate-400/80">{activity.place_name || activity.address}</p>
        ) : null}
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 dark:border-[#334155] dark:bg-[#141c2b] dark:ring-[#1E293B]">
      <p className="text-sm font-bold text-slate-900 dark:text-white">{activity.title}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{formatActivityWhen(activity)}</p>
      {(activity.place_name || activity.address) ? (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="h-3 w-3 shrink-0 text-[var(--brand)]" aria-hidden />
          {activity.place_name || activity.address}
        </p>
      ) : null}
    </li>
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

  const expensesTab = tabs.find((t) => t.href.includes("/expenses"));
  const resourcesTab = tabs.find((t) => t.href.includes("/resources"));
  const routesTab = tabs.find((t) => t.href.includes("/map"));
  const todayHref = `/trip/${tripId}/today`;

  const phaseLabel =
    phase === "before" && daysUntilStart !== null
      ? `Faltan ${daysUntilStart} día${daysUntilStart !== 1 ? "s" : ""}`
      : phase === "during" && daysLeft !== null
        ? `${daysLeft} día${daysLeft !== 1 ? "s" : ""} restantes`
        : phase === "after"
          ? "Viaje completado"
          : "Planificando";

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 md:gap-6">

      {/* ── Resumen rápido ── */}
      <Reveal variant="fade" as="section" className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        <QuickStatCard
          icon={<CalendarDays className="h-4 w-4" aria-hidden />}
          label="Días"
          value={totalDays !== null ? `${totalDays} días` : "Sin fechas"}
          href={planHref}
          highlight={phase === "during"}
        />
        <QuickStatCard
          icon={<Users className="h-4 w-4" aria-hidden />}
          label="Participantes"
          value={`${participantsCount ?? 0}`}
          href={`/trip/${tripId}/participants`}
        />
        <QuickStatCard
          icon={<Wallet className="h-4 w-4" aria-hidden />}
          label="Gastos"
          value={expensesTab?.metric ?? "0 gastos"}
          href={expensesTab?.href}
        />
        <QuickStatCard
          icon={<FileText className="h-4 w-4" aria-hidden />}
          label="Documentos"
          value={resourcesTab?.metric ?? "0 ítems"}
          href={resourcesTab?.href}
        />
        <QuickStatCard
          icon={<Route className="h-4 w-4" aria-hidden />}
          label="Rutas"
          value={routesTab?.metric ?? "0 rutas"}
          href={routesTab?.href}
        />
        <QuickStatCard
          icon={<Clock className="h-4 w-4" aria-hidden />}
          label="Estado"
          value={phaseLabel}
          highlight={phase === "during"}
        />
      </Reveal>

      {/* ── Hoy — protagonista ── */}
      <Reveal
        variant="fade"
        as="section"
        data-tour="summary-countdown"
        className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-gradient-to-br from-[var(--brand-light)] via-white to-white shadow-[0_8px_30px_rgba(248,113,113,0.1)] ring-1 ring-[var(--brand-border)]/50 dark:from-[#1a2438] dark:via-[#0F1623] dark:to-[#0F1623] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
      >
        <div className="border-b border-[var(--brand-border)]/40 bg-[var(--brand-light)]/40 px-4 py-5 md:px-6 md:py-6 dark:border-[var(--brand-border)]/30 dark:bg-[var(--brand-light)]/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white/90" aria-hidden />
                Hoy
              </span>
              <h2 className="mt-3 text-xl font-extrabold capitalize tracking-tight text-slate-900 dark:text-white md:text-2xl">
                {todayLabel}
              </h2>
              {tripDestination ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <MapPin className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden />
                  {tripDestination}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href={todayHref}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white px-4 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-[#334155] dark:bg-[#141c2b] dark:text-slate-100"
              >
                Modo día
              </Link>
              <Link
                href={planHref}
                className="btn-press inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] px-5 text-xs font-bold text-white shadow-md shadow-[var(--brand)]/20 transition hover:bg-[var(--brand-hover)]"
              >
                Ver itinerario
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>

          {phase === "during" && tripStartDate && tripEndDate ? (
            <div className="mt-5 max-w-lg">
              <TripProgressBar startDate={tripStartDate} endDate={tripEndDate} />
            </div>
          ) : null}
        </div>

        <div className="px-4 py-5 md:px-6 md:py-6">
          {(activitiesCount ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300/80 bg-white/80 px-4 py-4 dark:border-[#334155] dark:bg-[#080C14]/40">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Sin actividades todavía</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Crea tu primer plan o pide ayuda al asistente IA para montar el itinerario.
              </p>
              <Link
                href={planHref}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--brand-hover)]"
              >
                Ir al plan
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          ) : plansToday.length > 0 ? (
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
                Plan de hoy
              </p>
              <ul className="space-y-2.5">
                {plansToday.map((a) => (
                  <TodayActivityRow key={a.id} activity={a} />
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No hay actividades programadas para hoy.
            </p>
          )}
        </div>
      </Reveal>

      {/* ── Próxima actividad — bloque destacado ── */}
      {nextPlan ? (
        <Reveal
          variant="fade"
          as="section"
          className="overflow-hidden rounded-2xl border-2 border-[var(--brand-border)] bg-gradient-to-r from-[var(--brand-light)] via-white to-white p-5 shadow-[0_6px_24px_rgba(248,113,113,0.12)] md:p-6 dark:from-[#1a2438] dark:via-[#0F1623] dark:to-[#0F1623]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-text)]">
                Próxima actividad
              </p>
              <p className="mt-2 text-xl font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white md:text-2xl">
                {nextPlan.title}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                {formatActivityWhen(nextPlan)}
              </p>
              {(nextPlan.place_name || nextPlan.address) ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <MapPin className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden />
                  {nextPlan.place_name || nextPlan.address}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {buildMapsUrl(nextPlan) ? (
                <a
                  href={buildMapsUrl(nextPlan)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-[#334155] dark:bg-[#141c2b] dark:text-slate-100"
                >
                  <MapPin className="h-3.5 w-3.5 text-[var(--brand)]" aria-hidden />
                  Cómo llegar
                </a>
              ) : null}
              <Link
                href={planHref}
                className="btn-press inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--brand-hover)]"
              >
                Abrir en plan
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </Reveal>
      ) : (activitiesCount ?? 0) > 0 ? (
        <p className="rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-300">
          No hay actividades futuras con fecha. Revisa el plan.
        </p>
      ) : null}

      {/* ── Secciones del viaje ── */}
      <section className="min-w-0 space-y-3">
        <Reveal variant="fade">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Centro de control
            </p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white md:text-xl">
              Todo tu viaje, a un toque
            </h2>
          </div>
        </Reveal>

        <div data-tour="summary-stats" className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {tabs.map((tab, tabIdx) => {
            const iconSrc = tab.iconKey ? getTripTabIconSrc(tab.iconKey, isDark) : tab.iconSrc || "";
            return (
              <Reveal key={tab.href} variant="scale" delay={(tabIdx % 4) as RevealDelay} className="h-full">
                <Link href={tab.href} className={`${TILE_CARD} sm:p-5`}>
                  <div className="flex items-start gap-3">
                    <div className={TILE_ICON_WRAP}>
                      <Image
                        src={iconSrc}
                        alt=""
                        width={24}
                        height={24}
                        className={`h-5 w-5 object-contain ${isDark ? coralPngFilterDark : ""}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">{tab.label}</p>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-[var(--brand)]" aria-hidden />
                      </div>
                      <span className="mt-1 inline-flex rounded-full bg-[var(--brand-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand-text)]">
                        {tab.metric}
                      </span>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {tab.subtitle}
                      </p>
                      {tab.hint ? (
                        <p className="mt-2 line-clamp-2 text-[11px] text-slate-400 dark:text-slate-500">{tab.hint}</p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      <div
        className={`grid gap-4 md:gap-5 ${
          hideWeather ? "" : "lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]"
        }`}
      >
        <div className="flex min-w-0 flex-col gap-4 md:gap-5">
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
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm md:p-6 dark:border-[#1E293B] dark:bg-[#0F1623]">
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
        </div>

        {!hideWeather ? (
        <Reveal
          variant="slide"
          delay={budgetTarget != null && budgetTarget > 0 ? 2 : 1}
          as="section"
          data-tour="summary-weather"
          className="min-w-0 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm md:p-6 dark:border-[#1E293B] dark:bg-[#0F1623]"
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

      <details className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
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
    <div data-tour="summary-recap-cta" className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-[#1E293B]">
        <KaviroMark size={32} className="shrink-0 rounded-full" title="Kaviro" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand)]">Recap del viaje</p>
          <p className="text-base font-extrabold leading-tight text-slate-900 dark:text-white">
            Guarda el recuerdo para el grupo
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
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
