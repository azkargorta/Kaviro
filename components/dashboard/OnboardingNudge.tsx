"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { DEMO_SPOTLIGHT_STEP_COUNT } from "@/lib/onboarding/demo-tour-copy";
import { openCreateTripForm } from "@/lib/open-create-trip";

type Step = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  done: boolean;
};

export default function OnboardingNudge({
  hasTrips,
  hasParticipants = false,
  hasExpenses = false,
  demoTripId = null,
}: {
  hasTrips: boolean;
  hasParticipants?: boolean;
  hasExpenses?: boolean;
  /** Viaje demo del usuario: enlace directo al tour guiado */
  demoTripId?: string | null;
}) {
  const storageKey = useMemo(() => "kaviro_checklist_v3", []);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (window.localStorage.getItem(storageKey) === "done") setDismissed(true);
    } catch {
      /* private mode */
    }
  }, [storageKey]);

  const steps: Step[] = [
    {
      id: "trip",
      icon: "✈️",
      title: "Crea tu primer viaje",
      desc: "Empieza con destino y fechas. El resto puedes completarlo después.",
      done: hasTrips,
    },
    {
      id: "participant",
      icon: "👥",
      title: "Invita a quien viaja contigo",
      desc: "Así todos tendréis el mismo viaje actualizado.",
      done: hasParticipants,
    },
    {
      id: "expense",
      icon: "💶",
      title: "Prueba un gasto compartido",
      desc: "Es opcional: úsalo cuando empecéis a pagar cosas del viaje.",
      done: hasExpenses,
    },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const allDone = doneCount === steps.length;

  useEffect(() => {
    if (!mounted || !allDone) return;
    try {
      window.localStorage.setItem(storageKey, "done");
    } catch {
      /* private mode */
    }
    const timer = setTimeout(() => setDismissed(true), 3000);
    return () => clearTimeout(timer);
  }, [allDone, mounted, storageKey]);

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, "done");
    } catch {
      /* private mode */
    }
    setDismissed(true);
  }

  if (!mounted || dismissed || allDone) return null;

  return (
    <div className="mx-auto min-w-0 max-w-2xl px-4 md:px-5">
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#F87171]/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F87171]" />
              <span className="text-[11px] font-semibold tracking-[0.1em] text-[#F87171]">PRIMEROS PASOS</span>
            </div>
            <h2 className="text-base font-extrabold text-[var(--text-primary)]">
              {hasTrips ? "Sigue preparando tu viaje" : "Empieza por tu viaje real"}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
              No necesitas configurar todo Kaviro ahora. Completa solo el siguiente paso que te resulte útil.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-full p-1.5 text-[var(--text-tertiary)] transition hover:bg-[var(--surface-page)]"
            aria-label="Cerrar primeros pasos"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-page)]">
          <div
            className="h-full rounded-full bg-[#F87171] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">
          {doneCount} de {steps.length} pasos completados
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                step.done
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20"
                  : "border-[var(--border-default)] bg-[var(--surface-page)]"
              }`}
            >
              <span className="mt-0.5 text-lg leading-none">{step.icon}</span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-semibold leading-snug ${
                    step.done
                      ? "text-emerald-700 line-through dark:text-emerald-400"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {step.title}
                </p>
                {!step.done ? (
                  <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-tertiary)]">{step.desc}</p>
                ) : null}
              </div>
              {step.done ? (
                <svg
                  className="h-4 w-4 shrink-0 text-emerald-500"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M3 8l4 4 6-7" />
                </svg>
              ) : null}
            </div>
          ))}
        </div>

        {!hasTrips ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => openCreateTripForm()}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#F87171] px-5 text-sm font-bold text-white transition hover:bg-[#EF4444]"
            >
              Crear mi viaje →
            </button>
            {demoTripId ? (
              <Link
                href={`/trip/${encodeURIComponent(demoTripId)}/summary?tutorial=demo`}
                className="inline-flex min-h-[40px] items-center justify-center gap-2 px-3 text-xs font-semibold text-[var(--text-tertiary)] transition hover:text-[#F87171]"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Prefiero ver primero un ejemplo ({DEMO_SPOTLIGHT_STEP_COUNT} pasos)
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
