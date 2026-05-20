"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const SECTION_LABELS: Record<string, { emoji: string; label: string; hint: string }> = {
  plan:         { emoji: "📅", label: "Plan del viaje",      hint: "Las actividades no se han podido cargar." },
  expenses:     { emoji: "💶", label: "Gastos",              hint: "No se han podido cargar los gastos del grupo." },
  map:          { emoji: "🗺️", label: "Rutas",              hint: "El mapa no ha podido inicializarse." },
  participants: { emoji: "👥", label: "Participantes",       hint: "No se han podido cargar los participantes." },
  resources:    { emoji: "📎", label: "Documentos",          hint: "Los documentos no se han podido cargar." },
  ai:           { emoji: "✨", label: "Asistente IA",        hint: "El asistente no ha podido conectarse." },
};

const SLUG = "participants";

export default function SectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ id: string }>();
  const tripId = params?.id ?? "";
  const { emoji, label, hint } = SECTION_LABELS[SLUG] ?? { emoji: "⚠️", label: "Esta sección", hint: "Ha ocurrido un error inesperado." };

  useEffect(() => {
    console.error(`[Kaviro] Error en sección participants:`, error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl dark:bg-red-950/20">
        {emoji}
      </div>
      <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {label} no disponible
      </h2>
      <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
        {hint} Puedes intentarlo de nuevo o volver al resumen del viaje.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[10px] text-slate-400">ref: {error.digest}</p>
      )}
      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-6 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
        >
          Intentar de nuevo
        </button>
        <Link
          href={tripId ? `/trip/${tripId}/summary` : "/dashboard"}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-white dark:hover:bg-[#1E293B]"
        >
          Volver al resumen
        </Link>
      </div>
    </div>
  );
}
