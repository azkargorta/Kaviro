"use client";

import { MapPin, ArrowRight } from "lucide-react";
import type { TripSkeleton, SkeletonDayType } from "@/lib/trip-planner/types";

const DAY_TYPE_LABEL: Record<SkeletonDayType, string> = {
  arrival: "Llegada",
  departure: "Salida",
  full: "Día completo",
  transfer_scenic: "Traslado panorámico",
  transfer_practical: "Traslado",
  rest: "Descanso",
};

const DAY_TYPE_COLOR: Record<SkeletonDayType, string> = {
  arrival: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  departure: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  full: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  transfer_scenic: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  transfer_practical: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  rest: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
};

type Props = {
  skeleton: TripSkeleton;
};

export default function PlannerSkeleton({ skeleton }: Props) {
  return (
    <div className="space-y-2">
      {skeleton.reasoning && skeleton.reasoning !== "fallback" && (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 px-1 mb-3 italic">
          {skeleton.reasoning}
        </p>
      )}
      {skeleton.days.map((day) => (
        <div
          key={day.dayNum}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-[#1E293B] dark:bg-[#0F1623]"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Día {day.dayNum}
            </span>
            <span className="text-xs text-slate-400">{day.date}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${DAY_TYPE_COLOR[day.dayType]}`}>
              {DAY_TYPE_LABEL[day.dayType]}
            </span>
            <span className="ml-auto flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
              <MapPin className="h-3 w-3 text-violet-500" />
              {day.base}
            </span>
          </div>

          {day.transferFrom && day.transferTo && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
              <span>{day.transferFrom}</span>
              <ArrowRight className="h-3 w-3" />
              <span>{day.transferTo}</span>
            </div>
          )}

          {day.summary && (
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-snug">
              {day.summary}
            </p>
          )}

          {day.mainActivities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {day.mainActivities.map((act) => (
                <span
                  key={act}
                  className="rounded-full bg-violet-50 border border-violet-200 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-300"
                >
                  {act}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
