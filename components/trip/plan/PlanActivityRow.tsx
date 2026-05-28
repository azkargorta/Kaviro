"use client";

import { Check, GripVertical } from "lucide-react";
import { effectivePlanKind, getPlanActivityDisplayMeta } from "@/lib/plan-activity-meta";

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
};

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
}: Props) {
  const meta = getPlanActivityDisplayMeta(isLodging ? "lodging" : effectivePlanKind({ activity_kind: activityKind }), customByKey);
  const subtitle = (place || "").trim() || "Sin ubicación";
  const timeLabel = (time || "").trim().slice(0, 5) || "—";

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
      className={`flex items-start gap-2 rounded-xl border p-3 transition ${
        isDragging
          ? "border-violet-300 bg-violet-50 shadow-md"
          : selectable && selected
            ? "border-violet-400 bg-violet-50 ring-2 ring-violet-300/60"
            : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/80 dark:border-[#1E293B] dark:bg-[#080C14] dark:hover:border-[#334155]"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
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
        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{title}</p>
        <p className="truncate text-[10px] text-slate-400">{subtitle}</p>
      </div>
      <span className="shrink-0 rounded-md bg-[#F87171] px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">{timeLabel}</span>
    </div>
  );
}
