"use client";

import type { RefObject } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatItineraryDayOneLine } from "@/lib/plan-activity-meta";
import {
  collectItineraryItemKeys,
  itineraryItemKey,
  type ItineraryDraftPayload,
} from "@/lib/trip-ai/itineraryDraftUtils";
import PlanImportCardsStatusBanner, {
  type PlanImportCardsStatus,
} from "@/components/trip/plan/PlanImportCardsStatusBanner";
import type { TripAiChatLayout } from "@/components/trip/ai/tripAiModeConfig";

export type ItineraryDayNav = {
  dayIndex: number;
  day: ItineraryDraftPayload["days"][number] | null;
  activityCount: number;
  safeActivityIndex: number;
};

export type TripAiItineraryReviewPanelProps = {
  layout: TripAiChatLayout;
  planImportOnly: boolean;
  itineraryFillsDrawer: boolean;
  isMobileDrawer: boolean;
  reviewingItineraryDraft: boolean;
  itineraryDraft: ItineraryDraftPayload;
  importCardsStatus: PlanImportCardsStatus | null;
  itinerarySelected: Set<string>;
  itinerarySelectedCount: number;
  itineraryItemTotal: number;
  expandedDay: number | null;
  itineraryDayNav: ItineraryDayNav;
  dayStripEdges: { left: boolean; right: boolean };
  dayStripRef: RefObject<HTMLDivElement | null>;
  executingPlan: boolean;
  executeProgress: { current: number; total: number; activitiesCreated: number } | null;
  loading: boolean;
  itineraryConflictDates: string[];
  onFullscreenReviewChange: (value: boolean) => void;
  onItinerarySelectedChange: (next: Set<string>) => void;
  onExpandedDayChange: (day: number) => void;
  onActivityIndexReset: () => void;
  onActivityIndexChange: (updater: (index: number) => number) => void;
  onSetActivityIndex: (index: number) => void;
  onScrollDayStrip: (direction: "left" | "right") => void;
  onExecuteAdd: () => void;
  onOpenConflict: () => void;
  onDiscard: () => void;
  onDismissImportReady: () => void;
};

