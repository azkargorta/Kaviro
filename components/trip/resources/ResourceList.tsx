"use client";

import type { TripResource } from "@/hooks/useTripResources";
import LongTextSheet from "@/components/ui/LongTextSheet";
import { btnPrimary } from "@/components/ui/brandStyles";
import { resourceVisibilityLabel } from "@/lib/trip-resources/visibility";

export default function ResourceList({
  resources,
  onDelete,
  onAdd,
}: {
  resources: TripResource[];
  onDelete?: (resourceId: string) => void;
  onAdd?: () => void;
}) {
  return (
    <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Documentos y reservas adjuntas</h3>
        <p className="mt-1 text-sm text-slate-500">
          Imágenes y PDFs subidos al viaje.
        </p>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-sm text-slate-600 dark:border-[color:var(--brand-border)] dark:bg-[var(--surface-page)]/40 dark:text-slate-300">
          <div className="font-semibold text-slate-800 dark:text-slate-100">Todavía no hay documentos subidos</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Sube billetes, reservas o PDFs para tenerlos a mano durante el viaje.
          </div>
          {onAdd ? (
            <button type="button" onClick={onAdd} className={`${btnPrimary} mt-3 px-4 py-2 text-sm`}>
              Adjuntar documento
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <div key={resource.id} className="min-w-0 rounded-2xl border border-slate-200 p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0 max-w-full flex-1 break-words">
                  <LongTextSheet
                    text={resource.title}
                    modalTitle="Documento"
                    minLength={40}
                    lineClamp={4}
                    className="font-semibold leading-snug text-slate-900"
                  />
                  <div className="mt-1 flex flex-wrap items-center gap-2 break-words text-sm text-slate-500">
                    <span>
                      {resource.resource_type} {resource.mime_type ? `· ${resource.mime_type}` : ""}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-[#1E293B] dark:text-slate-300">
                      {resourceVisibilityLabel(resource.visibility)}
                    </span>
                  </div>
                  {resource.file_url ? (
                    <a
                      href={resource.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block max-w-full break-all text-sm text-blue-600 underline"
                    >
                      Abrir archivo
                    </a>
                  ) : null}
                </div>

                {onDelete ? (
                  <button
                    type="button"
                    onClick={() => onDelete(resource.id)}
                    className="shrink-0 self-start rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 sm:self-auto"
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
