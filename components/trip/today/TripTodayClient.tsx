"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Reveal from "@/components/ui/Reveal";
import { MapPin, Clock, ChevronRight, Navigation, Phone } from "lucide-react";
import TripHighlightCard from "@/components/trip/ui/TripHighlightCard";
import TripActivityCard from "@/components/trip/ui/TripActivityCard";
import TripEmptyState from "@/components/trip/ui/TripEmptyState";
import TripPanel from "@/components/trip/ui/TripPanel";
import { resolveTodayDayTimeline } from "@/lib/trip-activity-visual";

type Activity = {
  id: string;
  title: string;
  description?: string | null;
  activity_date?: string | null;
  activity_time?: string | null;
  place_name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  activity_kind?: string | null;
  activity_type?: string | null;
};

const KIND_META: Record<string, { icon: string; color: string; bg: string }> = {
  culture: { icon: "🏛️", color: "text-amber-800", bg: "bg-amber-50 dark:bg-amber-900/20" },
  nature: { icon: "🌿", color: "text-emerald-800", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  viewpoint: { icon: "🌄", color: "text-sky-800", bg: "bg-sky-50 dark:bg-sky-900/20" },
  neighborhood: { icon: "🧭", color: "text-slate-700", bg: "bg-slate-50 dark:bg-[#1E293B]" },
  market: { icon: "🧺", color: "text-orange-800", bg: "bg-orange-50" },
  excursion: { icon: "🚌", color: "text-blue-800", bg: "bg-blue-50" },
  gastro_experience: { icon: "🍷", color: "text-pink-800", bg: "bg-pink-50" },
  shopping: { icon: "🛍️", color: "text-purple-800", bg: "bg-purple-50" },
  night: { icon: "🌙", color: "text-indigo-800", bg: "bg-indigo-50" },
  transport: { icon: "✈️", color: "text-slate-600", bg: "bg-slate-50 dark:bg-[#1E293B]" },
};

function kindMeta(kind?: string | null) {
  return KIND_META[kind || ""] ?? { icon: "📍", color: "text-slate-700", bg: "bg-slate-50 dark:bg-[#1E293B]" };
}

function formatTime(time: string | null | undefined) {
  if (!time) return null;
  return time.slice(0, 5);
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(
    new Date(`${d}T12:00:00`)
  );
}

function buildGmapsUrl(activity: Activity): string | null {
  if (activity.latitude && activity.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${activity.latitude},${activity.longitude}`;
  }
  if (activity.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.address)}`;
  }
  return null;
}

type Props = {
  tripId: string;
  tripName: string;
  destination: string | null;
  today: string;
  isActive: boolean;
  tripStart: string;
  tripEnd: string;
  todayActivities: Activity[];
  upcoming: Activity[];
  canEdit: boolean;
};

export default function TripTodayClient({
  tripId,
  tripName,
  destination,
  today,
  isActive,
  tripStart,
  tripEnd,
  todayActivities,
  upcoming,
  canEdit,
}: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp_c: number; description: string; icon: string } | null>(null);

  useEffect(() => {
    if (!destination) return;
    void fetch(`/api/weather?destination=${encodeURIComponent(destination)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.temp_c != null) setWeather(d);
      })
      .catch(() => {});
  }, [destination]);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const nowHHMM = currentTime.toTimeString().slice(0, 5);
  const { sorted: sortedTodayActivities, spotlight: currentActivity, next: nextActivity, stateFor } =
    resolveTodayDayTimeline(todayActivities, nowHHMM);

  if (!isActive) {
    return (
      <TripEmptyState
        icon="📅"
        title={tripName}
        description={
          today < tripStart
            ? `El viaje empieza el ${formatDate(tripStart)}`
            : `El viaje terminó el ${formatDate(tripEnd)}`
        }
        action={
          <Link href={`/trip/${tripId}/plan`} className="btn-primary px-5 py-2.5 text-sm">
            Ver el plan completo
          </Link>
        }
        className="min-h-[50vh] md:min-h-0"
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-col bg-slate-900 text-white md:gap-5 md:bg-transparent md:text-[var(--text-primary)]">
      {/* Header */}
      <Reveal
        variant="fade"
        className="bg-gradient-to-b from-slate-900 to-slate-800 px-4 pb-3 pt-4 pt-safe-top md:card-soft md:from-transparent md:to-transparent md:bg-[var(--surface-card)] md:px-6 md:py-5 md:pt-5"
      >
        <div className="mb-1 flex items-center justify-between">
          <Link
            href={`/trip/${tripId}`}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 md:hidden"
          >
            ← {tripName}
          </Link>
          <span className="hidden text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] md:inline">
            Modo día
          </span>
          <span className="text-xs font-semibold text-slate-400 md:text-[var(--text-secondary)]">
            {currentTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <h1 className="text-xl font-bold capitalize tracking-tight text-white md:text-2xl md:text-[var(--text-primary)]">
          {formatDate(today)}
        </h1>
        {destination ? (
          <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-slate-400 md:text-[var(--text-secondary)]">
            <MapPin className="h-3.5 w-3.5" />
            {destination}
          </p>
        ) : null}
        {weather ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl">{weather.icon ?? "🌤️"}</span>
            <span className="text-lg font-bold text-white md:text-[var(--text-primary)]">
              {Math.round(weather.temp_c ?? 0)}°C
            </span>
            <span className="text-sm capitalize text-slate-400 md:text-[var(--text-secondary)]">
              {weather.description ?? ""}
            </span>
          </div>
        ) : null}
      </Reveal>

      {/* Current activity spotlight */}
      {currentActivity ? (
        <Reveal variant="scale" className="mx-4 mt-4 md:mx-0 md:mt-0">
          <TripHighlightCard eyebrow="Ahora mismo" variant="coral" className="max-md:border-0 max-md:bg-gradient-to-br max-md:from-[#F87171] max-md:to-[#EF4444] max-md:text-white max-md:shadow-none max-md:ring-0">
            <div className="flex items-start gap-3">
              <span className="shrink-0 text-3xl md:flex md:h-11 md:w-11 md:items-center md:justify-center md:rounded-xl md:bg-white md:text-2xl md:shadow-sm md:ring-1 md:ring-[var(--brand-border)]">
                {kindMeta(currentActivity.activity_kind).icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-extrabold leading-tight max-md:text-white md:text-slate-900 dark:md:text-white">
                  {currentActivity.title}
                </p>
                {currentActivity.place_name ? (
                  <p className="mt-0.5 text-sm max-md:text-white/80 md:text-slate-600 dark:md:text-slate-300">
                    {currentActivity.place_name}
                  </p>
                ) : null}
                {currentActivity.description ? (
                  <p className="mt-1 line-clamp-2 text-xs max-md:text-white/75 md:text-slate-500 dark:md:text-slate-400">
                    {currentActivity.description}
                  </p>
                ) : null}
              </div>
            </div>
            {buildGmapsUrl(currentActivity) ? (
              <a
                href={buildGmapsUrl(currentActivity)!}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-white/20 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/30 md:bg-[var(--brand)] md:hover:bg-[var(--brand-hover)]"
              >
                <Navigation className="h-4 w-4" />
                Cómo llegar
              </a>
            ) : null}
          </TripHighlightCard>
        </Reveal>
      ) : null}

      {/* Next activity */}
      {nextActivity ? (
        <Reveal
          variant="slide"
          delay={1}
          className="mx-4 mt-3 md:mx-0 md:mt-0"
        >
          <TripPanel className="flex items-center gap-3 max-md:border-0 max-md:bg-slate-800 max-md:text-white" padding="sm">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${kindMeta(nextActivity.activity_kind).bg}`}
          >
            {kindMeta(nextActivity.activity_kind).icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 md:text-[var(--text-tertiary)]">
              Próximo
            </p>
            <p className="truncate text-sm font-bold md:text-[var(--text-primary)]">{nextActivity.title}</p>
            {formatTime(nextActivity.activity_time) ? (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400 md:text-[var(--text-secondary)]">
                <Clock className="h-3 w-3" />
                {formatTime(nextActivity.activity_time)}
              </p>
            ) : null}
          </div>
          {buildGmapsUrl(nextActivity) ? (
            <a
              href={buildGmapsUrl(nextActivity)!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-700 transition hover:bg-slate-600 md:border md:border-[var(--border-default)] md:bg-slate-50 md:hover:bg-slate-100 dark:md:bg-slate-800 dark:md:hover:bg-slate-700"
            >
              <Navigation className="h-4 w-4 text-slate-300 md:text-[var(--text-secondary)]" />
            </a>
          ) : null}
          </TripPanel>
        </Reveal>
      ) : null}

      {/* Today's full schedule */}
      {todayActivities.length > 0 ? (
        <Reveal variant="fade" delay={2} className="mx-4 mt-4 md:mx-0 md:mt-0">
          <TripPanel padding="none" className="overflow-hidden max-md:border-0 max-md:bg-slate-800">
          <div className="border-b border-slate-700 px-4 py-3 md:border-slate-100 dark:md:border-[#1E293B]">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 md:text-slate-500">
              Plan de hoy — {todayActivities.length} actividades
            </p>
          </div>
          <div className="motion-stagger-list space-y-2 p-3">
            {sortedTodayActivities.map((a) => {
              const meta = kindMeta(a.activity_kind);
              const visualState = stateFor(a);
              const mapsUrl = buildGmapsUrl(a);
              return (
                <TripActivityCard key={a.id} state={visualState} className="motion-stagger-item !py-3 max-md:!border-slate-700 max-md:!bg-slate-800/60">
                  <div className="flex items-center gap-3 pr-12">
                    <span className={`shrink-0 text-xl ${visualState === "past" ? "grayscale opacity-70" : ""}`}>{meta.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-semibold ${
                          visualState === "past"
                            ? "text-slate-400 line-through max-md:text-slate-500"
                            : "max-md:text-white md:text-slate-900 dark:md:text-white"
                        }`}
                      >
                        {a.title}
                      </p>
                      {formatTime(a.activity_time) ? (
                        <p className="text-xs text-slate-400 md:text-slate-500">{formatTime(a.activity_time)}</p>
                      ) : null}
                    </div>
                    {mapsUrl ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-slate-500 hover:text-[var(--brand)] max-md:text-slate-400"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                </TripActivityCard>
              );
            })}
          </div>
          </TripPanel>
        </Reveal>
      ) : null}

      {todayActivities.length === 0 ? (
        <div className="mx-4 mt-4 md:mx-0 md:mt-0">
          <TripEmptyState
            title="Sin actividades hoy"
            description="No hay nada programado para este día."
            action={
              canEdit ? (
                <Link
                  href={`/trip/${tripId}/plan`}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--brand-hover)] max-md:shadow-md"
                >
                  Añadir al plan
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : undefined
            }
            className="max-md:border-0 max-md:bg-slate-800"
          />
        </div>
      ) : null}

      {/* Upcoming days preview */}
      {upcoming.length > 0 ? (
        <div className="mx-4 mb-8 mt-4 md:mx-0 md:mb-0 md:mt-0">
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-slate-500 md:text-[var(--text-tertiary)]">
            Próximos días
          </p>
          <div className="space-y-2">
            {upcoming.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-2xl bg-slate-800/60 px-4 py-3 md:card-soft md:bg-[var(--surface-card)]"
              >
                <span className="shrink-0 text-lg">{kindMeta(a.activity_kind).icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold md:text-[var(--text-primary)]">{a.title}</p>
                  {a.activity_date ? (
                    <p className="text-xs text-slate-400 md:text-[var(--text-secondary)]">
                      {formatDate(a.activity_date)}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Emergency numbers */}
      <div className="mx-4 mb-safe-bottom mb-8 mt-auto pt-4 md:mx-0 md:mb-0 md:mt-0 md:pt-0">
        <a
          href="tel:112"
          className="flex items-center justify-center gap-2 rounded-2xl border border-red-800 bg-red-900/30 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-900/50 md:border-red-200 md:bg-red-50 md:text-red-700 md:hover:bg-red-100 dark:md:border-red-900 dark:md:bg-red-950/40 dark:md:text-red-300"
        >
          <Phone className="h-4 w-4" />
          Emergencias: 112
        </a>
      </div>
    </div>
  );
}
