"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCopy, Loader2 } from "lucide-react";
import {
  DEFAULT_SIGNATURE_BODY,
  SIGNATURE_DOCUMENT_TYPES,
  SIGNATURE_TYPE_LABELS,
  type SignatureDocumentType,
} from "@/lib/agency/signatures";
import {
  agencyBtnPrimaryClass,
  agencyBtnSecondaryClass,
  agencyInputClass,
  agencyLabelClass,
} from "@/lib/agency-theme";
import { useToast } from "@/components/ui/toast";

type RequestRow = {
  id: string;
  travelerLabel: string | null;
  signerName: string | null;
  signedAt: string | null;
  publicUrl: string | null;
};

export default function AgencyTripSignaturesSection({ tripId }: { tripId: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [pack, setPack] = useState<{
    title: string;
    documentType: SignatureDocumentType;
    bodyText: string;
    isActive: boolean;
  } | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [progress, setProgress] = useState({ signed: 0, total: 0, pending: 0 });
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/signatures`, { cache: "no-store" });
      const data = await res.json();
      if (data.needsMigration) {
        setNeedsMigration(true);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      if (data.pack) {
        setPack({
          title: data.pack.title,
          documentType: data.pack.documentType,
          bodyText: data.pack.bodyText,
          isActive: data.pack.isActive,
        });
      } else {
        setPack(null);
      }
      setRequests(data.requests ?? []);
      setProgress(data.progress ?? { signed: 0, total: 0, pending: 0 });
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setLoading(false);
    }
  }, [tripId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setup(activate = false) {
    setBusy(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/signatures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup", activate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
      toast.push({ kind: "success", title: activate ? "Firma activada" : "Documento creado" });
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!pack) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/signatures`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pack.title,
          bodyText: pack.bodyText,
          documentType: pack.documentType,
          isActive: pack.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
      toast.push({ kind: "success", title: "Documento guardado" });
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function viewSignature(requestId: string) {
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/signatures/${requestId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.signatureDataUrl) throw new Error(data.error || "Sin firma");
      setPreviewUrl(data.signatureDataUrl);
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
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
        Ejecuta <code>docs/kaviro_agency_signatures.sql</code> en Supabase.
      </p>
    );
  }

  if (!pack) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Contrato o exención con firma manuscrita en pantalla (enlace único por viajero).
        </p>
        <button type="button" disabled={busy} onClick={() => void setup(true)} className={agencyBtnPrimaryClass}>
          Activar firma digital
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Firmas: <strong>{progress.signed}/{progress.total}</strong>
        {pack.isActive ? (
          <span className="ml-2 text-emerald-700">· Activo</span>
        ) : (
          <span className="ml-2 text-amber-700">· Borrador (activa para permitir firmar)</span>
        )}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={agencyLabelClass}>Título del documento</span>
          <input
            value={pack.title}
            onChange={(e) => setPack({ ...pack, title: e.target.value })}
            className={`${agencyInputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className={agencyLabelClass}>Tipo</span>
          <select
            value={pack.documentType}
            onChange={(e) => {
              const t = e.target.value as SignatureDocumentType;
              setPack({
                ...pack,
                documentType: t,
                bodyText: pack.bodyText === DEFAULT_SIGNATURE_BODY[pack.documentType] ? DEFAULT_SIGNATURE_BODY[t] : pack.bodyText,
              });
            }}
            className={`${agencyInputClass} mt-1`}
          >
            {SIGNATURE_DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {SIGNATURE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-1 text-sm">
          <input
            type="checkbox"
            checked={pack.isActive}
            onChange={(e) => setPack({ ...pack, isActive: e.target.checked })}
          />
          Permitir firmar (enlace público)
        </label>
      </div>

      <label className="block">
        <span className={agencyLabelClass}>Texto legal / condiciones</span>
        <textarea
          value={pack.bodyText}
          onChange={(e) => setPack({ ...pack, bodyText: e.target.value })}
          rows={8}
          className={`${agencyInputClass} mt-1 font-mono text-xs`}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void save()} className={agencyBtnPrimaryClass}>
          Guardar documento
        </button>
        <button type="button" disabled={busy} onClick={() => void setup(false)} className={agencyBtnSecondaryClass}>
          Generar enlaces
        </button>
      </div>

      {requests.length > 0 ? (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {requests.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {r.signerName || r.travelerLabel || "Viajero"}
                </p>
                {r.signedAt ? (
                  <p className="text-xs text-emerald-700">
                    Firmado {new Date(r.signedAt).toLocaleDateString("es-ES")}
                  </p>
                ) : (
                  <p className="text-xs text-amber-700">Pendiente</p>
                )}
              </div>
              <div className="flex gap-1">
                {r.publicUrl ? (
                  <button
                    type="button"
                    onClick={() => void copy(r.publicUrl!)}
                    className={`${agencyBtnSecondaryClass} gap-1 px-2 py-1 text-[10px]`}
                  >
                    <ClipboardCopy className="h-3 w-3" />
                    Enlace
                  </button>
                ) : null}
                {r.signedAt ? (
                  <button
                    type="button"
                    onClick={() => void viewSignature(r.id)}
                    className={`${agencyBtnSecondaryClass} px-2 py-1 text-[10px]`}
                  >
                    Ver firma
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">Genera enlaces tras añadir viajeros con rol viewer en Plazas.</p>
      )}

      {previewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="max-w-md rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={previewUrl} alt="Firma del viajero" className="mx-auto max-h-40 border border-slate-200" />
            <button type="button" className={`${agencyBtnSecondaryClass} mt-3 w-full`} onClick={() => setPreviewUrl(null)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
