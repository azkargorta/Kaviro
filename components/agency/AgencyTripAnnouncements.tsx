"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Megaphone } from "lucide-react";
import { agencyBtnPrimaryClass, agencyCardClass, agencyInputClass, agencyLabelClass } from "@/lib/agency-theme";
import { useToast } from "@/components/ui/toast";

type Announcement = { id: string; title: string; body: string; created_at: string };

export default function AgencyTripAnnouncements({
  tripId,
  embedded = false,
  collapsible = false,
  defaultOpen = false,
}: {
  tripId: string;
  /** Sin tarjeta duplicada cuando va dentro de Operaciones o Plan */
  embedded?: boolean;
  /** Cabecera clicable; contenido oculto hasta expandir (p. ej. en pestaña Plan) */
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(defaultOpen);
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/agencies/trips/${tripId}/announcements`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setItems(data.announcements ?? []);
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setTitle("");
      setBody("");
      toast.push({
        kind: "success",
        title: "Aviso publicado",
        description: "Los viajeros lo verán en Avisos y recibirán notificación en Mis viajes.",
      });
      load();
    } catch (err) {
      toast.push({ kind: "error", title: err instanceof Error ? err.message : "Error" });
    } finally {
      setSaving(false);
    }
  }

  const shellClass = embedded ? "space-y-4" : `${agencyCardClass} p-4 space-y-4`;

  const inner = (
    <>
      {!embedded && !collapsible ? (
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Megaphone className="h-4 w-4 text-[#1e3a5f] dark:text-sky-300" aria-hidden />
          Avisos al grupo (portal)
        </h3>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
        <div>
          <label className={agencyLabelClass}>Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={agencyInputClass} />
        </div>
        <div className="md:col-span-2">
          <label className={agencyLabelClass}>Mensaje</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className={agencyInputClass}
          />
        </div>
        <div className="md:col-span-2">
          <button type="submit" disabled={saving} className={agencyBtnPrimaryClass}>
            {saving ? "Enviando…" : "Publicar aviso"}
          </button>
        </div>
      </form>

      {items.length > 0 ? (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {items.map((a) => (
            <li key={a.id} className="py-3 first:pt-0">
              <p className="font-semibold text-sm text-slate-900 dark:text-white">{a.title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{a.body}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );

  if (collapsible && embedded) {
    return (
      <section id="avisos-grupo" className="scroll-mt-4">
        <div
          className={`${agencyCardClass} overflow-hidden border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white dark:border-amber-900/40 dark:from-amber-950/30 dark:to-[var(--surface-card)]`}
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-start gap-3 p-4 text-left hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
            aria-expanded={open}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100">
              <Megaphone className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Avisos al grupo</h2>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Publica novedades para viajeros (portal, pestaña Avisos y notificación en Mis viajes).
                {items.length > 0 ? ` · ${items.length} publicado${items.length === 1 ? "" : "s"}` : ""}
              </p>
            </div>
            <ChevronDown
              className={`mt-1 h-5 w-5 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {open ? <div className="space-y-4 border-t border-amber-200/60 px-4 pb-4 pt-4 dark:border-amber-900/40">{inner}</div> : null}
        </div>
      </section>
    );
  }

  return <div className={shellClass}>{inner}</div>;
}
