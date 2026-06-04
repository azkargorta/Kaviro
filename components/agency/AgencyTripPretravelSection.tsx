"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCopy, Download, FileText, Loader2 } from "lucide-react";
import {
  agencyBtnPrimaryClass,
  agencyBtnSecondaryClass,
  agencyCardClass,
} from "@/lib/agency-theme";
import { useToast } from "@/components/ui/toast";

type RosterRow = {
  participantId: string;
  displayName: string;
  email: string | null;
  submitted: boolean;
  publicUrl: string | null;
};

export default function AgencyTripPretravelSection({ tripId }: { tripId: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [progress, setProgress] = useState({ submitted: 0, total: 0 });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/pretravel`, { cache: "no-store" });
      const data = await res.json();
      if (data.needsMigration) {
        setNeedsMigration(true);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setEnabled(Boolean(data.enabled));
      setRoster(data.roster ?? []);
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
      const res = await fetch(`/api/agencies/trips/${tripId}/pretravel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.push({
        kind: "success",
        title: "Encuesta activada",
        description: data.tokensCreated ? `${data.tokensCreated} enlaces creados` : undefined,
      });
      await load();
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function syncTokens() {
    setBusy(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/pretravel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "syncTokens" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.push({ kind: "success", title: `${data.tokensCreated ?? 0} enlaces nuevos` });
      await load();
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`
      );
      toast.push({ kind: "success", title: "Enlace copiado" });
    } catch {
      toast.push({ kind: "error", title: "No se pudo copiar" });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (needsMigration) {
    return (
      <p className="text-sm text-amber-800 dark:text-amber-200">
        Ejecuta <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">docs/kaviro_agency_pretravel_survey.sql</code> en
        Supabase.
      </p>
    );
  }

  if (!enabled) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Recoge restricciones alimentarias, contacto de emergencia, documento y talla de ropa. Cada viajero recibe un
          enlace personal sin registrarse en Kaviro.
        </p>
        <button type="button" disabled={busy} onClick={() => void setup()} className={agencyBtnPrimaryClass}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Activar encuesta pre-viaje
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Respuestas: {progress.submitted}/{progress.total}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => void syncTokens()} className={agencyBtnSecondaryClass}>
            Generar enlaces
          </button>
          <a
            href={`/api/agencies/trips/${tripId}/pretravel/export`}
            className={`${agencyBtnSecondaryClass} gap-1`}
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Exportar CSV
          </a>
        </div>
      </div>

      {roster.length === 0 ? (
        <p className="text-sm text-slate-500">
          Añade viajeros (rol viewer) en Participantes o en la sección de plazas, luego pulsa «Generar enlaces».
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {roster.map((r) => (
            <li key={r.participantId} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.displayName}</p>
                {r.email ? <p className="text-xs text-slate-500">{r.email}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    r.submitted
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                      : "bg-amber-500/15 text-amber-900 dark:text-amber-200"
                  }`}
                >
                  {r.submitted ? "Completado" : "Pendiente"}
                </span>
                {r.publicUrl ? (
                  <button
                    type="button"
                    onClick={() => void copyLink(r.publicUrl!)}
                    className={`${agencyBtnSecondaryClass} gap-1 px-2 py-1 text-[10px]`}
                  >
                    <ClipboardCopy className="h-3 w-3" aria-hidden />
                    Copiar enlace
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
