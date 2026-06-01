"use client";

import { useEffect, useMemo, useState } from "react";
import type { TripResource } from "@/hooks/useTripResources";
import LongTextSheet from "@/components/ui/LongTextSheet";
import { btnPrimary } from "@/components/ui/brandStyles";
import { resourceVisibilityLabel } from "@/lib/trip-resources/visibility";

export default function ResourceList({
  resources,
  onDelete,
  onDeleteMany,
  onAdd,
  deleting = false,
}: {
  resources: TripResource[];
  onDelete?: (resourceId: string) => void;
  onDeleteMany?: (resourceIds: string[]) => void | Promise<void>;
  onAdd?: () => void;
  deleting?: boolean;
}) {
  const canBulk = Boolean(onDeleteMany);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const resourceIds = useMemo(() => resources.map((r) => r.id), [resources]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const id of resourceIds) {
        if (prev.has(id)) next.add(id);
      }
      return next;
    });
  }, [resourceIds]);

  const allSelected =
    resources.length > 0 && resources.every((resource) => selectedIds.has(resource.id));
  const someSelected = selectedIds.size > 0;

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(resources.map((r) => r.id)));
  };

  const handleBulkDelete = async () => {
    if (!onDeleteMany || selectedIds.size === 0) return;
    const ids = [...selectedIds];
    await onDeleteMany(ids);
    setSelectedIds(new Set());
  };

  return (
    <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Documentos y reservas adjuntas</h3>
          <p className="mt-1 text-sm text-slate-500">Imágenes y PDFs subidos al viaje.</p>
        </div>

        {canBulk && resources.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleAll}
              disabled={deleting}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {allSelected ? "Quitar selección" : "Seleccionar todos"}
            </button>
            {someSelected ? (
              <button
                type="button"
                onClick={() => void handleBulkDelete()}
                disabled={deleting}
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                {deleting ? "Eliminando…" : `Eliminar (${selectedIds.size})`}
              </button>
            ) : null}
          </div>
        ) : null}
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
          {resources.map((resource) => {
            const checked = selectedIds.has(resource.id);
            return (
              <div
                key={resource.id}
                className={`min-w-0 rounded-2xl border p-3 sm:p-4 ${
                  checked
                    ? "border-[var(--brand-border)] bg-[var(--brand-light)]/40"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
                  <div className="flex min-w-0 flex-1 gap-3">
                    {canBulk ? (
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand)]"
                        checked={checked}
                        disabled={deleting}
                        onChange={(e) => toggleOne(resource.id, e.target.checked)}
                        aria-label={`Seleccionar ${resource.title}`}
                      />
                    ) : null}
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
                  </div>

                  {onDelete && !canBulk ? (
                    <button
                      type="button"
                      onClick={() => onDelete(resource.id)}
                      disabled={deleting}
                      className="shrink-0 self-start rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 sm:self-auto disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
