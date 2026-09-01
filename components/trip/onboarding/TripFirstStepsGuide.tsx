"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import type { TripOnboardingCounts } from "@/lib/trip-onboarding";

type Props = {
  tripId: string;
  tripName: string;
  counts: TripOnboardingCounts;
};

type EssentialStep = {
  id: "plan" | "participants" | "resources";
  icon: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
};

export default function TripFirstStepsGuide({ tripId, tripName, counts }: Props) {
  const id = encodeURIComponent(tripId);
  const steps: EssentialStep[] = [
    {
      id: "plan",
      icon: "📅",
      title: "Añade lo primero que ya sabes",
      description: "Empieza con un vuelo, hotel, restaurante o actividad. No hace falta tener todo el viaje decidido.",
      href: `/trip/${id}/plan`,
      cta: "Añadir primer plan",
      done: counts.activities > 0,
    },
    {
      id: "participants",
      icon: "👥",
      title: "Invita a quien viaja contigo",
      description: "Así todos consultan el mismo viaje y podéis organizarlo juntos.",
      href: `/trip/${id}/participants`,
      cta: "Invitar compañeros",
      done: counts.participants > 1,
    },
    {
      id: "resources",
      icon: "📎",
      title: "Guarda una reserva o documento",
      description: "Ten billetes, reservas y entradas dentro del viaje para encontrarlos cuando los necesites.",
      href: `/trip/${id}/resources`,
      cta: "Guardar primera reserva",
      done: counts.resources > 0,
    },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const nextStep = steps.find((step) => !step.done) ?? null;
  const allComplete = doneCount === steps.length;

  useEffect(() => {
    if (!allComplete || typeof window === "undefined") return;
    const storageKey = `kaviro_onboarding_complete_${tripId}`;
    try {
      if (window.localStorage.getItem(storageKey)) return;
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, { trip_id: tripId });
      window.localStorage.setItem(storageKey, "1");
    } catch {
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, { trip_id: tripId });
    }
  }, [allComplete, tripId]);

  if (!nextStep) return null;

  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-[var(--brand-border)]/70 bg-white shadow-[0_4px_18px_rgba(248,113,113,0.08)] dark:bg-[#0F1623]"
      aria-label="Siguiente paso recomendado"
    >
      <div className="border-b border-[var(--brand-border)]/35 bg-gradient-to-r from-[var(--brand-light)]/70 via-white to-white px-4 py-4 dark:via-[#0F1623] dark:to-[#0F1623] sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">Primeros minutos</p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
              Pon en marcha {tripName || "tu viaje"}
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              No necesitas aprender todo Kaviro ahora. Completa estas tres acciones y descubre el resto cuando te haga falta.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-[var(--brand-border)]/60 bg-white px-3 py-1 text-xs font-bold text-[var(--brand-text)] dark:bg-[#141c2b]">
            {doneCount}/{steps.length} listos
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1E293B]">
          <div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {steps.map((step, index) => {
            const active = step.id === nextStep.id;
            return (
              <div
                key={step.id}
                className={`rounded-xl border px-3 py-3 ${
                  step.done
                    ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                    : active
                      ? "border-[var(--brand-border)] bg-[var(--brand-light)]/45"
                      : "border-slate-200 bg-slate-50/70 dark:border-[#334155] dark:bg-[#080C14]/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base" aria-hidden>{step.done ? "✓" : step.icon}</span>
                  <p className={`text-xs font-bold ${step.done ? "text-emerald-800 dark:text-emerald-300" : "text-slate-900 dark:text-white"}`}>
                    {index + 1}. {step.done ? "Completado" : step.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-[#334155] dark:bg-[#080C14]/50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand)]">Haz esto ahora</p>
              <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">{nextStep.title}</p>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">{nextStep.description}</p>
            </div>
            <Link
              href={nextStep.href}
              onClick={() =>
                trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_CLICKED, {
                  trip_id: tripId,
                  step: nextStep.id,
                  completed_steps: doneCount,
                })
              }
              className="btn-press inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
            >
              {nextStep.cta} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
