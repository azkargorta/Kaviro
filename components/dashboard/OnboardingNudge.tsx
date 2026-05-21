"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users, Sparkles } from "lucide-react";
import { DEMO_SPOTLIGHT_STEP_COUNT } from "@/lib/onboarding/demo-tour-copy";
import { openCreateTripForm } from "@/lib/open-create-trip";

type Step = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  done: boolean;
};


function ReferralButton() {
  const [data, setData] = useState<{ inviteUrl: string | null; monthsEarned: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral/status")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.inviteUrl) setData(d); })
      .catch(() => {});
  }, []);

  if (!data?.inviteUrl) return null;

  function copy() {
    navigator.clipboard.writeText(data!.inviteUrl!).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {data.monthsEarned > 0 && (
        <p className="text-[11px] font-semibold text-[#F87171]">
          🎉 Has ganado {data.monthsEarned} mes{data.monthsEarned > 1 ? "es" : ""} Premium
        </p>
      )}
      <button
        type="button"
        onClick={copy}
        className="flex min-h-[36px] items-center justify-center gap-2 rounded-xl bg-[#F87171] px-3 text-xs font-bold text-white transition hover:bg-[#EF4444]"
      >
        {copied ? "¡Enlace copiado! ✓" : "Copiar enlace de invitación"}
      </button>
    </div>
  );
}

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
  const storageKey = useMemo(() => "kaviro_checklist_v2", []);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (window.localStorage.getItem(storageKey) === "done") setDismissed(true);
    } catch { /* private mode */ }
  }, [storageKey]);

  const steps: Step[] = [
    { id: "trip",        icon: "✈️", title: "Crea tu primer viaje",     desc: "Ponle nombre, destino y fechas.",             done: hasTrips },
    { id: "participant", icon: "👥", title: "Invita a alguien",          desc: "Comparte el viaje con tu grupo.",             done: hasParticipants },
    { id: "expense",     icon: "💶", title: "Añade un gasto",            desc: "Registra el primer ticket del grupo.",        done: hasExpenses },
    { id: "ai",          icon: "✨", title: "Usa el Asistente IA",       desc: "Pide un plan o rutas en lenguaje natural.",   done: false },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const allDone = doneCount === steps.length;

  // Auto-dismiss when all steps done
  useEffect(() => {
    if (!mounted || !allDone) return;
    try { window.localStorage.setItem(storageKey, "done"); } catch { /* */ }
    const t = setTimeout(() => setDismissed(true), 3000);
    return () => clearTimeout(t);
  }, [allDone, mounted, storageKey]);

  function dismiss() {
    try { window.localStorage.setItem(storageKey, "done"); } catch { /* */ }
    setDismissed(true);
  }

  // Only show for new users (no trips yet or not dismissed)
  if (!mounted || dismissed || (hasTrips && hasParticipants && hasExpenses)) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-5">
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F87171]/10 px-3 py-1 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F87171]" />
              <span className="text-[11px] font-semibold tracking-[0.1em] text-[#F87171]">PRIMEROS PASOS</span>
            </div>
            <h2 className="text-base font-extrabold text-[var(--text-primary)]">
              {allDone ? "¡Todo listo! 🎉" : `${doneCount} de ${steps.length} pasos completados`}
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-full p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-page)] transition"
            aria-label="Cerrar"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8"/>
            </svg>
          </button>
        </div>

        {demoTripId ? (
          <div className="mt-4 rounded-2xl border border-[#F87171]/25 bg-gradient-to-r from-[#F87171]/10 to-transparent p-4">
            <p className="text-sm font-bold text-[var(--text-primary)]">¿Primera vez en Kaviro?</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)] leading-relaxed">
              Antes de crear tu viaje, prueba el <strong className="text-[#F87171]">viaje demo de Londres</strong> con una
              visita guiada de {DEMO_SPOTLIGHT_STEP_COUNT} pasos (plan, gastos, mapa, búsqueda de vuelos, IA…).
            </p>
            <Link
              href={`/trip/${encodeURIComponent(demoTripId)}/summary?tutorial=demo`}
              className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#F87171] px-4 text-sm font-bold text-white transition hover:bg-[#EF4444] sm:w-auto"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Iniciar visita guiada
            </Link>
          </div>
        ) : null}

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-[var(--surface-page)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#F87171] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Steps */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
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
                <p className={`text-xs font-semibold leading-snug ${
                  step.done ? "text-emerald-700 dark:text-emerald-400 line-through" : "text-[var(--text-primary)]"
                }`}>
                  {step.title}
                </p>
                {!step.done && (
                  <p className="mt-0.5 text-[11px] text-[var(--text-tertiary)] leading-snug">{step.desc}</p>
                )}
              </div>
              {step.done && (
                <svg className="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 8l4 4 6-7"/>
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        {!hasTrips && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => openCreateTripForm()}
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#F87171] px-5 text-sm font-bold text-white transition hover:bg-[#EF4444]"
            >
              Crear mi primer viaje →
            </button>
          </div>
        )}

        {/* Referral CTA */}
        <div className="mt-4 rounded-2xl border border-[#F87171]/20 bg-[#F87171]/5 p-4">
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 shrink-0 text-[#F87171]" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Invita a amigos, gana Premium
            </p>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Por cada amigo que se registre con tu enlace, tú y él recibís 1 mes de Premium gratis.
          </p>
          <ReferralButton />
        </div>
      </div>
    </div>
  );
}
