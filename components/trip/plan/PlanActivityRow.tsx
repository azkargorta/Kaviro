"use client";

import { Check, GripVertical } from "lucide-react";
import { ActivityReactions } from "@/components/trip/plan/ActivityReactions";
import { effectivePlanKind, getPlanActivityDisplayMeta } from "@/lib/plan-activity-meta";
import type { ActivityVisualState } from "@/lib/trip-activity-visual";
import TripStatusPill from "@/components/trip/ui/TripStatusPill";

type Props = {
  title: string;
  place?: string | null;
  time?: string | null;
  activityKind?: string | null;
  isLodging?: boolean;
  icon?: string;
  customByKey?: Map<string, { label: string; emoji?: string | null; color?: string | null }>;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  dataTour?: string;
  tripId?: string;
  activityId?: string;
  currentUserId?: string | null;
  currentDisplayName?: string;
  showReactions?: boolean;
  visualState?: ActivityVisualState;
};

function statusPillVariant(state: ActivityVisualState): "past" | "current" | "upcoming" | null {
  if (state === "past") return "past";
  if (state === "current") return "current";
  if (state === "upcoming") return "upcoming";
  return null;
}

export default function PlanActivityRow({
  title,
  place,
  time,
  activityKind,
  isLodging = false,
  icon,
  customByKey,
  onClick,
  selectable = false,
  selected = false,
  dragHandleProps,
  isDragging = false,
  dataTour,
  tripId,
  activityId,
  currentUserId = null,
  currentDisplayName = "Yo",
  showReactions = false,
  visualState = "default",
}: Props) {
  const meta = getPlanActivityDisplayMeta(isLodging ? "lodging" : effectivePlanKind({ activity_kind: activityKind }), customByKey);
  const subtitle = (place || "").trim() || "Sin ubicación";
  const timeLabel = (time || "").trim().slice(0, 5) || "—";
  const isPast = visualState === "past";
  const isCurrent = visualState === "current";
  const statusVariant = statusPillVariant(visualState);

  const shellClass =
    isDragging
      ? "border-[var(--brand-border)] bg-[var(--brand-light)] shadow-md ring-1 ring-[var(--brand-border)]/50"
      : selectable && selected
        ? "border-[var(--brand-border)] bg-[var(--brand-light)] ring-2 ring-[var(--brand-border)]/60"
        : isCurrent
          ? "border-[var(--brand-border)] bg-white shadow-[0_4px_14px_rgba(248,113,113,0.12)] ring-1 ring-[var(--brand-border)]/40 dark:bg-[#141c2b]"
          : isPast
            ? "border border-dashed border-slate-200 bg-slate-100/80 dark:border-[#334155] dark:bg-[#0a0e14]/40"
            : visualState === "upcoming"
              ? "border-slate-200/90 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:border-slate-300 dark:border-[#1E293B] dark:bg-[#080C14]"
              : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/80 dark:border-[#1E293B] dark:bg-[#080C14] dark:hover:border-[#334155]";

  return (
    <div
      {...(dataTour ? { "data-tour": dataTour } : {})}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`rounded-xl border transition ${shellClass} ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className={`flex flex-col gap-2.5 p-3 sm:flex-row sm:items-start sm:gap-3 ${isPast ? "opacity-80" : ""}`}>
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {dragHandleProps ? (
            <button
              type="button"
              {...dragHandleProps}
              className="mt-0.5 inline-flex h-8 w-6 shrink-0 cursor-grab items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 active:cursor-grabbing"
              aria-label="Reordenar"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          {selectable ? (
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                selected ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-slate-300 bg-white text-transparent"
              }`}
              aria-hidden
            >
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </span>
          ) : null}
          <span className="mt-0.5 shrink-0 text-xl leading-none" aria-hidden>
            {icon || meta.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={`line-clamp-2 text-xs font-bold leading-snug sm:line-clamp-1 sm:truncate ${
                isPast
                  ? "text-slate-400 line-through decoration-slate-400/70 dark:text-slate-500"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {title}
            </p>
            <p className={`mt-0.5 truncate text-[10px] ${isPast ? "text-slate-400/80" : "text-slate-400"}`}>{subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:ml-auto sm:justify-end">
          <span
            className={`inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-bold tabular-nums ${
              isCurrent
                ? "border-[var(--brand-border)]/60 bg-white text-[var(--brand-text)] dark:bg-[#141c2b]"
                : isPast
                  ? "border-slate-200/80 bg-slate-50 text-slate-400 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-500"
                  : "border-slate-200/80 bg-slate-50 text-slate-700 dark:border-[#334155] dark:bg-[#141c2b] dark:text-slate-200"
            }`}
          >
            {timeLabel}
          </span>
          {statusVariant ? <TripStatusPill variant={statusVariant} /> : null}
        </div>
      </div>

      {showReactions && tripId && activityId ? (
        <div
          className="border-t border-slate-100 px-3 pb-3 pt-2 dark:border-[#1E293B]"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <ActivityReactions
            tripId={tripId}
            activityId={activityId}
            currentUserId={currentUserId}
            displayName={currentDisplayName}
            variant="inline"
          />
        </div>
      ) : null}
    </div>
  );
}
