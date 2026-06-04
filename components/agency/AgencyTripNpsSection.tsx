"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCopy, Loader2, Star } from "lucide-react";
import { agencyBtnPrimaryClass, agencyBtnSecondaryClass } from "@/lib/agency-theme";
import { useToast } from "@/components/ui/toast";

type Row = {
  id: string;
  traveler_label: string | null;
  submitted: boolean;
  nps_score: number | null;
  publicUrl: string | null;
  allow_testimonial: boolean;
};

export default function AgencyTripNpsSection({ tripId }: { tripId: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [avgNps, setAvgNps] = useState<number | null>(null);
  const [progress, setProgress] = useState({ submitted: 0, total: 0 });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/nps`, { cache: "no-store" });
      const data = await res.json();
      if (data.needsMigration) {
        setNeedsMigration(true);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setRows(
        (data.responses ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          traveler_label: r.traveler_label as string | null,
          submitted: Boolean(r.submitted_at),
          nps_score: r.nps_score != null ? Number(r.nps_score) : null,
          publicUrl: r.publicUrl as string | null,
          allow_testimonial: Boolean(r.allow_testimonial),
        }))
      );
      setAvgNps(data.avgNps ?? null);
      setProgress(data.progress ?? { submitted: 0, total: 0 });
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setLoading(false);
    }
  }, [tripId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setup() {
    setBusy(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/nps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      await load();
      toast.push({ kind: "success", title: "Encuesta NPS lista" });
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
      toast.push({ kind: "success", title: "Enlace copiado" });
    } catch {
      toast.push({ kind: "error", title: "No se pudo copiar" });
    }
  }

  if (loading) return <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />;
  if (needsMigration) {
    return (
      <p className="text-sm text-amber-800">
        Ejecuta <code>docs/kaviro_agency_nps.sql</code> en Supabase.
      </p>
    );
  }

  if (progress.total === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Encuesta post-viaje (NPS 0-10 y valoraciones por categoría).</p>
        <button type="button" disabled={busy} onClick={() => void setup()} className={agencyBtnPrimaryClass}>
          Activar encuesta NPS
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Respuestas: <strong>{progress.submitted}/{progress.total}</strong>
        {avgNps != null ? (
          <>
            {" "}
            · NPS medio: <strong>{avgNps}</strong>
          </>
        ) : null}
      </p>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.traveler_label ?? "Viajero"}</p>
              {r.submitted && r.nps_score != null ? (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  NPS {r.nps_score}
                  {r.allow_testimonial ? " · OK testimonial" : ""}
                </p>
              ) : (
                <p className="text-xs text-amber-700">Pendiente</p>
              )}
            </div>
            {r.publicUrl && !r.submitted ? (
              <button
                type="button"
                onClick={() => void copy(r.publicUrl!)}
                className={`${agencyBtnSecondaryClass} gap-1 px-2 py-1 text-[10px]`}
              >
                <ClipboardCopy className="h-3 w-3" />
                Copiar enlace
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
