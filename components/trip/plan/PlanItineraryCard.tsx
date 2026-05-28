"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  formatPlanDayTabLabel,
  formatPlanDestinationLabel,
  planParticipantInitials,
} from "@/lib/plan-activity-meta";

const HEADER_ACTION_BTN =
  "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/90 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#F87171] shadow-sm transition hover:bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/80";

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
  canManagePlan?: boolean;
  onAddPlan?: () => void;
};

function PlanParticipantsHeader({ participants }: { participants: string[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (!participants.length) return null;

  const shown = participants.slice(0, 4);
  const extra = participants.length - shown.length;
  const bubbleClass =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white/25 text-[10px] font-bold text-white shadow-sm";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <div
        className="flex flex-wrap items-center justify-end gap-1.5"
        role="group"
        aria-label="Participantes del viaje"
      >
        {shown.map((name, index) => (
          <div key={`${name}-${index}`} title={name} className={bubbleClass}>
            {planParticipantInitials(name)}
          </div>
        ))}
        {extra > 0 ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={`Ver ${participants.length} participantes`}
            className={`${bubbleClass} transition hover:bg-white/40`}
          >
            +{extra}
          </button>
        ) : null}
      </div>
      {open && extra > 0 ? (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-30 mt-2 max-h-56 min-w-[10rem] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-[#1E293B] dark:bg-[#0F1623]"
        >
          {participants.map((name) => (
            <li
              key={name}
              role="option"
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F87171]/15 text-[10px] font-bold text-[#F87171]">
                {planParticipantInitials(name)}
              </span>
              <span className="truncate">{name}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

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
  canManagePlan = false,
  onAddPlan,
}: Props) {
  const destLabel = formatPlanDestinationLabel(destination);
  const hasHeaderActions = Boolean((canManagePlan && onAddPlan) || aiSuggest);
  const hasHeaderParticipants = participants.length > 0;
  const daysScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateDayScrollArrows = useCallback(() => {
    const el = daysScrollRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    updateDayScrollArrows();
    const el = daysScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateDayScrollArrows, { passive: true });
    const ro = new ResizeObserver(updateDayScrollArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateDayScrollArrows);
      ro.disconnect();
    };
  }, [days, updateDayScrollArrows]);

  useEffect(() => {
    const el = daysScrollRef.current;
    if (!el || !selectedDate) return;
    const tab = el.querySelector<HTMLElement>(`[data-plan-day="${selectedDate}"]`);
    tab?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }, [selectedDate, days]);

  function scrollDays(direction: "left" | "right") {
    const el = daysScrollRef.current;
    if (!el) return;
    const delta = Math.max(120, Math.round(el.clientWidth * 0.65));
    el.scrollBy({ left: direction === "left" ? -delta : delta, behavior: "smooth" });
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
      <div data-tour="plan-itinerary-highlight">
      <div className="bg-gradient-to-r from-[#F87171] to-[#EF4444] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {destLabel ? (
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">{destLabel}</p>
            ) : null}
            <p className="mt-0.5 truncate text-lg font-extrabold text-white">{tripName}</p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
            {hasHeaderActions ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {canManagePlan && onAddPlan ? (
                  <button
                    type="button"
                    onClick={() => onAddPlan()}
                    data-tour="plan-add-btn"
                    className={HEADER_ACTION_BTN}
                    title="Añadir plan"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="hidden min-[360px]:inline">Añadir plan</span>
                    <span className="min-[360px]:hidden">Añadir</span>
                  </button>
                ) : null}
                {aiSuggest}
              </div>
            ) : null}
            {hasHeaderActions && hasHeaderParticipants ? (
              <span className="hidden h-7 w-px shrink-0 bg-white/40 sm:block" aria-hidden />
            ) : null}
            {hasHeaderParticipants ? <PlanParticipantsHeader participants={participants} /> : null}
          </div>
        </div>
      </div>

      {days.length > 0 ? (
        <div className="flex items-stretch border-b border-slate-100 bg-slate-50 dark:border-[#1E293B] dark:bg-[#080C14]">
          {canScrollLeft ? (
            <button
              type="button"
              onClick={() => scrollDays("left")}
              className="flex w-9 shrink-0 items-center justify-center border-r border-slate-200 text-[#F87171] transition hover:bg-white dark:border-[#1E293B] dark:hover:bg-[#0F1623]"
              aria-label="Días anteriores"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
          <div
            ref={daysScrollRef}
            className="flex min-w-0 flex-1 overflow-x-auto no-scrollbar"
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
                  data-plan-day={date}
                  aria-selected={isActive}
                  aria-label={tab.date ? `${tab.day}, ${tab.date}` : tab.day}
                  title={tab.date ? `${tab.day} · ${tab.date}` : tab.day}
                  onClick={() => onSelectDate(date)}
                  className={`relative flex min-w-[4.75rem] shrink-0 flex-col items-center justify-center gap-0.5 px-2 py-2.5 transition ${
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
          {canScrollRight ? (
            <button
              type="button"
              onClick={() => scrollDays("right")}
              className="flex w-9 shrink-0 items-center justify-center border-l border-slate-200 text-[#F87171] transition hover:bg-white dark:border-[#1E293B] dark:hover:bg-[#0F1623]"
              aria-label="Días siguientes"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
      </div>

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
