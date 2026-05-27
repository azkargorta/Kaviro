"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, RefreshCw, Users } from "lucide-react";
import { useTripActivityReactions } from "@/hooks/useTripActivityReactions";
import { REACTION_META, type ActivityReactionStats } from "@/lib/activity-reactions";
import type { TripActivity } from "@/hooks/useTripActivities";

function groupByDate(activities: TripActivity[]) {
  const groups = new Map<string, TripActivity[]>();
  for (const activity of activities) {
    const key = activity.activity_date || "Sin fecha";
    const prev = groups.get(key) || [];
    prev.push(activity);
    groups.set(key, prev);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function formatDayLabel(dateKey: string) {
  if (dateKey === "Sin fecha") return "Sin fecha";
  const d = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function formatTime(t: string | null | undefined) {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(t.trim());
  if (!m) return t;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function ReactionCounts({ stats }: { stats: ActivityReactionStats }) {
  if (stats.total === 0) {
    return <span className="text-xs font-semibold text-slate-400">Sin respuestas</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {stats.join > 0 ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${REACTION_META.join.chipClass}`}
        >
          {REACTION_META.join.icon} {stats.join}
        </span>
      ) : null}
      {stats.maybe > 0 ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${REACTION_META.maybe.chipClass}`}
        >
          {REACTION_META.maybe.icon} {stats.maybe}
        </span>
      ) : null}
      {stats.skip > 0 ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${REACTION_META.skip.chipClass}`}
        >
          {REACTION_META.skip.icon} {stats.skip}
        </span>
      ) : null}
    </div>
  );
}

function ActivityAttendanceRow({
  activity,
  stats,
  participantCount,
  onOpen,
}: {
  activity: TripActivity;
  stats: ActivityReactionStats;
  participantCount: number | null;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const time = formatTime(activity.activity_time);
  const pending =
    participantCount != null && participantCount > stats.total
      ? participantCount - stats.total
      : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
      <button
        type="button"
        onClick={() => {
          if (stats.total > 0) setOpen((v) => !v);
          else onOpen?.();
        }}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50/80 dark:hover:bg-[#1E293B]/40"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{activity.title}</p>
          {time ? <p className="mt-0.5 text-xs text-slate-500">{time}</p> : null}
          {activity.place_name ? (
            <p className="mt-0.5 truncate text-xs text-slate-500">{activity.place_name}</p>
          ) : null}
          {stats.join > 0 && !open ? (
            <p className="mt-1.5 text-xs text-emerald-800 dark:text-emerald-300">
              <span className="font-semibold">Van: </span>
              {stats.joiners.map((r) => r.display_name).join(", ")}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <ReactionCounts stats={stats} />
          {pending != null && pending > 0 ? (
            <span className="text-[11px] font-semibold text-slate-400">
              {pending} sin responder
            </span>
          ) : null}
          {stats.total > 0 ? (
            open ? (
              <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
            )
          ) : onOpen ? (
            <span className="text-[11px] font-bold text-[var(--brand)]">Apuntarse</span>
          ) : null}
        </div>
      </button>

      {open && stats.total > 0 ? (
        <div className="space-y-2 border-t border-slate-100 px-4 py-3 dark:border-[#1E293B]">
          {(["join", "maybe", "skip"] as const).map((kind) => {
            const list =
              kind === "join" ? stats.joiners : kind === "maybe" ? stats.maybes : stats.skips;
            if (!list.length) return null;
            const meta = REACTION_META[kind];
            return (
              <div key={kind}>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {meta.icon} {meta.label} ({list.length})
                </p>
                <ul className="mt-1 space-y-0.5">
                  {list.map((r) => (
                    <li key={r.id} className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{r.display_name}</span>
                      {r.comment ? (
                        <span className="text-slate-400"> — {r.comment}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="text-xs font-bold text-[var(--brand)] hover:underline"
            >
              Ver actividad y cambiar tu respuesta
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  tripId: string;
  activities: TripActivity[];
  enabled?: boolean;
  onActivityClick?: (activity: TripActivity) => void;
};

export default function PlanAttendanceSummary({
  tripId,
  activities,
  enabled = true,
  onActivityClick,
}: Props) {
  const { byActivity, participantCount, tableReady, loading, error, reload } =
    useTripActivityReactions(tripId, enabled);

  const grouped = useMemo(() => groupByDate(activities), [activities]);

  const totals = useMemo(() => {
    let withResponses = 0;
    let totalJoin = 0;
    let totalMaybe = 0;
    let totalSkip = 0;
    for (const a of activities) {
      const s = byActivity.get(a.id);
      if (s && s.total > 0) withResponses += 1;
      if (s) {
        totalJoin += s.join;
        totalMaybe += s.maybe;
        totalSkip += s.skip;
      }
    }
    return {
      activities: activities.length,
      withResponses,
      withoutResponses: activities.length - withResponses,
      totalJoin,
      totalMaybe,
      totalSkip,
    };
  }, [activities, byActivity]);

  if (!activities.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center dark:border-[#334155] dark:bg-[#080C14]">
        <Users className="mx-auto h-8 w-8 text-slate-400" aria-hidden />
        <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Aún no hay actividades en el plan
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Cuando añadas planes al itinerario, aquí verás quién se apunta a cada uno.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Resumen de <strong className="text-slate-900 dark:text-slate-100">¿Te apuntas?</strong> por
            actividad. Cada persona elige Sí, No o Quizás desde el detalle de la actividad.
          </p>
          {participantCount != null && participantCount > 0 ? (
            <p className="mt-1 text-xs text-slate-500">
              Viaje con <strong>{participantCount}</strong>{" "}
              {participantCount === 1 ? "participante" : "participantes"}.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          disabled={loading}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Actualizar
        </button>
      </div>

      {tableReady === false ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Falta la tabla de respuestas en Supabase. Ejecuta{" "}
          <code className="rounded bg-amber-100 px-1 text-xs">docs/tripboard_activity_reactions.sql</code> y
          vuelve a cargar.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-[#1E293B] dark:bg-[#080C14]">
          <p className="text-[11px] font-semibold text-slate-500">Actividades</p>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{totals.activities}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-3 py-3">
          <p className="text-[11px] font-semibold text-emerald-800">Total «Sí»</p>
          <p className="mt-1 text-2xl font-bold text-emerald-950">
            {loading && !totals.totalJoin ? "…" : totals.totalJoin}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-3 py-3">
          <p className="text-[11px] font-semibold text-amber-900">«Quizás»</p>
          <p className="mt-1 text-2xl font-bold text-amber-950">
            {loading && !totals.totalMaybe ? "…" : totals.totalMaybe}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-[#1E293B] dark:bg-[#0F1623]">
          <p className="text-[11px] font-semibold text-slate-500">Sin ninguna respuesta</p>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
            {loading && totals.withoutResponses === totals.activities ? "…" : totals.withoutResponses}
          </p>
        </div>
      </div>

      {loading && !byActivity.size ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando respuestas…
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dateKey, dayActivities]) => (
            <section key={dateKey} className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
                {formatDayLabel(dateKey)}
              </h3>
              <div className="space-y-2">
                {dayActivities.map((activity) => (
                  <ActivityAttendanceRow
                    key={activity.id}
                    activity={activity}
                    stats={byActivity.get(activity.id) ?? {
                      join: 0,
                      skip: 0,
                      maybe: 0,
                      total: 0,
                      joiners: [],
                      maybes: [],
                      skips: [],
                    }}
                    participantCount={participantCount}
                    onOpen={onActivityClick ? () => onActivityClick(activity) : undefined}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
