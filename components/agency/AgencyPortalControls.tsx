"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, FileDown, Globe, GlobeLock, Loader2 } from "lucide-react";
import { clientPortalPath } from "@/lib/agency";
import { agencyBtnPrimaryClass, agencyBtnSecondaryClass } from "@/lib/agency-theme";
import { useToast } from "@/components/ui/toast";

type Props = {
  tripId: string;
  agencySlug: string;
  clientPortalSlug: string | null;
};

export default function AgencyPortalControls({ tripId, agencySlug, clientPortalSlug }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const portalPath =
    clientPortalSlug != null && clientPortalSlug !== ""
      ? clientPortalPath(agencySlug, clientPortalSlug)
      : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/portal`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setIsActive(Boolean(data.portal?.isActive));
        setLastPublishedAt(data.portal?.lastPublishedAt ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  async function setPublish(action: "publish" | "unpublish") {
    setBusy(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/portal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar el portal.");
      setIsActive(action === "publish");
      setLastPublishedAt(data.lastPublishedAt ?? null);
      toast.push({
        kind: "success",
        title: action === "publish" ? "Portal publicado" : "Portal oculto",
      });
    } catch (e) {
      toast.push({
        kind: "error",
        title: e instanceof Error ? e.message : "Error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!portalPath || typeof window === "undefined") return;
    const url = `${window.location.origin}${portalPath}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.push({ kind: "success", title: "Enlace copiado" });
  }

  if (!portalPath) return null;

  const publishedLabel = lastPublishedAt
    ? new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(
        new Date(lastPublishedAt)
      )
    : null;

  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-600 dark:bg-slate-800/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Portal cliente
        </p>
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" aria-hidden />
        ) : (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              isActive
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-500/15 text-amber-800 dark:text-amber-200"
            }`}
          >
            {isActive ? <Globe className="h-3 w-3" /> : <GlobeLock className="h-3 w-3" />}
            {isActive ? "Publicado" : "Borrador"}
          </span>
        )}
      </div>

      {publishedLabel ? (
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Última publicación: {publishedLabel}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {isActive ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setPublish("unpublish")}
            className={`${agencyBtnSecondaryClass} text-xs`}
          >
            Ocultar portal
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setPublish("publish")}
            className={`${agencyBtnPrimaryClass} text-xs`}
          >
            Publicar
          </button>
        )}
        <button type="button" onClick={copyLink} className={`${agencyBtnSecondaryClass} gap-1 text-xs`}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          Copiar enlace
        </button>
        <Link
          href={portalPath}
          target="_blank"
          rel="noopener noreferrer"
          className={`${agencyBtnSecondaryClass} gap-1 text-xs`}
        >
          Ver
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={`${portalPath}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${agencyBtnSecondaryClass} gap-1 text-xs`}
        >
          <FileDown className="h-3.5 w-3.5" />
          PDF
        </Link>
      </div>

      <p className="mt-2 break-all font-mono text-[10px] text-slate-500 dark:text-slate-400">{portalPath}</p>
    </div>
  );
}
