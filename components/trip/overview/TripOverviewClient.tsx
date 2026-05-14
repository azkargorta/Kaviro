"use client";
import { useState, useEffect } from "react";

import Link from "next/link";
import { useMemo } from "react";
import {
  CalendarDays, MapPin, Users, Wallet, FileText,
  Clock, ChevronRight, Sparkles, CheckCircle2, AlertCircle,
} from "lucide-react";
import type { TripWeatherResult } from "@/lib/trip-weather";
import TripAiInsights from "@/components/trip/overview/TripAiInsights";

type Activity = {
  id: string;
  title: string;
  activity_date?: string | null;
  activity_time?: string | null;
  place_name?: string | null;
  activity_kind?: string | null;
};

type Props = {
  tripId: string;
  tripName: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  phase: "before" | "during" | "after";
  daysUntilStart: number | null;
  daysUntilEnd: number | null;
  daysElapsed: number | null;
  totalTripDays: number | null;
  activitiesCount: number;
  completedActivities: number;
  completionPct: number;
  expensesCount: number;
  totalExpenses: number;
  currency: string;
  participantsCount: number;
  resourcesCount: number;
  nextActivity: Activity | null;
  todayActivities: Activity[];
  weather: TripWeatherResult | null;
  isPremium: boolean;
  canEdit: boolean;
};

const KIND_META: Record<string, { icon: string; color: string }> = {
  culture:           { icon: "🏛️", color: "bg-amber-100 text-amber-800" },
  nature:            { icon: "🌿", color: "bg-emerald-100 text-emerald-800" },
  viewpoint:         { icon: "🌄", color: "bg-sky-100 text-sky-800" },
  neighborhood:      { icon: "🧭", color: "bg-slate-100 text-slate-700" },
  market:            { icon: "🧺", color: "bg-orange-100 text-orange-800" },
  excursion:         { icon: "🚌", color: "bg-blue-100 text-blue-800" },
  gastro_experience: { icon: "🍷", color: "bg-pink-100 text-pink-800" },
  shopping:          { icon: "🛍️", color: "bg-purple-100 text-purple-800" },
  night:             { icon: "🌙", color: "bg-indigo-100 text-indigo-800" },
  transport:         { icon: "✈️", color: "bg-slate-100 text-slate-600" },
};

function kindMeta(kind?: string | null) {
  return KIND_META[kind || ""] ?? { icon: "📍", color: "bg-slate-100 text-slate-700" };
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency", currency, maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount)} ${currency}`;
  }
}

function formatShortDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(
    new Date(`${dateStr}T12:00:00`)
  );
}

function WMOIcon({ code }: { code: number | null }) {
  if (code === null) return <>🌡️</>;
  if (code === 0) return <>☀️</>;
  if (code <= 3) return <>⛅</>;
  if (code <= 49) return <>🌫️</>;
  if (code <= 69) return <>🌧️</>;
  if (code <= 79) return <>🌨️</>;
  if (code <= 84) return <>🌦️</>;
  return <>⛈️</>;
}

