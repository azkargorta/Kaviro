"use client";

import { AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";

export type PlanImportCardsStatus =
  | {
      phase: "generating";
      current: number;
      total: number;
      label?: string;
      partialDays?: number;
      partialActivities?: number;
    }
  | { phase: "ready"; days: number; activities: number }
  | { phase: "failed"; message?: string };

type Props = {
  status: PlanImportCardsStatus;
  onDismissReady?: () => void;
  compact?: boolean;
};

function progressPercent(current: number, total: number) {
  if (total <= 0) return 8;
  return Math.min(100, Math.max(8, Math.round((current / total) * 100)));
}

export default function PlanImportCardsStatusBanner({ status, onDismissReady, compact = false }: Props) {
  if (status.phase === "generating") {
    const pct = progressPercent(status.current, status.total);
    const showPartial =
      (status.partialDays ?? 0) > 0 || (status.partialActivities ?? 0) > 0;

    return (
      <section
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={`overflow-hidden rounded-2xl border-2 border-[var(--brand)] bg-gradient-to-br from-[var(--brand-light)] via-white to-slate-50 shadow-md dark:from-[#1e3a5f]/25 dark:via-[#0F1623] dark:to-[#080C14] ${
          compact ? "px-4 py-3" : "px-5 py-4"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand)] text-white shadow-sm"
            aria-hidden
          >
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-text)]">
              En curso
            </p>
            <p className={`font-bold text-slate-900 dark:text-white ${compact ? "text-sm" : "text-base"}`}>
              Generando tarjetas del itinerario
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              La IA está leyendo horarios, lugares y tipos de actividad. En viajes largos va tramo a tramo; no cierres
              esta ventana.
            </p>
            {status.total > 1 ? (
              <p className="mt-2 text-sm font-semibold text-[var(--brand-text)]">
                Tramo {Math.min(status.current, status.total)} de {status.total}
                {status.label ? (
                  <span className="mt-0.5 block text-xs font-normal text-slate-600 dark:text-slate-400">
                    {status.label}
                  </span>
                ) : null}
              </p>
            ) : status.label ? (
              <p className="mt-2 text-sm font-semibold text-[var(--brand-text)]">{status.label}</p>
            ) : null}
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200/90 dark:bg-[#1E293B]">
              <div
                className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            {showPartial ? (
              <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                Ya puedes ir viendo{" "}
                {status.partialDays
                  ? `${status.partialDays} día${status.partialDays !== 1 ? "s" : ""}`
                  : "actividades"}{" "}
                abajo mientras termina el resto
                {status.partialActivities
                  ? ` (${status.partialActivities} actividad${status.partialActivities !== 1 ? "es" : ""} hasta ahora)`
                  : null}
                .
              </p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (status.phase === "ready") {
    return (
      <section
        role="status"
        aria-live="polite"
        className={`overflow-hidden rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 shadow-md dark:border-emerald-600/50 dark:from-emerald-950/40 dark:via-[#0F1623] dark:to-emerald-950/20 ${
          compact ? "px-4 py-3" : "px-5 py-4"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm"
            aria-hidden
          >
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-300">
              Completado
            </p>
            <p className={`font-bold text-emerald-950 dark:text-emerald-50 ${compact ? "text-sm" : "text-lg"}`}>
              Tarjetas generadas — listas para revisar
            </p>
            <p className="mt-1 text-sm text-emerald-900/90 dark:text-emerald-100/90">
              <strong>
                {status.days} día{status.days !== 1 ? "s" : ""}
              </strong>{" "}
              ·{" "}
              <strong>
                {status.activities} actividad{status.activities !== 1 ? "es" : ""}
              </strong>
              . Marca las que quieras y pulsa <span className="font-bold">«Añadir seleccionadas»</span> en el panel de
              abajo.
            </p>
          </div>
          {onDismissReady ? (
            <button
              type="button"
              onClick={onDismissReady}
              className="shrink-0 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-[#0F1623] dark:text-emerald-100 dark:hover:bg-emerald-950/50"
            >
              Entendido
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      role="alert"
      className={`rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 shadow-sm dark:border-amber-700/50 dark:bg-amber-950/30 ${
        compact ? "px-4 py-3" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-6 w-6 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
        <div>
          <p className="font-bold text-amber-950 dark:text-amber-100">No se pudieron generar todas las tarjetas</p>
          <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-100/80">
            {status.message ??
              "Prueba con otro archivo, un PDF con texto seleccionable o genera de nuevo desde el texto leído."}
          </p>
        </div>
      </div>
    </section>
  );
}

/** Franja compacta mientras se lee el PDF/imagen (antes de generar tarjetas). */
export function PlanImportReadingBanner({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-light)]/80 px-3 py-2.5 text-sm font-semibold text-[var(--brand-text)]"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      <span>{label ?? "Leyendo el documento…"}</span>
      <Sparkles className="ml-auto h-4 w-4 shrink-0 opacity-60" aria-hidden />
    </div>
  );
}
