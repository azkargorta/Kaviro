"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import {
  buildOnboardingSteps,
  dismissTripOnboarding,
  dispatchFirstRunDismissed,
  isOnboardingStepDone,
  KAVIRO_FIRST_RUN_DISMISSED_EVENT,
  onboardingProgress,
  shouldShowTripOnboarding,
  tripOnboardingCollapsedKey,
  type TripOnboardingCounts,
} from "@/lib/trip-onboarding";

type Props = {
  tripId: string;
  tripName: string;
  isPremium: boolean;
  counts: TripOnboardingCounts;
};

export default function TripOnboardingChecklist({ tripId, tripName, isPremium, counts }: Props) {
  const pathname = usePathname();
  const steps = useMemo(() => buildOnboardingSteps(tripId, isPremium), [tripId, isPremium]);
  const { done, total } = useMemo(() => onboardingProgress(counts, steps), [counts, steps]);
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;
  const nextStep = steps.find((s) => !isOnboardingStepDone(s.id, counts)) ?? null;

  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  const syncVisibility = useCallback(() => {
    setVisible(shouldShowTripOnboarding(tripId, counts, steps));
  }, [tripId, counts, steps]);

  useEffect(() => {
    setMounted(true);
    syncVisibility();
    try {
      if (window.localStorage.getItem(tripOnboardingCollapsedKey(tripId)) === "1") {
        setExpanded(false);
      }
    } catch {
      /* */
    }
  }, [tripId, syncVisibility]);

  useEffect(() => {
    const onDismiss = (e: Event) => {
      const detail = (e as CustomEvent<{ tripId?: string }>).detail;
      if (!detail?.tripId || detail.tripId === tripId) setVisible(false);
    };
    window.addEventListener(KAVIRO_FIRST_RUN_DISMISSED_EVENT, onDismiss);
    return () => window.removeEventListener(KAVIRO_FIRST_RUN_DISMISSED_EVENT, onDismiss);
  }, [tripId]);

  useEffect(() => {
    if (!mounted || done < total) return;
    const t = window.setTimeout(() => {
      dismissTripOnboarding(tripId);
      setVisible(false);
      dispatchFirstRunDismissed(tripId);
    }, 4000);
    return () => window.clearTimeout(t);
  }, [done, total, mounted, tripId]);

  function dismiss() {
    dismissTripOnboarding(tripId);
    setVisible(false);
    dispatchFirstRunDismissed(tripId);
  }

  function toggleExpanded() {
    setExpanded((v) => {
      const next = !v;
      try {
        window.localStorage.setItem(tripOnboardingCollapsedKey(tripId), next ? "0" : "1");
      } catch {
        /* */
      }
      return next;
    });
  }

  if (!mounted || !visible) return null;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-light)] shadow-sm"
      aria-label="Checklist del viaje"
      data-tour="trip-onboarding-checklist"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--brand-border)]/60 bg-white/60 px-4 py-3 dark:bg-[#0F1623]/80">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">Configura tu viaje</p>
          <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
            {tripName} · {done}/{total} pasos
          </p>
        </div>
        {nextStep ? (
          <Link
            href={nextStep.href}
            className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] px-3 text-xs font-bold text-white transition hover:bg-[var(--brand-hover)]"
          >
            Siguiente: {nextStep.title}
          </Link>
        ) : null}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={toggleExpanded}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--brand-border)] text-[var(--brand)] transition hover:bg-white/80 dark:hover:bg-[#1E293B]"
            aria-expanded={expanded}
            aria-label={expanded ? "Ocultar pasos" : "Mostrar pasos"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--brand-border)] text-slate-500 transition hover:bg-white/80 dark:hover:bg-[#1E293B]"
            aria-label="Cerrar checklist"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="h-1.5 bg-white/50 dark:bg-[#080C14]/50">
        <div
          className="h-full rounded-r-full bg-[var(--brand)] transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {expanded ? (
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => {
            const complete = isOnboardingStepDone(step.id, counts);
            const active = pathname === step.href || pathname.startsWith(`${step.href}/`);
            const isNext = step.id === nextStep?.id;

            return (
              <Link
                key={step.id}
                href={step.href}
                className={`flex items-start gap-3 rounded-xl border p-3 transition hover:shadow-md ${
                  complete
                    ? "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-900/40 dark:bg-emerald-950/30"
                    : active
                      ? "border-[var(--brand)] bg-white ring-1 ring-[var(--brand-border)] dark:bg-[#0F1623]"
                      : "border-[var(--border-default)] bg-white dark:border-[#1E293B] dark:bg-[#0F1623]"
                }`}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {step.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-bold leading-snug ${
                      complete ? "text-emerald-800 line-through dark:text-emerald-300" : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {step.title}
                  </p>
                  {!complete ? (
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">{step.description}</p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    complete
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : isNext
                        ? "bg-[var(--brand)] text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-[#1E293B] dark:text-slate-300"
                  }`}
                >
                  {complete ? "✓" : isNext ? "→" : "·"}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
