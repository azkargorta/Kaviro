"use client";

import { useEffect, useMemo, useState } from "react";
import type { TripResource } from "@/hooks/useTripResources";
import LongTextSheet from "@/components/ui/LongTextSheet";
import { btnPrimary } from "@/components/ui/brandStyles";
import { resourceVisibilityLabel } from "@/lib/trip-resources/visibility";
import { groupByResourceCategory, resolveResourceGroup } from "@/lib/trip-resources/category-groups";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function ResourceList({
  resources,
  onDelete,
  onDeleteMany,
  onAdd,
  onToggleClientPortal,
  deleting = false,
}: {
  resources: TripResource[];
  onDelete?: (resourceId: string) => void;
  onDeleteMany?: (resourceIds: string[]) => void | Promise<void>;
  onAdd?: () => void;
  onToggleClientPortal?: (resourceId: string, visible: boolean) => void | Promise<void>;
  deleting?: boolean;
}) {
  const canBulk = Boolean(onDeleteMany);
  const isMobile = useIsMobile();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const groupedResources = useMemo(
    () => (isMobile ? groupByResourceCategory(resources, resolveResourceGroup) : null),
    [isMobile, resources]
  );

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

  function renderResourceCard(resource: TripResource) {
    const checked = selectedIds.has(resource.id);
    return (
      <div
        key={resource.id}
        className={`min-w-0 rounded-2xl border p-3 sm:p-4 ${
          checked ? "border-[var(--brand-border)] bg-[var(--brand-light)]/40" : "border-slate-200"
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
                {onToggleClientPortal ? (
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[#1e3a5f] dark:text-sky-300">
                    <input
                      type="checkbox"
                      checked={Boolean(resource.show_on_client_portal)}
                      onChange={(e) => onToggleClientPortal(resource.id, e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Portal cliente
                  </label>
                ) : null}
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
  }

  return (
    <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Documentos adjuntos</h3>
          <p className="mt-0.5 hidden text-sm text-slate-500 sm:block">Imágenes y PDFs subidos al viaje.</p>
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
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-sm text-slate-600 dark:border-[color:var(--brand-border)] dark:bg-[var(--surface-page)]/40 dark:text-slate-300 sm:px-5 sm:py-5 sm:text-left">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm sm:mx-0">📎</div>
          <div className="font-bold text-slate-800 dark:text-slate-100">Sin documentos todavía</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Guarda billetes, reservas o PDFs para tenerlos a mano en el viaje.
          </div>
          {onAdd ? (
            <button type="button" onClick={onAdd} className={`${btnPrimary} mt-3 min-h-11 w-full px-4 py-2.5 text-sm sm:w-auto`}>
              Adjuntar documento
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4" data-tour="resources-list-grouped">
          {groupedResources
            ? groupedResources.map((group) => (
                <section key={group.key}>
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    <span aria-hidden>{group.icon}</span>
                    {group.label}
                  </p>
                  <div className="space-y-2">{group.items.map((resource) => renderResourceCard(resource))}</div>
                </section>
              ))
            : resources.map((resource) => renderResourceCard(resource))}
        </div>
      )}
    </div>
  );
}