export default function TripAiItineraryReviewPanel({
  layout,
  planImportOnly,
  itineraryFillsDrawer,
  isMobileDrawer,
  reviewingItineraryDraft,
  itineraryDraft,
  importCardsStatus,
  itinerarySelected,
  itinerarySelectedCount,
  itineraryItemTotal,
  expandedDay,
  itineraryDayNav,
  dayStripEdges,
  dayStripRef,
  executingPlan,
  executeProgress,
  loading,
  itineraryConflictDates,
  onFullscreenReviewChange,
  onItinerarySelectedChange,
  onExpandedDayChange,
  onActivityIndexReset,
  onActivityIndexChange,
  onSetActivityIndex,
  onScrollDayStrip,
  onExecuteAdd,
  onOpenConflict,
  onDiscard,
  onDismissImportReady,
}: TripAiItineraryReviewPanelProps) {
  return (
    <section
      className={`rounded-2xl border border-[var(--brand-border)] bg-gradient-to-br from-[var(--brand-light)] via-white to-slate-50 shadow-sm ${
        layout === "drawer"
          ? itineraryFillsDrawer
            ? "flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4"
            : isMobileDrawer
              ? "flex min-h-[min(52dvh,560px)] shrink-0 flex-col overflow-hidden p-2 sm:p-4"
              : "flex max-h-[min(44dvh,400px)] min-h-0 shrink-0 flex-col overflow-hidden p-3 sm:p-4"
          : planImportOnly
            ? "flex min-h-[min(56vh,520px)] flex-col overflow-hidden p-4 sm:p-5"
            : layout === "page"
              ? "flex max-h-[min(82vh,860px)] min-h-[min(48vh,420px)] flex-col overflow-hidden p-4 sm:p-5 xl:max-h-[calc(100dvh-10rem)]"
              : "flex max-h-[min(85vh,820px)] min-h-0 flex-col overflow-hidden p-5"
      }`}
    >
      <div
        className={`flex min-h-0 flex-1 flex-col gap-2 ${
          layout === "page" ? "overflow-y-auto overscroll-y-contain" : "overflow-hidden"
        }`}
      >
        {importCardsStatus?.phase === "ready" && planImportOnly ? (
          <PlanImportCardsStatusBanner status={importCardsStatus} compact onDismissReady={onDismissImportReady} />
        ) : null}

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-text)]">
              Itinerario propuesto
            </div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">
              {itineraryDraft.title || `${itineraryDraft.days.length} días`}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-600">
              Navega por día y parada. Marca y valida antes de añadir.
              {layout === "drawer" && itineraryFillsDrawer ? (
                <>
                  {" "}
                  <button
                    type="button"
                    className="font-semibold text-[var(--brand-text)] underline decoration-[var(--brand-border)] underline-offset-2 hover:no-underline"
                    onClick={() => onFullscreenReviewChange(false)}
                  >
                    Volver al chat
                  </button>
                </>
              ) : layout === "drawer" && reviewingItineraryDraft && !itineraryFillsDrawer ? (
                <>
                  {" "}
                  <button
                    type="button"
                    className="font-semibold text-[var(--brand-text)] underline decoration-[var(--brand-border)] underline-offset-2 hover:no-underline"
                    onClick={() => onFullscreenReviewChange(true)}
                  >
                    Ampliar tarjetas
                  </button>
                </>
              ) : null}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span>
                Seleccionadas: <strong className="text-slate-900">{itinerarySelectedCount}</strong> /{" "}
                {itineraryItemTotal}
              </span>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200"
                onClick={() => onItinerarySelectedChange(collectItineraryItemKeys(itineraryDraft))}
              >
                Todas
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200"
                onClick={() => onItinerarySelectedChange(new Set())}
              >
                Ninguna
              </button>
            </div>
          </div>
          <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
            <button
              type="button"
              disabled={executingPlan || loading || itinerarySelectedCount === 0}
              onClick={() => {
                if (itineraryConflictDates.length) {
                  onOpenConflict();
                  return;
                }
                onExecuteAdd();
              }}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--brand-hover)] disabled:opacity-60 sm:flex-none sm:text-sm"
            >
              {executingPlan
                ? executeProgress
                  ? `Día ${executeProgress.current}/${executeProgress.total} · ${executeProgress.activitiesCreated} añad.`
                  : "Añadiendo…"
                : itinerarySelectedCount === itineraryItemTotal
                  ? "Añadir todo"
                  : `Añadir (${itinerarySelectedCount})`}
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:flex-none sm:text-sm dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
            >
              Descartar
            </button>
          </div>
        </div>

        <div className="relative shrink-0 min-w-0">
          {dayStripEdges.left ? (
            <button
              type="button"
              aria-label="Ver días anteriores"
              onClick={() => onScrollDayStrip("left")}
              className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1 text-slate-700 shadow-md dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-200"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          {dayStripEdges.right ? (
            <button
              type="button"
              aria-label="Ver más días"
              onClick={() => onScrollDayStrip("right")}
              className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1 text-slate-700 shadow-md dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-200"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <div ref={dayStripRef} className="flex gap-1.5 overflow-x-auto py-0.5 pl-7 pr-7 [scrollbar-width:thin]">
            {itineraryDraft.days.map((d) => (
              <button
                key={d.day}
                type="button"
                onClick={() => {
                  onExpandedDayChange(d.day);
                  onActivityIndexReset();
                }}
                className={`max-w-[10.5rem] shrink-0 snap-start rounded-lg border px-2 py-1 text-left transition ${
                  expandedDay === d.day
                    ? "border-[var(--brand-border)] bg-[var(--brand-light)] dark:border-[#F87171]/40 dark:bg-[#F87171]/10"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623]"
                }`}
              >
                <div className="truncate whitespace-nowrap text-[10px] font-bold leading-tight text-slate-900">
                  {formatItineraryDayOneLine(d.day, d.date)}
                </div>
                <div className="truncate whitespace-nowrap text-[10px] leading-tight text-slate-600">
                  {(d.items ?? []).length} par.
                </div>
              </button>
            ))}
          </div>
        </div>

        {expandedDay != null && itineraryDayNav.day ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623]">
            <div className="mx-auto flex w-full max-w-[17rem] shrink-0 items-center justify-between gap-1 border-b border-slate-100 px-1.5 py-1 dark:border-[#1E293B]">
              <button
                type="button"
                disabled={itineraryDayNav.dayIndex <= 0}
                onClick={() => {
                  const prev = itineraryDraft.days[itineraryDayNav.dayIndex - 1];
                  if (!prev) return;
                  onExpandedDayChange(prev.day);
                  onActivityIndexReset();
                }}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-700 disabled:opacity-40 dark:border-[#334155] dark:text-slate-200"
                aria-label="Día anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
              <p
                className="min-w-0 flex-1 truncate whitespace-nowrap text-center text-[10px] font-extrabold text-slate-900"
                title={formatItineraryDayOneLine(expandedDay, itineraryDayNav.day.date)}
              >
                {formatItineraryDayOneLine(expandedDay, itineraryDayNav.day.date)}
              </p>
              <button
                type="button"
                disabled={itineraryDayNav.dayIndex >= itineraryDraft.days.length - 1}
                onClick={() => {
                  const next = itineraryDraft.days[itineraryDayNav.dayIndex + 1];
                  if (!next) return;
                  onExpandedDayChange(next.day);
                  onActivityIndexReset();
                }}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-700 disabled:opacity-40 dark:border-[#334155] dark:text-slate-200"
                aria-label="Día siguiente"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>

            <div className="mx-auto flex w-full max-w-[12rem] shrink-0 items-center justify-between gap-1 border-b border-slate-100 px-1.5 py-1 dark:border-[#1E293B]">
              <button
                type="button"
                disabled={itineraryDayNav.activityCount <= 1 || itineraryDayNav.safeActivityIndex <= 0}
                onClick={() => onActivityIndexChange((i) => Math.max(0, i - 1))}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-700 disabled:opacity-40 dark:border-[#334155] dark:text-slate-200"
                aria-label="Parada anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
              <span className="min-w-0 whitespace-nowrap text-center text-[10px] font-semibold tabular-nums text-slate-600">
                Parada{" "}
                <strong className="text-slate-900">
                  {itineraryDayNav.activityCount ? itineraryDayNav.safeActivityIndex + 1 : 0}
                </strong>
                /{itineraryDayNav.activityCount}
              </span>
              <button
                type="button"
                disabled={
                  itineraryDayNav.activityCount <= 1 ||
                  itineraryDayNav.safeActivityIndex >= itineraryDayNav.activityCount - 1
                }
                onClick={() =>
                  onActivityIndexChange((i) => Math.min(itineraryDayNav.activityCount - 1, i + 1))
                }
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-700 disabled:opacity-40 dark:border-[#334155] dark:text-slate-200"
                aria-label="Parada siguiente"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-2">
              {itineraryDayNav.activityCount > 0 ? (
                (() => {
                  const idx = itineraryDayNav.safeActivityIndex;
                  const it = itineraryDayNav.day!.items![idx]!;
                  const key = itineraryItemKey(expandedDay, idx);
                  const checked = itinerarySelected.has(key);
                  return (
                    <label
                      className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 transition ${
                        checked
                          ? "border-[var(--brand-border)] bg-[var(--brand-light)]/60 dark:border-[#F87171]/35 dark:bg-[#F87171]/10"
                          : "border-slate-200 bg-slate-50 dark:border-[#1E293B] dark:bg-[#080C14]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand)]"
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(itinerarySelected);
                          if (e.target.checked) next.add(key);
                          else next.delete(key);
                          onItinerarySelectedChange(next);
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-extrabold text-slate-900">
                          {it.start_time ? `${it.start_time} · ` : ""}
                          {it.title}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-600">
                          {it.place_name || it.address || "Sin lugar"}
                        </div>
                        {typeof it.latitude === "number" &&
                        typeof it.longitude === "number" &&
                        Number.isFinite(it.latitude) &&
                        Number.isFinite(it.longitude) ? (
                          <div className="mt-1 font-mono text-[10px] text-slate-500">
                            {it.latitude.toFixed(5)}, {it.longitude.toFixed(5)}
                          </div>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {it.requires_ticket === true ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                              Entrada
                            </span>
                          ) : it.requires_ticket === false ? (
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              Sin entrada
                            </span>
                          ) : null}
                          {it.activity_kind ? (
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:border-[#334155] dark:bg-[#1E293B]">
                              {it.activity_kind}
                            </span>
                          ) : null}
                        </div>
                        {it.ticket_notes ? (
                          <p className="mt-2 text-[11px] leading-relaxed text-amber-900/90">{it.ticket_notes}</p>
                        ) : null}
                        {it.notes ? (
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{it.notes}</p>
                        ) : null}
                      </div>
                    </label>
                  );
                })()
              ) : (
                <p className="px-2 py-4 text-center text-xs text-slate-500">Sin paradas en este día.</p>
              )}
            </div>

            {itineraryDayNav.activityCount > 1 ? (
              <div className="flex shrink-0 justify-center gap-1 border-t border-slate-100 px-2 py-2 dark:border-[#1E293B]">
                {itineraryDayNav.day!.items!.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    aria-label={`Ir a parada ${dotIdx + 1}`}
                    onClick={() => onSetActivityIndex(dotIdx)}
                    className={`h-2 rounded-full transition ${
                      dotIdx === itineraryDayNav.safeActivityIndex
                        ? "w-5 bg-[var(--brand)]"
                        : "w-2 bg-slate-300 dark:bg-slate-600"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="shrink-0 text-center text-xs text-slate-500">Elige un día en la barra superior.</p>
        )}
      </div>
    </section>
  );
}
