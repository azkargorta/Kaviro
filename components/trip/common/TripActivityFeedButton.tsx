"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, X } from "lucide-react";
import { iconSlotFill40 } from "@/components/ui/iconTokens";

type AuditLog = {
  id: string;
  trip_id: string;
  entity_type: string;
  entity_id: string;
  action: "create" | "update" | "delete" | string;
  summary: string | null;
  actor_email: string | null;
  created_at: string;
};

function storageKey(tripId: string) {
  return `tripboard:activity:last_seen_at:${tripId}`;
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function entityLabel(t: string) {
  const k = (t || "").toLowerCase();
  if (k === "expense") return "Gastos";
  if (k === "activity" || k === "plan") return "Plan";
  if (k === "resource" || k === "reservation") return "Docs";
  if (k === "route") return "Rutas";
  return t || "Cambio";
}

export default function TripActivityFeedButton({ tripId }: { tripId: string }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const lastSeenAt = useMemo(() => {
    if (!mounted) return null;
    try {
      return localStorage.getItem(storageKey(tripId));
    } catch {
      return null;
    }
  }, [mounted, tripId]);

  const unseenCount = useMemo(() => {
    if (!lastSeenAt) return logs.length > 0 ? Math.min(logs.length, 9) : 0;
    const last = new Date(lastSeenAt).getTime();
    if (!Number.isFinite(last)) return 0;
    const c = logs.filter((l) => new Date(l.created_at).getTime() > last).length;
    return Math.min(c, 9);
  }, [logs, lastSeenAt]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`/api/trip-audit?tripId=${encodeURIComponent(tripId)}&limit=40`, { cache: "no-store" });
        const payload = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(payload?.error || "No se pudo cargar novedades.");
        const next = Array.isArray(payload?.logs) ? (payload.logs as AuditLog[]) : [];
        if (!cancelled) setLogs(next);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "No se pudo cargar novedades.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, tripId]);

  function markSeen() {
    if (!logs.length) return;
    try {
      localStorage.setItem(storageKey(tripId), logs[0]!.created_at);
    } catch {
      /* */
    }
  }

  function close() {
    setOpen(false);
    markSeen();
  }

  const buttonClass =
    "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:bg-violet-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-border)] dark:border-slate-700/60 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-900/40";

  const iconTile =
    `relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/40 dark:text-slate-50 ${iconSlotFill40}`;

  const modal =
    mounted && open ? (
      <div
        className="fixed inset-0 z-[1180] flex items-center justify-center overflow-y-auto overscroll-contain px-3 py-[max(10px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-activity-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] dark:bg-black/60"
          aria-label="Cerrar novedades"
          onClick={close}
        />
        <div className="pointer-events-auto relative my-auto flex min-h-0 w-full max-w-lg max-h-[min(92dvh,calc(100svh-1.5rem))] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl sm:max-h-[min(90dvh,calc(100svh-2rem))] dark:border-slate-700/60 dark:bg-slate-950/70">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 pb-3 pt-4 sm:pt-5 dark:border-slate-700/60">
            <div className="min-w-0 pr-2">
              <h2 id="trip-activity-title" className="text-lg font-bold leading-snug text-slate-950 dark:text-slate-50">
                Novedades
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Últimos cambios en plan, gastos y documentos.
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700/60 dark:text-slate-200 dark:hover:bg-slate-900/40"
              aria-label="Cerrar"
            >
              <X aria-hidden />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {loading ? (
              <div className="text-sm text-slate-500 dark:text-slate-300">Cargando…</div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-600 dark:border-[color:var(--brand-border)] dark:bg-[var(--surface-page)]/40 dark:text-slate-300">
                No hay novedades todavía.
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((l) => (
                  <div key={l.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700/60 dark:bg-slate-950/40">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                        {entityLabel(l.entity_type)}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                        {formatWhen(l.created_at)}
                      </div>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {l.summary || `${l.action} · ${l.entity_type}`}
                    </div>
                    {l.actor_email ? (
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Por {l.actor_email}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-100 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:pb-4 dark:border-slate-700/60">
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-border)]"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass}
        aria-label="Novedades del viaje"
        title="Novedades"
      >
        <span className={iconTile} aria-hidden>
          <Bell className="h-5 w-5 text-violet-700 dark:text-[var(--accent)]" aria-hidden />
          {unseenCount > 0 ? (
            <span
              className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-extrabold text-white"
              aria-hidden
            >
              {unseenCount}
            </span>
          ) : null}
        </span>
        <span>Novedades</span>
      </button>
      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}

