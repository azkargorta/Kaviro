"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { agencyBtnPrimaryClass, agencyBtnSecondaryClass } from "@/lib/agency-theme";
import type { TripTemplateIncludes } from "@/lib/trips/template-includes";
import { formatTemplateIncludesSummary } from "@/lib/trips/template-includes";

type TemplateOption = {
  id: string;
  name: string;
  includes?: TripTemplateIncludes;
};

export default function AgencyFillTripFromTemplateButton({
  tripId,
  tripName,
}: {
  tripId: string;
  tripName: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [selectedId, setSelectedId] = useState("");

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
    setSelectedId("");
  }, [open, loadTemplates]);

  useEffect(() => {
    if (!open || loading || templates.length === 0) return;
    if (selectedId && templates.some((t) => t.id === selectedId)) return;
    setSelectedId(templates[0]!.id);
  }, [open, loading, templates, selectedId]);

  const selected = templates.find((t) => t.id === selectedId);

  async function handleApply() {
    if (!selectedId) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/agencies/trips/${encodeURIComponent(tripId)}/apply-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: selectedId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo importar la plantilla.");

      const n = typeof data?.copied?.activities === "number" ? data.copied.activities : 0;
      toast.push({
        kind: "success",
        title:
          n > 0
            ? `Plan importado: ${n} actividad${n === 1 ? "" : "es"}`
            : "Contenido de plantilla importado",
      });
      setOpen(false);
      router.push(`/trip/${tripId}/plan`);
      router.refresh();
    } catch (e) {
      toast.push({
        kind: "error",
        title: e instanceof Error ? e.message : "Error",
      });
    } finally {
      setApplying(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${agencyBtnSecondaryClass} gap-1.5 text-xs`}
        title="Importar plan y rutas desde una plantilla guardada"
      >
        <Layers className="h-3.5 w-3.5" aria-hidden />
        Importar plantilla
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-[#0F1623]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fill-template-title"
          >
            <h2 id="fill-template-title" className="text-base font-bold text-slate-900 dark:text-white">
              Importar plantilla en «{tripName}»
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Solo si el plan está vacío. Copia actividades, rutas y lo demás según la plantilla.
            </p>

            {loading ? (
              <p className="mt-4 text-sm text-slate-500">Cargando plantillas…</p>
            ) : templates.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No hay plantillas. Créalas en la sección Plantillas.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Plantilla
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0F1623]"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {selected?.includes ? (
                  <p className="text-[11px] text-slate-500">
                    Incluye: {formatTemplateIncludesSummary(selected.includes)}
                  </p>
                ) : null}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={applying}
                onClick={() => setOpen(false)}
                className={`${agencyBtnSecondaryClass} flex-1 disabled:opacity-50`}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={applying || loading || templates.length === 0 || !selectedId}
                onClick={() => void handleApply()}
                className={`${agencyBtnPrimaryClass} flex-1 disabled:opacity-50`}
              >
                {applying ? "Importando…" : "Importar al plan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
