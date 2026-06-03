"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  agencyBtnPrimaryClass,
  agencyBtnSecondaryClass,
  agencyInputClass,
} from "@/lib/agency-theme";
import { useSyncedTripDates } from "@/lib/use-synced-trip-dates";
import {
  formatTemplateIncludesSummary,
  type TripTemplateIncludes,
} from "@/lib/trips/template-includes";

export type AgencyTemplateOption = {
  id: string;
  name: string;
  description: string | null;
  includes?: TripTemplateIncludes;
  trips?: { id: string; name: string | null; destination: string | null } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Plantilla preseleccionada (p. ej. desde la lista en Plantillas). */
  initialTemplateId?: string | null;
};

export default function AgencyInstantiateFromTemplateModal({
  open,
  onClose,
  initialTemplateId = null,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [templates, setTemplates] = useState<AgencyTemplateOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [tripName, setTripName] = useState("");
  const [destination, setDestination] = useState("");
  const [creating, setCreating] = useState(false);
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    endDateMin,
    validateDates,
  } = useSyncedTripDates();

  const loadTemplates = useCallback(async () => {
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
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    void loadTemplates();
    setTripName("");
    setDestination("");
    setStartDate("");
    setEndDate("");
    setSelectedId(initialTemplateId ?? "");
  }, [open, initialTemplateId, loadTemplates, setStartDate, setEndDate]);

  useEffect(() => {
    if (!open || loading || templates.length === 0) return;
    if (selectedId && templates.some((t) => t.id === selectedId)) return;
    const preferred = initialTemplateId && templates.some((t) => t.id === initialTemplateId)
      ? initialTemplateId
      : templates[0]!.id;
    setSelectedId(preferred);
  }, [open, loading, templates, selectedId, initialTemplateId]);

  const selected = templates.find((t) => t.id === selectedId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !tripName.trim()) return;
    const dateErr = validateDates();
    if (dateErr) {
      toast.push({ kind: "error", title: dateErr });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(
        `/api/agencies/templates/${encodeURIComponent(selectedId)}/instantiate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: tripName.trim(),
            destination: destination.trim() || null,
            start_date: startDate || null,
            end_date: endDate || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear el viaje.");
      toast.push({ kind: "success", title: "Viaje creado desde plantilla" });
      onClose();
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-[#0F1623]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="instantiate-template-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-[#334155]">
          <div>
            <h2
              id="instantiate-template-title"
              className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"
            >
              <Layers className="h-5 w-5 text-[#1e3a5f] dark:text-sky-300" aria-hidden />
              Crear viaje desde plantilla
            </h2>
            <p className="mt-1 text-xs text-slate-500">Elige la plantilla y los datos del nuevo programa.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-slate-500">Cargando plantillas…</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No hay plantillas guardadas. Crea una en la pestaña{" "}
              <strong className="text-[#1e3a5f] dark:text-sky-300">Plantillas</strong> del menú.
            </p>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Plantilla
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0B1220]"
                  required
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
                {selected ? (
                  <p className="mt-2 text-xs text-slate-500">
                    {selected.trips?.name ? `Basada en: ${selected.trips.name}` : null}
                    {selected.trips?.destination ? ` · ${selected.trips.destination}` : null}
                    {selected.includes ? (
                      <span className="block mt-1">
                        Incluye: {formatTemplateIncludesSummary(selected.includes)}
                      </span>
                    ) : null}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Nombre del viaje / cliente
                </label>
                <input
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0B1220]"
                  placeholder="Ej. Grupo Martínez — Chicago 2026"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Destino (opcional)
                </label>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0B1220]"
                  placeholder="Ciudad o región"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Inicio
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`mt-1 w-full ${agencyInputClass}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={endDateMin}
                    disabled={!startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`mt-1 w-full ${agencyInputClass}`}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 border-t border-slate-100 px-5 py-4 dark:border-[#334155]">
          <button
            type="button"
            onClick={onClose}
            className={`${agencyBtnSecondaryClass} flex-1`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={creating || loading || templates.length === 0 || !tripName.trim()}
            className={`${agencyBtnPrimaryClass} flex-1 disabled:opacity-50`}
          >
            {creating ? "Creando…" : "Crear viaje"}
          </button>
        </div>
      </form>
    </div>
  );
}
