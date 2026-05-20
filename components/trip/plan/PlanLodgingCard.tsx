"use client";

import { Check, Star } from "lucide-react";
import PlanCardActions from "@/components/trip/plan/PlanCardActions";

type PlanLodging = {
  id: string;
  title: string;
  description?: string | null;
  rating?: number | null;
  comment?: string | null;
  activity_date?: string | null;
  activity_time?: string | null;
  place_name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type Props = {
  activity: PlanLodging;
  onEdit?: (activity: PlanLodging) => void;
  onDelete?: (activity: PlanLodging) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
};

function buildGoogleMapsUrl(activity: PlanLodging) {
  if (typeof activity.latitude === "number" && typeof activity.longitude === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${activity.latitude},${activity.longitude}`;
  }

  const query = activity.address || activity.place_name || activity.title;
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function PlanLodgingCard({
  activity,
  onEdit,
  onDelete,
  selectable,
  selected,
  onToggleSelect,
}: Props) {
  const googleMapsUrl = buildGoogleMapsUrl(activity);
  const rating = typeof activity.rating === "number" ? Math.max(1, Math.min(5, Math.round(activity.rating))) : null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] ${selectable ? "cursor-pointer ring-offset-2 transition hover:ring-2 hover:ring-violet-400/80" : ""} ${selected ? "ring-2 ring-violet-600 dark:ring-[#F87171]" : ""}`}
      onClick={selectable && onToggleSelect ? () => onToggleSelect() : undefined}
      onKeyDown={
        selectable && onToggleSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggleSelect();
              }
            }
          : undefined
      }
      role={selectable ? "button" : undefined}
      tabIndex={selectable ? 0 : undefined}
    >
      {/* P6 — Left violet stripe */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-violet-500 dark:bg-[#F87171]" aria-hidden />

      {selectable ? (
        <button
          type="button"
          className={`absolute left-5 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-sm ${
            selected ? "border-violet-600 bg-violet-600 text-white dark:border-[#F87171] dark:bg-[#F87171]" : "border-slate-300 bg-white text-transparent dark:border-[#334155] dark:bg-[#0F1623]"
          }`}
          aria-label={selected ? "Quitar selección" : "Seleccionar"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
        >
          <Check className="h-4 w-4 stroke-[3]" />
        </button>
      ) : null}
      <div className="flex items-start gap-3 pl-4 pr-3 py-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-lg" aria-hidden>
          🏨
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
              Alojamiento
            </span>
            {activity.activity_time ? (
              <span className="ml-auto shrink-0 inline-flex items-center rounded-lg bg-violet-100 px-2.5 py-1 text-[12px] font-bold tabular-nums text-violet-800">
                {activity.activity_time.slice(0, 5)}
              </span>
            ) : null}
          </div>

          <PlanCardActions
            placement="inline"
            googleMapsUrl={googleMapsUrl}
            onEdit={onEdit}
            onDelete={onDelete}
            item={activity}
            accent="violet"
            disableEdit={!onEdit}
            disableDelete={!onDelete}
            disabledReason={!onEdit || !onDelete ? "No disponible" : undefined}
            stopPropagation={Boolean(selectable)}
          />

          <h4 className="text-[14px] font-semibold leading-snug text-slate-900 dark:text-white">{activity.title}</h4>

          <div className="mt-1.5 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            {activity.activity_date ? (
              <p>{activity.activity_date}</p>
            ) : null}
            {activity.place_name ? <p>{activity.place_name}</p> : null}
            {activity.address ? <p>{activity.address}</p> : null}
            {activity.description ? <p className="text-slate-600 dark:text-slate-400">{activity.description}</p> : null}
            {rating ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-900/40 dark:bg-[#1E293B] dark:text-amber-300">
                <div className="flex items-center gap-1" aria-label={`${rating} de 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < rating ? "fill-current text-amber-500" : "text-amber-200"}`}
                      aria-hidden
                    />
                  ))}
                </div>
                <span className="text-amber-900/70">{rating}/5</span>
              </div>
            ) : null}
            {activity.comment ? (
              <p className="mt-2 rounded-xl border border-violet-200 bg-white/70 px-3 py-2 text-sm text-slate-700 dark:border-[#1E293B] dark:bg-[#1E293B]/40 dark:text-slate-300">
                {activity.comment}
              </p>
            ) : null}
            {typeof activity.latitude === "number" && typeof activity.longitude === "number" ? (
              <p className="text-xs text-violet-700">
                {activity.latitude.toFixed(6)}, {activity.longitude.toFixed(6)}
              </p>
            ) : null}
          </div>
        </div>

      </div>

    </div>
  );
}
