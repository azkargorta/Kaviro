"use client";

import { useEffect } from "react";
import type { ClientPortalAnnouncement, ClientPortalDocument } from "@/lib/load-agency-client-portal";
import { FileText, Megaphone } from "lucide-react";

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
    <section className="mb-6 space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
        <Megaphone className="h-4 w-4" aria-hidden />
        Avisos de tu agencia
      </h2>
      {items.map((a) => (
        <article
          key={a.id}
          className="rounded-lg border border-[#1e3a5f]/20 bg-[#1e3a5f]/5 p-4 dark:border-sky-900/40 dark:bg-[#1e3a5f]/10"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">{a.title}</h3>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{a.body}</p>
        </article>
      ))}
    </section>
  );
}

export function ClientPortalDocuments({ items }: { items: ClientPortalDocument[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
        <FileText className="h-4 w-4" aria-hidden />
        Documentos
      </h2>
      <ul className="space-y-2">
        {items.map((doc) => (
          <li key={doc.id}>
            {doc.file_url ? (
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#1e3a5f] transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-sky-300"
              >
                <FileText className="h-4 w-4 shrink-0" aria-hidden />
                {doc.title || "Documento"}
              </a>
            ) : (
              <span className="text-sm text-slate-500">{doc.title || "Documento"}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
