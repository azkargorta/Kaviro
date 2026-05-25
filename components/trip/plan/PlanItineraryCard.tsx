"use client";

import Link from "next/link";
import {
  formatPlanDayTabLabel,
  formatPlanDestinationLabel,
  planParticipantInitials,
} from "@/lib/plan-activity-meta";

type Props = {
  destination?: string | null;
  tripName: string;
  participants?: string[];
  days: string[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  tripId: string;
  children: React.ReactNode;
  expenseFooter?: React.ReactNode;
  aiSuggest?: React.ReactNode;
};

export default function PlanItineraryCard({
  destination,
  tripName,
  participants = [],
  days,
  selectedDate,
  onSelectDate,
  tripId,
  children,
  expenseFooter,
  aiSuggest,
}: Props) {
  const destLabel = formatPlanDestinationLabel(destination);
  const shown = participants.slice(0, 5);
  const overflow = participants.length - shown.length;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
      <div className="bg-gradient-to-r from-[#F87171] to-[#EF4444] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              {destLabel ? (
                <p className="text-xs font-bold uppercase tracking-widest text-white/70">{destLabel}</p>
              ) : null}
              <p className="mt-0.5 truncate text-lg font-extrabold text-white">{tripName}</p>
            </div>
            {aiSuggest ? <div className="flex shrink-0 items-center self-center">{aiSuggest}</div> : null}
          </div>
          {shown.length ? (
            <div className="flex shrink-0 -space-x-1.5">
              {shown.map((name) => (
                <div
                  key={name}
                  title={name}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-[10px] font-bold text-white"
                >
                  {planParticipantInitials(name)}
                </div>
              ))}
              {overflow > 0 ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-[10px] font-bold text-white">
                  +{overflow}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {days.length > 0 ? (
        <div
          className="flex overflow-x-auto border-b border-slate-100 bg-slate-50 no-scrollbar dark:border-[#1E293B] dark:bg-[#080C14]"
          role="tablist"
          aria-label="Días del itinerario"
        >
          {days.map((date, i) => {
            const isActive = selectedDate === date;
            const tab = formatPlanDayTabLabel(date, i + 1);
            return (
              <button
                key={date}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={tab.date ? `${tab.day}, ${tab.date}` : tab.day}
                title={tab.date ? `${tab.day} · ${tab.date}` : tab.day}
                onClick={() => onSelectDate(date)}
                className={`relative flex min-w-[4.75rem] flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2.5 transition ${
                  isActive ? "text-[#F87171]" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <span className="text-xs font-bold leading-none">{tab.day}</span>
                {tab.date ? (
                  <span
                    className={`text-[10px] font-semibold leading-none ${
                      isActive ? "text-[#F87171]/80" : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {tab.date}
                  </span>
                ) : null}
                {isActive ? (
                  <span aria-hidden className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#F87171]" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="p-4">{children}</div>

      {expenseFooter ?? (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-[#1E293B]">
          <Link
            href={`/trip/${tripId}/expenses`}
            className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <span>Gastos del grupo</span>
            <span className="text-[#F87171]">Ver gastos →</span>
          </Link>
        </div>
      )}
    </div>
  );
}
