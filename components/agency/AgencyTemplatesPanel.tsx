"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Copy, Layers, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { clientPortalPath } from "@/lib/agency";
import {
  agencyBtnPrimaryClass,
  agencyBtnSecondaryClass,
  agencyCardClass,
  agencyInputClass,
  agencyPageSubtitleClass,
  agencyPageTitleClass,
} from "@/lib/agency-theme";
import { useSyncedTripDates } from "@/lib/use-synced-trip-dates";
import {
  DEFAULT_TRIP_TEMPLATE_INCLUDES,
  formatTemplateIncludesSummary,
  TEMPLATE_INCLUDE_LABELS,
  type TripTemplateIncludes,
} from "@/lib/trips/template-includes";

type AgencyTripOption = { id: string; name: string | null };

type TemplateRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  source_trip_id: string;
  includes?: TripTemplateIncludes;
  trips?: { id: string; name: string | null; destination: string | null } | null;
};

type Props = {
  agencySlug: string;
  trips: AgencyTripOption[];
};

export default function AgencyTemplatesPanel({ agencySlug, trips }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceTripId, setSourceTripId] = useState(trips[0]?.id ?? "");
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateIncludes, setTemplateIncludes] = useState<TripTemplateIncludes>({
    ...DEFAULT_TRIP_TEMPLATE_INCLUDES,
  });
  const [saving, setSaving] = useState(false);
  const [useTemplateId, setUseTemplateId] = useState<string | null>(null);
  const [newTripName, setNewTripName] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const {
    startDate: newStart,
    endDate: newEnd,
    setStartDate: setNewStart,
    setEndDate: setNewEnd,
    endDateMin: newEndMin,
    validateDates,
  } = useSyncedTripDates();
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agencies/templates", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron cargar las plantillas.");
      setTemplates(data.templates ?? []);
    } catch (e) {
      toast.push({
        kind: "error",
        title: e instanceof Error ? e.message : "Error al cargar plantillas",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceTripId || !templateName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agencies/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_trip_id: sourceTripId,
          name: templateName.trim(),
          description: templateDesc.trim() || null,
          includes: templateIncludes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar.");
      if (data.warning) {
        toast.push({ kind: "info", title: data.warning });
      }
      toast.push({ kind: "success", title: "Plantilla guardada" });
      setTemplateName("");
      setTemplateDesc("");
      await load();
    } catch (e) {
      toast.push({
        kind: "error",
        title: e instanceof Error ? e.message : "Error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    try {
      const res = await fetch(`/api/agencies/templates/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar.");
      toast.push({ kind: "success", title: "Plantilla eliminada" });
      await load();
    } catch (e) {
      toast.push({
        kind: "error",
        title: e instanceof Error ? e.message : "Error",
      });
    }
  }

  async function handleInstantiate(e: React.FormEvent) {
    e.preventDefault();
    if (!useTemplateId || !newTripName.trim()) return;
    const dateErr = validateDates();
    if (dateErr) {
      toast.push({ kind: "error", title: dateErr });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(
        `/api/agencies/templates/${encodeURIComponent(useTemplateId)}/instantiate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newTripName.trim(),
            destination: newDestination.trim() || null,
            start_date: newStart || null,
            end_date: newEnd || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear el viaje.");
      toast.push({ kind: "success", title: "Viaje creado desde plantilla" });
      setUseTemplateId(null);
      setNewTripName("");
      router.push(`/trip/${data.tripId}/plan`);
      router.refresh();
    } catch (e) {
      toast.push({
        kind: "error",
        title: e instanceof Error ? e.message : "Error",
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className={agencyPageTitleClass}>Plantillas</h1>
        <p className={agencyPageSubtitleClass}>
          Guarda un viaje como plantilla y créalo de nuevo para cada cliente sin rehacer el itinerario.
        </p>
      </div>

      <section className={`${agencyCardClass} p-5`}>
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Plus className="h-4 w-4" aria-hidden />
          Nueva plantilla
        </h2>
        {trips.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Crea primero un viaje en{" "}
            <Link href="/agency" className="font-semibold text-[#1e3a5f] underline dark:text-sky-300">
              Mis viajes
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={handleSaveTemplate} className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Viaje origen
              </label>
              <select
                value={sourceTripId}
                onChange={(e) => setSourceTripId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0F1623]"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || "Sin nombre"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Nombre de la plantilla
              </label>
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0F1623]"
                placeholder="Ej. Circuito 7 días Europa"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Descripción (opcional)
              </label>
              <textarea
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0F1623]"
              />
            </div>
            <fieldset className="rounded-xl border border-slate-200 p-3 dark:border-[#334155]">
              <legend className="px-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                Qué incluir al usar esta plantilla
              </legend>
              <ul className="mt-2 space-y-2">
                {TEMPLATE_INCLUDE_LABELS.map(({ key, label, hint }) => (
                  <li key={key}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={templateIncludes[key]}
                        disabled={key === "routes" && !templateIncludes.plan}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setTemplateIncludes((prev) => {
                            const next = { ...prev, [key]: checked };
                            if (key === "plan" && !checked) next.routes = false;
                            return next;
                          });
                        }}
                        className="mt-0.5 rounded border-slate-300"
                      />
                      <span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{label}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
            <button
              type="submit"
              disabled={saving || !templateName.trim()}
              className={`${agencyBtnPrimaryClass} disabled:opacity-50`}
            >
              {saving ? "Guardando…" : "Guardar plantilla"}
            </button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Layers className="h-4 w-4" aria-hidden />
          Plantillas guardadas
        </h2>
        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay plantillas.</p>
        ) : (
          <ul className="space-y-3">
            {templates.map((tpl) => {
              const sourceName = tpl.trips?.name ?? "Viaje";
              return (
                <li
                  key={tpl.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#334155] dark:bg-[#0B1220]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{tpl.name}</p>
                      <p className="text-xs text-slate-500">
                        Basada en: {sourceName}
                        {tpl.trips?.destination ? ` · ${tpl.trips.destination}` : ""}
                      </p>
                      {tpl.description ? (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{tpl.description}</p>
                      ) : null}
                      {tpl.includes ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Incluye: {formatTemplateIncludesSummary(tpl.includes)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUseTemplateId(tpl.id);
                          setNewTripName("");
                          setNewDestination("");
                          setNewStart("");
                          setNewEnd("");
                        }}
                        className={`${agencyBtnPrimaryClass} gap-1 px-3 py-1.5 text-xs`}
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                        Usar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tpl.id)}
                        className="inline-flex items-center rounded-xl border border-slate-200 px-2 py-1.5 text-slate-500 dark:border-[#334155]"
                        aria-label="Eliminar plantilla"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {useTemplateId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={handleInstantiate}
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-[#0F1623]"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nuevo viaje desde plantilla</h3>
            <div className="mt-4 space-y-3">
              <input
                value={newTripName}
                onChange={(e) => setNewTripName(e.target.value)}
                placeholder="Nombre del viaje / cliente"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0B1220]"
                required
              />
              <input
                value={newDestination}
                onChange={(e) => setNewDestination(e.target.value)}
                placeholder="Destino"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0B1220]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className={agencyInputClass}
                />
                <input
                  type="date"
                  value={newEnd}
                  min={newEndMin}
                  disabled={!newStart}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className={agencyInputClass}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setUseTemplateId(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold dark:border-[#334155]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className={`${agencyBtnPrimaryClass} flex-1 disabled:opacity-50`}
              >
                {creating ? "Creando…" : "Crear viaje"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <p className="text-xs text-slate-500">
        Portal cliente: <code className="text-slate-700 dark:text-slate-300">{clientPortalPath(agencySlug, "…")}</code>
      </p>

      <Link
        href="/agency"
        className="inline-flex text-sm font-bold text-[#1e3a5f] hover:underline dark:text-sky-300"
      >
        ← Volver a mis viajes
      </Link>
    </div>
  );
}
