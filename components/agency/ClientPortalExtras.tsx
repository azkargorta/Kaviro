"use client";

import { useEffect } from "react";
import type { ClientPortalAnnouncement, ClientPortalDocument } from "@/lib/load-agency-client-portal";
import { ExternalLink, FileText, Megaphone } from "lucide-react";

export function ClientPortalViewTracker({ agencySlug, tripSlug }: { agencySlug: string; tripSlug: string }) {
  useEffect(() => {
    fetch(`/api/client/${encodeURIComponent(agencySlug)}/${encodeURIComponent(tripSlug)}/view`, {
      method: "POST",
    }).catch(() => {});
  }, [agencySlug, tripSlug]);
  return null;
}

export function ClientPortalAnnouncements({ items }: { items: ClientPortalAnnouncement[] }) {
  if (items.length === 0) return null;
  return (
    <section id="avisos" className="mb-6 space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
          <Megaphone className="h-4 w-4" aria-hidden />
          Avisos
        </h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          {items.length}
        </span>
      </div>
      {items.map((a) => (
        <article
          key={a.id}
          className="overflow-hidden rounded-xl border border-amber-200/70 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20"
        >
          <div className="flex">
            <div className="w-1 shrink-0 rounded-l-xl bg-amber-400 dark:bg-amber-500" />
            <div className="flex-1 px-4 py-3.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                <time className="mt-0.5 shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                  {new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(
                    new Date(a.created_at)
                  )}
                </time>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                {a.body}
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

export function ClientPortalDocuments({ items }: { items: ClientPortalDocument[] }) {
  if (items.length === 0) return null;
  return (
    <section id="documentos" className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
        <FileText className="h-4 w-4" aria-hidden />
        Documentos
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((doc) =>
          doc.file_url ? (
            <a
              key={doc.id}
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-[var(--brand,#1e3a5f)]/40 hover:shadow-sm dark:border-slate-700 dark:bg-[#0F1623] dark:hover:border-sky-700/40"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand,#1e3a5f)]/10 text-[var(--brand,#1e3a5f)] dark:bg-sky-900/30 dark:text-sky-300">
                <FileText className="h-4 w-4" aria-hidden />
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 transition group-hover:text-[var(--brand,#1e3a5f)] dark:text-slate-100 dark:group-hover:text-sky-300">
                {doc.title || "Documento"}
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-[var(--brand,#1e3a5f)] dark:group-hover:text-sky-300" aria-hidden />
            </a>
          ) : (
            <span key={doc.id} className="text-sm text-slate-500">
              {doc.title || "Documento"}
            </span>
          )
        )}
      </div>
    </section>
  );
}