export default function TripOverviewClient({
  tripId, destination, phase,
  daysUntilStart, daysUntilEnd, daysElapsed, totalTripDays,
  activitiesCount, completedActivities, completionPct,
  expensesCount, totalExpenses, currency,
  participantsCount, resourcesCount,
  nextActivity, todayActivities, weather, isPremium, canEdit,
}: Props) {

  // Hero message depending on phase
  const hero = useMemo(() => {
    if (phase === "before" && daysUntilStart !== null) {
      if (daysUntilStart === 0) return { label: "El viaje empieza hoy 🎉", sub: "¡Todo listo para arrancar!" };
      if (daysUntilStart === 1) return { label: "Mañana empieza el viaje ✈️", sub: "Última noche en casa." };
      return { label: `${daysUntilStart} días para el viaje`, sub: "Hay tiempo — sigue preparando el plan." };
    }
    if (phase === "during" && daysUntilEnd !== null) {
      if (daysUntilEnd === 0) return { label: "Último día del viaje 🥂", sub: "Aprovéchalo al máximo." };
      return { label: `Día ${daysElapsed} de ${totalTripDays}`, sub: `Quedan ${daysUntilEnd} días.` };
    }
    if (phase === "after") {
      return { label: "Viaje completado 🏁", sub: `${activitiesCount} actividades · ${formatMoney(totalExpenses, currency)} gastado` };
    }
    return { label: "Tu viaje", sub: destination ?? "" };
  }, [phase, daysUntilStart, daysUntilEnd, daysElapsed, totalTripDays, activitiesCount, totalExpenses, currency, destination]);

  // Today's weather
  const todayStr = new Intl.DateTimeFormat("en-CA").format(new Date());
  const todayWeather = weather?.days.find((d) => d.date === todayStr) ?? null;

  return (
    <div className="space-y-5">

      {/* ── Hero countdown card ─────────────────────────────────────────── */}
      <div className="card-soft px-6 py-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          {phase === "during" && totalTripDays && (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#F87171]/10 px-3 py-1 ring-1 ring-[#F87171]/25">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F87171] animate-pulse" />
              <span className="text-[11px] font-bold text-[#F87171]">
                Día {(daysElapsed ?? 0) + 1} de {totalTripDays}
              </span>
            </div>
          )}
          <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{hero.label}</p>
          <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-400">{hero.sub}</p>
          {destination && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              {destination}
            </div>
          )}
        </div>
        {/* Progress bar for "during" phase */}
        {phase === "during" && totalTripDays && (
          <div className="min-w-[160px]">
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
              <span>Progreso del viaje</span>
              <span>{Math.round(((daysElapsed ?? 0) / totalTripDays) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#F87171] transition-all"
                style={{ width: `${Math.min(100, ((daysElapsed ?? 0) / totalTripDays) * 100)}%` }}
              />
            </div>
            {todayWeather && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <WMOIcon code={todayWeather.code} />
                {todayWeather.tempMax !== null && `${Math.round(todayWeather.tempMax)}°`}
                {todayWeather.tempMin !== null && ` / ${Math.round(todayWeather.tempMin)}°`}
                <span className="text-slate-400">hoy en {weather?.locationLabel}</span>
              </div>
            )}
          </div>
        )}
        {/* Countdown ring for "before" phase */}
        {phase === "before" && daysUntilStart !== null && daysUntilStart <= 30 && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border-4 border-[var(--brand-light)] flex items-center justify-center">
              <span className="text-xl font-extrabold text-[var(--brand)]">{daysUntilStart}</span>
            </div>
            <span className="mt-1 text-xs font-semibold text-slate-400">días</span>
          </div>
        )}
      </div>

      {/* ── Stats grid ──────────────────────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 no-scrollbar">
        {/* Activities */}
        <Link href={`/trip/${tripId}/plan`} className="card-soft px-4 py-4 flex flex-col gap-1 hover:border-violet-200 transition-colors group min-w-[140px] snap-start sm:min-w-0">
          <div className="flex items-center justify-between">
            <CalendarDays className="w-4 h-4 text-[var(--brand)]" />
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-violet-400 transition-colors" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{activitiesCount}</p>
          <p className="text-xs font-semibold text-slate-500">Planes</p>
          {activitiesCount > 0 && (
            <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${completionPct}%` }} />
            </div>
          )}
        </Link>

        {/* Expenses */}
        <Link href={`/trip/${tripId}/expenses`} className="card-soft px-4 py-4 flex flex-col gap-1 hover:border-emerald-200 transition-colors group min-w-[140px] snap-start sm:min-w-0">
          <div className="flex items-center justify-between">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-400 transition-colors" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-1 truncate">
            {expensesCount > 0 ? formatMoney(totalExpenses, currency) : "—"}
          </p>
          <p className="text-xs font-semibold text-slate-500">{expensesCount} gastos</p>
        </Link>

        {/* Participants */}
        <Link href={`/trip/${tripId}/participants`} className="card-soft px-4 py-4 flex flex-col gap-1 hover:border-blue-200 transition-colors group min-w-[140px] snap-start sm:min-w-0">
          <div className="flex items-center justify-between">
            <Users className="w-4 h-4 text-blue-400" />
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{participantsCount}</p>
          <p className="text-xs font-semibold text-slate-500">Personas</p>
        </Link>

        {/* Resources */}
        <Link href={`/trip/${tripId}/resources`} className="card-soft px-4 py-4 flex flex-col gap-1 hover:border-amber-200 transition-colors group min-w-[140px] snap-start sm:min-w-0">
          <div className="flex items-center justify-between">
            <FileText className="w-4 h-4 text-amber-500" />
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-400 transition-colors" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{resourcesCount}</p>
          <p className="text-xs font-semibold text-slate-500">Documentos</p>
        </Link>
      </div>

      {/* ── Today's activities (during phase) ───────────────────────────── */}
      {phase === "during" && todayActivities.length > 0 && (
        <div className="card-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-extrabold text-slate-900">Hoy</span>
            </div>
            <Link href={`/trip/${tripId}/plan`} className="text-xs font-semibold text-violet-600 hover:text-violet-800">
              Ver plan →
            </Link>
          </div>
          <div className="space-y-2">
            {todayActivities.slice(0, 5).map((a) => {
              const meta = kindMeta(a.activity_kind);
              return (
                <div key={a.id} className="flex items-center gap-3 py-1.5">
                  <span className="text-base shrink-0">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{a.title}</p>
                    {a.place_name && <p className="text-xs text-slate-400 truncate">{a.place_name}</p>}
                  </div>
                  {a.activity_time && (
                    <span className="text-xs font-bold text-slate-400 shrink-0">{a.activity_time.slice(0, 5)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Next activity (before / during) ─────────────────────────────── */}
      {nextActivity && phase !== "after" && (
        <Link href={`/trip/${tripId}/plan`} className="card-soft p-5 flex items-start gap-4 hover:border-violet-200 transition-colors group">
          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${kindMeta(nextActivity.activity_kind).color}`}>
            {kindMeta(nextActivity.activity_kind).icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Próxima actividad</p>
            <p className="text-sm font-extrabold text-slate-900 truncate">{nextActivity.title}</p>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-semibold text-slate-500">
              {nextActivity.activity_date && <span>{formatShortDate(nextActivity.activity_date)}</span>}
              {nextActivity.activity_time && <span>· {nextActivity.activity_time.slice(0, 5)}</span>}
              {nextActivity.place_name && <span>· {nextActivity.place_name}</span>}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-400 mt-1 shrink-0 transition-colors" />
        </Link>
      )}

      {/* ── Completion summary (after phase) ────────────────────────────── */}
      {phase === "after" && (
        <div className="card-soft p-6 text-center space-y-3">
          <div className="text-4xl">🏁</div>
          <p className="text-lg font-extrabold text-slate-900">¡Viaje completado!</p>
          <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto">
            {activitiesCount} actividades realizadas{totalExpenses > 0 ? ` · ${formatMoney(totalExpenses, currency)} gastado en total` : ""}.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <Link href={`/trip/${tripId}/plan`} className="btn-secondary text-xs py-2 px-4">Ver plan completo</Link>
            <Link href={`/trip/${tripId}/expenses`} className="btn-secondary text-xs py-2 px-4">Ver gastos</Link>
          </div>
        </div>
      )}

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <div className="card-soft p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Accesos rápidos</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Link href={`/trip/${tripId}/plan`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:border-violet-300 hover:bg-violet-50 transition-colors">
            <CalendarDays className="w-3.5 h-3.5 text-violet-500" />Plan del viaje
          </Link>
          <Link href={`/trip/${tripId}/map`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />Mapa y rutas
          </Link>
          <Link href={`/trip/${tripId}/expenses`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50 transition-colors">
            <Wallet className="w-3.5 h-3.5 text-amber-500" />Gastos
          </Link>
          <Link href={`/trip/${tripId}/participants`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <Users className="w-3.5 h-3.5 text-blue-500" />Participantes
          </Link>
          <Link href={`/trip/${tripId}/resources`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <FileText className="w-3.5 h-3.5 text-orange-500" />Documentos
          </Link>
          {isPremium ? (
            <Link href={`/trip/${tripId}/ai-chat`} className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />Asistente IA
            </Link>
          ) : (
            <Link href="/pricing" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-400 hover:border-violet-200 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-slate-300" />Premium
            </Link>
          )}
        </div>
      </div>

      {/* ── AI Insights — brief + packing list ──────────────────────────── */}
      {/* Proactive AI suggestion — shows gap in itinerary if found */}
      {isPremium && <TripAiProactiveHint tripId={tripId} />}

      <TripAiInsights tripId={tripId} isPremium={isPremium} />

    </div>
  );
}

// ── Proactive AI hint ─────────────────────────────────────────────────────────
function TripAiProactiveHint({ tripId }: { tripId: string }) {
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = `kaviro_ai_hint_${tripId}`;
    try {
      const cached = window.sessionStorage.getItem(key);
      if (cached) { setHint(cached === "none" ? null : cached); setLoading(false); return; }
    } catch { /* */ }

    void fetch("/api/trip-ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripId,
        question: "¿Hay algún día con pocas actividades o hueco libre en el plan donde podría sugerir algo? Responde en máximo 1 frase corta y accionable, o 'null' si el plan está bien.",
        mode: "brief",
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        const answer = (d.answer || "").trim();
        const isNull = !answer || answer === "null" || answer.toLowerCase().includes("está bien") || answer.length < 10;
        const value = isNull ? null : answer;
        try { window.sessionStorage.setItem(key, value ?? "none"); } catch { /* */ }
        setHint(value);
      })
      .catch(() => setHint(null))
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading || !hint || dismissed) return null;

  return (
    <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-light)] p-4 flex items-start gap-3">
      <span className="text-lg shrink-0 mt-0.5">✨</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--brand)] mb-1">Sugerencia IA</p>
        <p className="text-sm text-[var(--text-primary)] leading-snug">{hint}</p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-full p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-page)] transition"
        aria-label="Cerrar sugerencia"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4 4l8 8M12 4l-8 8"/>
        </svg>
      </button>
    </div>
  );
}
