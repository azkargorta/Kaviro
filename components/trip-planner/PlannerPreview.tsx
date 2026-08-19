"use client";

import { FileText, CheckCircle2, Loader2 } from "lucide-react";
import type { TripItinerary, ActivityKind } from "@/lib/trip-planner/types";

const KIND_EMOJI: Record<ActivityKind, string> = {
  culture: "🏛️",
  nature: "🌿",
  viewpoint: "🌄",
  neighborhood: "🧭",
  market: "🧺",
  excursion: "🚌",
  gastro: "🍷",
  shopping: "🛍️",
  night: "🌙",
  transport: "🚗",
  rest: "😴",
};

type Props = {
  itinerary: TripItinerary;
  onCreateTrip: () => void;
  onDownloadPdf: () => void;
  saving?: boolean;
};

export default function PlannerPreview({ itinerary, onCreateTrip, onDownloadPdf, saving = false }: Props) {
  const totalActivities = itinerary.days.reduce((n, d) => n + d.activities.length, 0);

  return (
    <div className="space-y-4">
      <div className="card-soft px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Duración</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{itinerary.days.length} días</p>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Actividades</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{totalActivities} planes</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onDownloadPdf}
            className="btn-secondary flex items-center gap-1.5 text-sm py-2.5 px-4"
          >
            <FileText className="w-3.5 h-3.5" />
            Descargar PDF
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onCreateTrip}
            className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Crear viaje
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {itinerary.days.map((day) => (
          <div key={day.dayNum} className="card-soft overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-violet-500">
                  Día {day.dayNum}
                </span>
                <span className="text-xs text-slate-400">{day.date}</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-auto">
                  {day.base}
                </span>
              </div>
              <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">{day.summary}</p>
            </div>
            <div className="px-5 py-3 space-y-2.5">
              {day.activities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">{KIND_EMOJI[act.kind] ?? "📍"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {act.time && (
                        <span className="text-xs font-bold text-slate-400">{act.time}</span>
                      )}
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {act.title}
                      </span>
                    </div>
                    {act.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {act.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {day.activities.length === 0 && (
                <p className="text-xs text-slate-400 italic">Sin actividades generadas para este día.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
