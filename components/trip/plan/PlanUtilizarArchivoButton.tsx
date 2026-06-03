"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";
import PlanDocumentImportPanel from "@/components/trip/plan/PlanDocumentImportPanel";

const HEADER_ACTION_BTN =
  "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/90 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[var(--brand)] shadow-sm transition hover:bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/80";

type Props = {
  tripId: string;
  isPremium?: boolean;
  /** Estilo del botón en la cabecera del itinerario (fondo blanco sobre brand). */
  appearance?: "header" | "toolbar";
  className?: string;
};

/** Abre importación PDF/imagen del dossier (Kaviro Trips). */
export default function PlanUtilizarArchivoButton({
  tripId,
  isPremium = true,
  appearance = "toolbar",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);

  if (!isPremium) return null;

  const btnClass =
    appearance === "header"
      ? HEADER_ACTION_BTN
      : `btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-light)] px-5 py-3 text-sm font-semibold text-[var(--brand-text)] shadow-sm transition hover:bg-[var(--brand-light)]/80 focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] w-full sm:w-auto ${className}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={btnClass}
        title="Importar PDF o imagen del itinerario"
        data-tour="plan-utilizar-archivo-btn"
      >
        <FileUp className={appearance === "header" ? "h-3.5 w-3.5 shrink-0" : "h-4 w-4"} aria-hidden />
        <span className={appearance === "header" ? "hidden min-[360px]:inline" : undefined}>
          Utilizar Archivo
        </span>
        {appearance === "header" ? <span className="min-[360px]:hidden">Archivo</span> : null}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-file-import-title"
        >
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-[#1E293B] dark:bg-[#0F1623]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-[#1E293B]">
              <div className="min-w-0">
                <p
                  id="plan-file-import-title"
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                >
                  Importar programa
                </p>
                <p className="mt-1 text-lg font-bold text-slate-950 dark:text-white">Utilizar archivo</p>
                <p className="mt-1 text-sm text-slate-500">
                  PDF o imagen del dossier. Las actividades nuevas se revisan antes de añadirlas al plan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-200"
              >
                Cerrar
              </button>
            </div>
            <div className="min-h-0 overflow-auto px-5 py-4">
              <PlanDocumentImportPanel tripId={tripId} isPremium={isPremium} compact />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
