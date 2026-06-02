"use client";

import Reveal from "@/components/ui/Reveal";
import type { RevealDelay } from "@/components/ui/Reveal";

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
    <div className="space-y-5">
      {days.map(({ key, label, rows }, dayIdx) => (
        <Reveal
          key={key}
          variant="slide"
          delay={(dayIdx % 4) as RevealDelay}
          as="section"
          className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-[#1E293B] dark:bg-[#0F1623]"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">{label}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {rows.length} actividad{rows.length === 1 ? "" : "es"}
              </p>
            </div>
          </div>
          <div className="motion-stagger-list mt-4 space-y-3">
            {rows.map((a) => (
              <div
                key={a.id}
                className="motion-stagger-item trip-card-hover rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1E293B] dark:bg-[#080C14]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-950 dark:text-white">
                      {a.title || a.place_name || "Actividad"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {(a.place_name || a.address || "Ubicación pendiente") +
                        (a.activity_time ? ` · ${a.activity_time.slice(0, 5)}` : "")}
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 dark:bg-[#1E293B] dark:text-slate-200">
                    {a.activity_kind || a.activity_type || "Plan"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      ))}
    </div>
  );
}
