"use client";
import TripSearchCard from "@/components/trip/summary/TripSearchCard";

import Link from "next/link";
import KaviroMark from "@/components/brand/KaviroMark";
import { useState } from "react";
import type { TripWeatherCityForecast, TripWeatherDay, TripWeatherResult } from "@/lib/trip-weather";
import { wmoWeatherVisual } from "@/lib/weatherPresentation";
import type { TripTabKey } from "@/lib/trip-tab-assets";
import { TRIP_SIDEBAR_ICONS } from "@/lib/trip-sidebar-icons";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  CloudRain,
  CloudSun,
  Droplets,
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
import { TripStatCard, TripProgressBar, TRIP_TILE_CARD, TripStatusPill } from "@/components/trip/ui";

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

function weatherTripTip(day: TripWeatherDay | undefined): string | null {
  if (!day) return null;
  if (day.precipProb != null && day.precipProb >= 55) {
    return "Alta probabilidad de lluvia: lleva paraguas o ten un plan B en interior.";
  }
  if (day.precipProb != null && day.precipProb >= 30) {
    return "Puede llover hoy: conviene ir preparado.";
  }
  if (day.tempMax != null && day.tempMax >= 32) {
    return "Día caluroso: hidrátate y busca sombra en las horas centrales.";
  }
  if (day.tempMin != null && day.tempMin <= 5) {
    return "Temperaturas bajas: capas y abrigo para moverte cómodo.";
  }
  const vis = day.code != null ? wmoWeatherVisual(day.code) : null;
  if (vis?.label === "Tormenta") {
    return "Posibles tormentas: revisa el plan al aire libre y ten alternativa.";
  }
  if (vis?.label === "Nieve" || vis?.label === "Chubascos nieve") {
    return "Condiciones invernales: calzado adecuado y más margen en desplazamientos.";
  }
  return null;
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

const TILE_ICON_WRAP =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/90 text-[var(--brand)] ring-1 ring-slate-200/50 dark:border-[#334155] dark:bg-[#141c2b]";

function activityTimeLabel(time: string | null | undefined) {
  return (time || "").trim().slice(0, 5) || "—";
}

function TodayActivityRow({
  activity,
  isHighlight = false,
}: {
  activity: TripSummaryActivityPreview & { isPast: boolean };
  isHighlight?: boolean;
}) {
  const isPast = activity.isPast;
  const isCurrent = isHighlight && !isPast;
  const shellClass = isCurrent
    ? "border-[var(--brand-border)] bg-white shadow-[0_4px_14px_rgba(248,113,113,0.12)] ring-1 ring-[var(--brand-border)]/40 dark:bg-[#141c2b]"
    : isPast
      ? "border border-dashed border-slate-200/90 bg-slate-100/70 opacity-75 dark:border-[#334155] dark:bg-[#0a0e14]/40"
      : "border-slate-200/90 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#080C14]";

  return (
    <li className={`rounded-xl transition ${shellClass}`}>
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-bold leading-snug sm:truncate ${
              isPast
                ? "font-medium text-slate-400 line-through decoration-slate-400/70 dark:text-slate-500"
                : isCurrent
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-800 dark:text-slate-100"
            }`}
          >
            {activity.title}
          </p>
          {(activity.place_name || activity.address) ? (
            <p
              className={`mt-1 flex items-center gap-1 text-xs ${
                isPast ? "text-slate-400/80" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {!isPast ? <MapPin className="h-3 w-3 shrink-0 text-[var(--brand)]" aria-hidden /> : null}
              <span className="truncate">{activity.place_name || activity.address}</span>
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:ml-auto sm:justify-end">
          <span
            className={`inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-bold tabular-nums ${
              isCurrent
                ? "border-[var(--brand-border)]/60 bg-white text-[var(--brand-text)] dark:bg-[#141c2b]"
                : isPast
                  ? "border-slate-200/80 bg-slate-50 text-slate-400"
                  : "border-slate-200/80 bg-slate-50 text-slate-700 dark:border-[#334155] dark:bg-[#141c2b] dark:text-slate-200"
            }`}
          >
            {activityTimeLabel(activity.activity_time)}
          </span>
          {isCurrent ? <TripStatusPill variant="current" /> : isPast ? <TripStatusPill variant="past" /> : null}
        </div>
      </div>
    </li>
  );
}

function NextActivityMiniCard({
  activity,
  planHref,
}: {
  activity: TripSummaryActivityPreview;
  planHref: string;
}) {
  const mapsUrl = buildMapsUrl(activity);

  return (
    <div className="rounded-xl border border-[var(--brand-border)]/60 bg-white/90 p-3.5 shadow-sm dark:border-[var(--brand-border)]/40 dark:bg-[#141c2b]/80">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand-text)]">Próxima actividad</p>
      <p className="mt-2 line-clamp-2 text-sm font-extrabold leading-snug text-slate-900 dark:text-white">
        {activity.title}
      </p>
      <p className="mt-1.5 text-xs font-bold tabular-nums text-slate-600 dark:text-slate-300">
        {activityTimeLabel(activity.activity_time)}
        {activity.activity_date ? (
          <span className="font-medium text-slate-400">
            {" "}
            ·{" "}
            {new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(
              new Date(`${activity.activity_date}T12:00:00`)
            )}
          </span>
        ) : null}
      </p>
      {(activity.place_name || activity.address) ? (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <MapPin className="h-3 w-3 shrink-0 text-[var(--brand)]" aria-hidden />
          <span className="truncate">{activity.place_name || activity.address}</span>
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-8 items-center rounded-lg border border-slate-200/90 bg-white px-2.5 text-[10px] font-bold text-slate-700 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200"
          >
            Cómo llegar
          </a>
        ) : null}
        <Link
          href={planHref}
          className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-[var(--brand)] px-2.5 text-[10px] font-bold text-white hover:bg-[var(--brand-hover)]"
        >
          Ver itinerario
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
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
  expensesCount,
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
  expensesCount?: number;
  currency?: string;
  expenseMultiCurrency?: boolean;
}) {
  const planHref = `/trip/${tripId}/plan`;
  const phase = tripPhase(tripStartDate, tripEndDate);
  const today = todayYMD();

  const [selectedWeatherCity, setSelectedWeatherCity] = useState<string | null>(
    activeWeatherCity || weatherByCity[0]?.city || null
  );

  const displayedWeather =
    weatherByCity.find((c) => c.city === selectedWeatherCity)?.weather ??
    weather;

  const todayWeatherDay = displayedWeather?.days.find((d) => d.date === today) ?? null;
  const weatherTip = weatherTripTip(todayWeatherDay ?? undefined);

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

  const todayDoneCount = plansToday.filter((p) => p.isPast).length;
  const todayTotalCount = plansToday.length;
  const nextHighlightId = plansToday.find((p) => !p.isPast)?.id ?? null;
  const expensesCountLabel = expensesTab?.metric ?? "0 gastos";
  const participantsN = participantsCount ?? 0;
  const expenseItemsCount = expensesCount ?? 0;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 md:gap-6">

      {/* ── Resumen rápido (escritorio; en móvil las tiles del centro de control bastan) ── */}
      <Reveal variant="fade" as="section" className="hidden grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid lg:grid-cols-6">
        <TripStatCard
          icon={<CalendarDays className="h-4 w-4" aria-hidden />}
          label="Días"
          value={totalDays !== null ? `${totalDays} días` : "Sin fechas"}
          subtitle={phase === "during" && daysLeft !== null ? `${daysLeft} días restantes` : undefined}
          href={planHref}
          highlight={phase === "during"}
        />
        <TripStatCard
          icon={<Users className="h-4 w-4" aria-hidden />}
          label="Participantes"
          value={participantsN === 1 ? "1 viajero" : `${participantsN} viajeros`}
          subtitle={participantsN <= 1 ? "Invita al grupo" : "En el mismo viaje"}
          href={`/trip/${tripId}/participants`}
        />
        <TripStatCard
          icon={<Wallet className="h-4 w-4" aria-hidden />}
          label="Gastos"
          value={expensesCountLabel}
          subtitle={expensesCountLabel.startsWith("0") ? "Registra el primer gasto" : expensesTab?.hint ?? undefined}
          href={expensesTab?.href}
        />
        <TripStatCard
          icon={<FileText className="h-4 w-4" aria-hidden />}
          label="Documentos"
          value={resourcesTab?.metric ?? "0 ítems"}
          subtitle={(resourcesTab?.metric ?? "0").startsWith("0") ? "Sube billetes o reservas" : resourcesTab?.hint ?? undefined}
          href={resourcesTab?.href}
        />
        <TripStatCard
          icon={<Route className="h-4 w-4" aria-hidden />}
          label="Rutas"
          value={routesTab?.metric ?? "0 rutas"}
          subtitle={(routesTab?.metric ?? "0").startsWith("0") ? "Crea trayectos en el mapa" : routesTab?.hint ?? undefined}
          href={routesTab?.href}
        />
        <TripStatCard
          icon={<Clock className="h-4 w-4" aria-hidden />}
          label="Estado"
          value={phaseLabel}
          subtitle={
            phase === "during" && todayTotalCount > 0
              ? `${todayDoneCount} de ${todayTotalCount} hoy`
              : phase === "before" && daysUntilStart !== null
                ? `Empieza en ${daysUntilStart} días`
                : undefined
          }
          highlight={phase === "during"}
        />
      </Reveal>

      {/* ── Hoy — protagonista ── */}
      <Reveal
        variant="fade"
        as="section"
        data-tour="summary-countdown"
        className="overflow-hidden rounded-2xl border border-[var(--brand-border)]/70 bg-white shadow-[0_4px_20px_rgba(248,113,113,0.08)] ring-1 ring-[var(--brand-border)]/40 dark:border-[var(--brand-border)]/50 dark:bg-[#0F1623]"
      >
        <div className="border-b border-[var(--brand-border)]/30 bg-gradient-to-br from-[var(--brand-light)]/80 via-white to-white px-3 py-3 md:px-5 md:py-5 dark:from-[#1a1212]/50 dark:via-[#0F1623] dark:to-[#0F1623]">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,260px)] lg:items-start lg:gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-border)]/60 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-text)] dark:bg-[#141c2b]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" aria-hidden />
                  Hoy
                </span>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  <Link
                    href={todayHref}
                    className="inline-flex min-h-8 items-center rounded-lg border border-slate-200/90 bg-white px-3 text-[10px] font-bold text-slate-700 dark:border-[#334155] dark:bg-[#141c2b] dark:text-slate-200"
                  >
                    Modo día
                  </Link>
                  <Link
                    href={planHref}
                    className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-[var(--brand)] px-3 text-[10px] font-bold text-white hover:bg-[var(--brand-hover)]"
                  >
                    Itinerario
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              </div>
              <h2 className="mt-1.5 text-base font-extrabold capitalize tracking-tight text-slate-900 dark:text-white md:mt-2 md:text-xl">
                {todayLabel}
              </h2>
              {tripDestination ? (
                <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 md:mt-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--brand)]" aria-hidden />
                  {tripDestination}
                </p>
              ) : null}
              {phase === "during" && tripStartDate && tripEndDate ? (
                <div className="mt-3 max-w-md">
                  <TripProgressBar startDate={tripStartDate} endDate={tripEndDate} />
                </div>
              ) : null}
            </div>

            {nextPlan ? (
              <div className="lg:pt-1">
                <NextActivityMiniCard activity={nextPlan} planHref={planHref} />
              </div>
            ) : (activitiesCount ?? 0) > 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200/90 bg-slate-50/80 px-3 py-3 text-xs text-slate-500 dark:border-[#334155] dark:bg-[#080C14]/50 dark:text-slate-400">
                Sin actividades futuras con fecha. Revisa el plan.
              </div>
            ) : null}
          </div>
        </div>

        <div className="px-4 py-4 md:px-5">
          {(activitiesCount ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300/80 bg-slate-50/60 px-4 py-3.5 dark:border-[#334155] dark:bg-[#080C14]/40">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Sin actividades todavía</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Crea tu primer plan o pide ayuda al asistente IA.
              </p>
              <Link
                href={planHref}
                className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--brand-hover)]"
              >
                Ir al plan
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          ) : plansToday.length > 0 ? (
            <div>
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Plan de hoy
                {todayTotalCount > 0 ? (
                  <span className="ml-2 font-semibold normal-case tracking-normal text-slate-400">
                    {todayDoneCount} de {todayTotalCount} hechas
                  </span>
                ) : null}
              </p>
              <ul className="space-y-2">
                {plansToday.map((a) => (
                  <TodayActivityRow key={a.id} activity={a} isHighlight={a.id === nextHighlightId} />
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No hay actividades programadas para hoy.
              {nextPlan ? " La próxima está arriba." : null}
            </p>
          )}
        </div>
      </Reveal>

      {/* ── Secciones del viaje ── */}
      <section className="min-w-0 space-y-2 md:space-y-3">
        <Reveal variant="fade" className="hidden md:block">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Centro de control
            </p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white md:text-xl">
              Todo tu viaje, a un toque
            </h2>
          </div>
        </Reveal>

        <div data-tour="summary-stats" className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          {tabs.map((tab, tabIdx) => {
            const Icon = tab.iconKey ? TRIP_SIDEBAR_ICONS[tab.iconKey] : null;
            return (
              <Reveal key={tab.href} variant="scale" delay={(tabIdx % 4) as RevealDelay} className="h-full">
                <Link href={tab.href} className={`${TRIP_TILE_CARD} p-3 sm:p-5`}>
                  <div className="flex items-start gap-3">
                    <div className={TILE_ICON_WRAP}>
                      {Icon ? <Icon className="h-5 w-5" strokeWidth={2} aria-hidden /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">{tab.label}</p>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-[var(--brand)]" aria-hidden />
                      </div>
                      <p className="mt-1 text-xs font-bold text-[var(--brand-text)]">{tab.metric}</p>
                      {tab.hint ? (
                        <p className="mt-1.5 line-clamp-2 text-[11px] font-medium leading-snug text-slate-500 dark:text-slate-400">
                          {tab.hint}
                        </p>
                      ) : (
                        <p className="mt-1.5 line-clamp-2 text-[11px] text-slate-400 dark:text-slate-500">{tab.subtitle}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      <div
        className={`flex flex-col-reverse gap-3 md:gap-5 ${
          hideWeather ? "" : "lg:grid lg:grid-cols-3 lg:items-stretch"
        }`}
      >
        {!hideWeather ? (
          <Reveal
            variant="slide"
            delay={1}
            as="section"
            data-tour="summary-weather"
            className="min-w-0 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm md:p-5 lg:col-span-2 dark:border-[#1E293B] dark:bg-[#0F1623]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100 dark:bg-[#141c2b] dark:text-sky-300 dark:ring-sky-900/40">
                  <CloudSun className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    Clima en el destino
                  </p>
                  <p className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-slate-50">Previsión del viaje</p>
                </div>
              </div>
            </div>

            {weatherHint === "no-destination" ? (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Configura las{" "}
                <Link href={`/trip/${tripId}/settings#clima`} className="font-semibold text-[var(--brand)] hover:underline">
                  ciudades y fechas en Ajustes
                </Link>{" "}
                para ver el clima.
              </p>
            ) : weatherHint === "unavailable" ? (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                No se pudo obtener la previsión. Revisa que el destino sea reconocible.
              </p>
            ) : displayedWeather && displayedWeather.days.length ? (
              <div className="space-y-4">
                {weatherByCity.length > 1 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {weatherByCity.map((entry) => (
                      <button
                        key={entry.city}
                        type="button"
                        onClick={() => setSelectedWeatherCity(entry.city)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          selectedWeatherCity === entry.city
                            ? "border-[var(--brand-border)] bg-[var(--brand-light)] text-[var(--brand-text)]"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#080C14] dark:text-slate-300"
                        }`}
                      >
                        {entry.city}
                        {entry.city === activeWeatherCity ? " · hoy" : ""}
                      </button>
                    ))}
                  </div>
                ) : null}

                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{displayedWeather.locationLabel}</p>

                {todayWeatherDay ? (
                  (() => {
                    const vis = wmoWeatherVisual(todayWeatherDay.code);
                    const prob = todayWeatherDay.precipProb;
                    const mm = todayWeatherDay.precipMm;
                    return (
                      <div className="rounded-2xl border border-[var(--brand-border)]/50 bg-gradient-to-br from-[var(--brand-light)]/40 via-white to-sky-50/30 p-4 dark:from-[#1a1212]/40 dark:via-[#0F1623] dark:to-[#0F1623]">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <span className="text-5xl leading-none sm:shrink-0">{vis.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-text)]">Ahora · hoy</p>
                            <p className="mt-1 text-3xl font-extrabold tabular-nums leading-none text-slate-900 dark:text-white">
                              {todayWeatherDay.tempMax != null ? `${Math.round(todayWeatherDay.tempMax)}°` : "—"}
                              <span className="ml-1.5 text-lg font-semibold text-slate-400">
                                / {todayWeatherDay.tempMin != null ? `${Math.round(todayWeatherDay.tempMin)}°` : "—"}
                              </span>
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{vis.label}</p>
                          </div>
                          {prob != null ? (
                            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-sky-100 bg-white/80 px-3 py-2.5 dark:border-sky-900/40 dark:bg-[#141c2b]/80">
                              <CloudRain className="h-5 w-5 text-sky-500 dark:text-sky-300" aria-hidden />
                              <div>
                                <p className="text-lg font-extrabold tabular-nums text-sky-700 dark:text-sky-200">{prob}%</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Lluvia</p>
                                {mm != null && mm > 0 ? (
                                  <p className="text-[10px] font-bold tabular-nums text-sky-500">{mm} mm</p>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                        {weatherTip ? (
                          <p className="mt-3 rounded-lg border border-slate-200/80 bg-white/70 px-3 py-2 text-xs leading-snug text-slate-600 dark:border-[#334155] dark:bg-[#080C14]/50 dark:text-slate-300">
                            {weatherTip}
                          </p>
                        ) : null}
                      </div>
                    );
                  })()
                ) : null}

                <details className="group lg:hidden">
                  <summary className="cursor-pointer text-xs font-bold text-[var(--brand)] hover:underline">
                    Ver previsión de próximos días
                  </summary>
                  <div className="mt-2 overflow-x-auto pb-1">
                    <div className="flex w-max gap-2">
                      {displayedWeather.days.map((day) => {
                        const vis = wmoWeatherVisual(day.code);
                        const isToday = day.date === today;
                        const prob = day.precipProb;
                        return (
                          <div
                            key={`m-${day.date}`}
                            className={`w-[64px] shrink-0 rounded-xl border px-1.5 py-2 text-center ${
                              isToday
                                ? "border-[var(--brand-border)] bg-[var(--brand-light)]/60"
                                : "border-slate-200/90 bg-white dark:border-[#334155] dark:bg-[#080C14]"
                            }`}
                          >
                            <p className="text-[9px] font-bold uppercase text-slate-400">{isToday ? "Hoy" : formatShortWeekday(day.date)}</p>
                            <p className="mt-1 text-lg">{vis.emoji}</p>
                            <p className="text-[11px] font-bold tabular-nums">{day.tempMax != null ? `${Math.round(day.tempMax)}°` : "—"}</p>
                            {prob != null && prob > 20 ? <p className="text-[9px] text-sky-600">{prob}%</p> : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </details>

                <div className="hidden lg:block">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    Próximos días
                  </p>
                  <div className="overflow-x-auto pb-1 lg:overflow-visible">
                    <div className="flex w-max gap-2 lg:grid lg:w-full lg:grid-cols-7 lg:gap-2">
                      {displayedWeather.days.map((day) => {
                        const vis = wmoWeatherVisual(day.code);
                        const isToday = day.date === today;
                        const prob = day.precipProb;
                        const mm = day.precipMm;
                        const hasRain = prob != null && prob > 20;
                        return (
                          <div
                            key={day.date}
                            className={`w-[72px] shrink-0 rounded-xl border px-2 py-2.5 text-center shadow-sm lg:w-auto ${
                              isToday
                                ? "border-[var(--brand-border)] bg-[var(--brand-light)]/60 ring-1 ring-[var(--brand-border)]/40"
                                : "border-slate-200/90 bg-white dark:border-[#334155] dark:bg-[#080C14]"
                            }`}
                          >
                            <p
                              className={`text-[10px] font-bold uppercase tracking-wide ${
                                isToday ? "text-[var(--brand)]" : "text-slate-400"
                              }`}
                            >
                              {isToday ? "Hoy" : formatShortWeekday(day.date)}
                            </p>
                            <p className="mt-1.5 text-xl leading-none">{vis.emoji}</p>
                            <p className="mt-1.5 text-xs font-extrabold tabular-nums text-slate-900 dark:text-slate-50">
                              {day.tempMax != null ? `${Math.round(day.tempMax)}°` : "—"}
                            </p>
                            <p className="text-[10px] tabular-nums text-slate-400">
                              {day.tempMin != null ? `${Math.round(day.tempMin)}°` : "—"}
                            </p>
                            {prob != null ? (
                              <div
                                className={`mt-1.5 flex items-center justify-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] font-bold tabular-nums ${
                                  hasRain ? "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300" : "text-slate-300"
                                }`}
                              >
                                <Droplets className="h-3 w-3" aria-hidden />
                                {prob}%
                              </div>
                            ) : null}
                            {mm != null && mm > 0 ? (
                              <p className="mt-0.5 text-[9px] font-semibold tabular-nums text-sky-500">{mm} mm</p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <p className="hidden text-[10px] text-slate-400 lg:block dark:text-slate-500">Open-Meteo · 14 días · orientativo</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-300">Sin datos de previsión.</p>
            )}
          </Reveal>
        ) : null}

        <Reveal variant="slide" delay={hideWeather ? 1 : 2} as="div" data-tour="summary-budget" className="min-w-0 lg:col-span-1">
          <TripBudgetSummaryCard
            tripId={tripId}
            budgetTarget={budgetTarget}
            totalSpent={totalSpent ?? 0}
            expensesCount={expenseItemsCount}
            currency={currency || "EUR"}
            multiCurrency={expenseMultiCurrency}
          />
        </Reveal>
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
