"use client";

import { Clock, MapPin } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import type { RevealDelay } from "@/components/ui/Reveal";
import { getPlanActivityDisplayMeta } from "@/lib/plan-activity-meta";

type Activity = {
  id: string;
  title: string | null;
  activity_date: string | null;
  activity_time: string | null;
  place_name: string | null;
  address: string | null;
  activity_kind: string | null;
  activity_type: string | null;
};

type ShareDay = {
  key: string;
  label: string;
  rows: Activity[];
};

export default function ShareTripItinerary({ days }: { days: ShareDay[] }) {
  if (days.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-600 dark:border-[#334155] dark:bg-[#080C14] dark:text-slate-400">
        Este viaje todavía no tiene actividades en el plan.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {days.map(({ key, label, rows }, dayIdx) => (
        <Reveal
          key={key}
          variant="slide"
          delay={(dayIdx % 4) as RevealDelay}
          as="section"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]"
        >
          {/* Cabecera del día */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3.5 dark:border-[#1E293B] dark:bg-[#080C14]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand,#1e3a5f)] text-xs font-bold text-white">
              {dayIdx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {rows.length} actividad{rows.length === 1 ? "" : "es"}
              </p>
            </div>
          </div>

          {/* Lista de actividades */}
          <div className="divide-y divide-slate-100 dark:divide-[#1E293B]">
            {rows.map((a) => {
              const meta = getPlanActivityDisplayMeta(a.activity_kind || a.activity_type);
              const location = a.place_name || a.address;
              const time = a.activity_time ? a.activity_time.slice(0, 5) : null;

              return (
                <div key={a.id} className="flex items-start gap-3 px-5 py-4">
                  {/* Icono de tipo */}
                  <div
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                    style={{ background: `${meta.color}18` }}
                    aria-hidden
                  >
                    {meta.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-1.5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {a.title || a.place_name || "Actividad"}
                      </p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {time && (
                          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-[#1E293B] dark:text-slate-300">
                            <Clock className="h-2.5 w-2.5" aria-hidden />
                            {time}
                          </span>
                        )}
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{ background: `${meta.color}20`, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </div>
                    {location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                        {location}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      ))}
    </div>
  );
}
