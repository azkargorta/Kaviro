"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildOnboardingSteps,
  dismissTripOnboarding,
  dispatchFirstRunDismissed,
  isOnboardingStepDone,
  onboardingProgress,
  shouldShowTripOnboarding,
  type TripOnboardingCounts,
} from "@/lib/trip-onboarding";

export default function TripFirstRunPanel({
  tripId,
  tripName,
  isPremium,
  counts,
}: {
  tripId: string;
  tripName: string;
  isPremium: boolean;
  counts: TripOnboardingCounts;
}) {
  const [open, setOpen] = useState(false);
  const steps = useMemo(() => buildOnboardingSteps(tripId, isPremium), [tripId, isPremium]);
  const { done, total } = useMemo(() => onboardingProgress(counts, steps), [counts, steps]);
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;
  const nextStepId = steps.find((s) => !isOnboardingStepDone(s.id, counts))?.id ?? null;

  useEffect(() => {
    setOpen(shouldShowTripOnboarding(tripId, counts));
  }, [tripId, counts]);

  function dismiss() {
    dismissTripOnboarding(tripId);
    setOpen(false);
    dispatchFirstRunDismissed(tripId);
  }

  if (!open) return null;

  return (
    <section className="card-soft overflow-hidden">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white">
        <FirstRunHeader done={done} total={total} progressPct={progressPct} tripName={tripName} onDismiss={dismiss} />
      </div>

      <div className="grid gap-3 p-6 md:grid-cols-2">
        {steps.map((step) => {
          const complete = isOnboardingStepDone(step.id, counts);
          const pill = complete ? "Listo" : step.id === nextStepId ? "Siguiente" : "Pendiente";

          return (
            <Link
              key={step.id}
              href={step.href}
              className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#1E293B] dark:bg-[#0F1623]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={complete ? "opacity-80" : undefined}>
                  <p className="text-sm font-bold text-slate-950 dark:text-white">{step.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                    complete
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-700 dark:bg-[#1E293B] dark:text-slate-200"
                  }`}
                >
                  {pill}
                </span>
              </div>
              <div className="mt-3 text-sm font-semibold text-cyan-700 transition group-hover:translate-x-0.5 dark:text-cyan-400">
                Abrir →
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function FirstRunHeader({
  done,
  total,
  progressPct,
  tripName,
  onDismiss,
}: {
  done: number;
  total: number;
  progressPct: number;
  tripName: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Primeros pasos del viaje</p>
        <h2 className="text-2xl font-extrabold tracking-tight">{tripName}: configura lo básico</h2>
        <p className="max-w-2xl text-sm text-white/75">
          Invita al grupo, monta el plan y anota gastos. Puedes cerrar este panel y seguir cuando quieras.
        </p>
        <div className="max-w-md space-y-1.5">
          <p className="text-xs font-semibold text-white/80">
            {done} de {total} completados
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
      >
        Entendido
      </button>
    </div>
  );
}
