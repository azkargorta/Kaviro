"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { CheckCheck, Megaphone, X } from "lucide-react";
import { iconSlotFill40 } from "@/components/ui/iconTokens";
import { USER_NOTIFICATIONS_CHANGED_EVENT } from "@/components/notifications/UserNotificationsButton";

type AuditLog = {
  id: string;
  trip_id: string;
  entity_type: string;
  entity_id: string;
  action: "create" | "update" | "delete" | string;
  summary: string | null;
  diff?: unknown;
  actor_email: string | null;
  created_at: string;
};

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  read_at: string | null;
  created_at: string;
};

type FeedFilter = "all" | "plan" | "expenses" | "docs" | "routes" | "notifications";

type FeedItem =
  | { kind: "activity"; log: AuditLog }
  | { kind: "notification"; notification: NotificationRow };

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

function filterLabel(f: FeedFilter) {
  if (f === "all") return "Todo";
  if (f === "plan") return "Plan";
  if (f === "expenses") return "Gastos";
  if (f === "docs") return "Docs";
  if (f === "routes") return "Rutas";
  return "Notificaciones";
}

function filterMatches(log: AuditLog, f: FeedFilter) {
  if (f === "all" || f === "notifications") return true;
  const t = (log.entity_type || "").toLowerCase();
  if (f === "plan") return t === "activity" || t === "plan";
  if (f === "expenses") return t === "expense";
  if (f === "docs") return t === "resource" || t === "reservation";
  if (f === "routes") return t === "route";
  return true;
}

function moduleHref(tripId: string, log: AuditLog) {
  const t = (log.entity_type || "").toLowerCase();
  if (t === "expense") return `/trip/${encodeURIComponent(tripId)}/expenses`;
  if (t === "activity" || t === "plan") return `/trip/${encodeURIComponent(tripId)}/plan`;
  if (t === "resource" || t === "reservation") return `/trip/${encodeURIComponent(tripId)}/resources`;
  if (t === "route") return `/trip/${encodeURIComponent(tripId)}/map`;
  return `/trip/${encodeURIComponent(tripId)}/summary`;
}

function actionLabel(a: string) {
  const k = (a || "").toLowerCase();
  if (k === "create") return "Creado";
  if (k === "update") return "Editado";
  if (k === "delete") return "Borrado";
  return a || "Cambio";
}

function dispatchNotificationsChanged(unreadCount: number, notificationId?: string) {
  window.dispatchEvent(
    new CustomEvent(USER_NOTIFICATIONS_CHANGED_EVENT, {
      detail: { unreadCount, notificationId },
    })
  );
}

export default function TripActivityFeedButton({ tripId, heroMode = false }: { tripId: string; heroMode?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedFilter>("all");

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotifications([]);
        setUnreadNotificationCount(0);
        return;
      }
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadNotificationCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
    } catch {
      setNotifications([]);
      setUnreadNotificationCount(0);
    }
  }, []);

  const unseenActivityCount = useMemo(() => {
    if (!logs.length) return 0;
    if (!lastSeenAt) return logs.length;
    const last = new Date(lastSeenAt).getTime();
    if (!Number.isFinite(last)) return logs.length;
    return logs.filter((l) => new Date(l.created_at).getTime() > last).length;
  }, [logs, lastSeenAt]);

  const pendingCount = unseenActivityCount + unreadNotificationCount;

  const visibleItems = useMemo(() => {
    const items: FeedItem[] = [];

    if (filter === "all" || filter === "notifications") {
      for (const notification of notifications) {
        items.push({ kind: "notification", notification });
      }
    }

    if (filter !== "notifications") {
      for (const log of logs) {
        if (filter === "all" || filterMatches(log, filter)) {
          items.push({ kind: "activity", log });
        }
      }
    }

    return items.sort(
      (a, b) =>
        new Date(b.kind === "activity" ? b.log.created_at : b.notification.created_at).getTime() -
        new Date(a.kind === "activity" ? a.log.created_at : a.notification.created_at).getTime()
    );
  }, [filter, logs, notifications]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    try {
      setLastSeenAt(localStorage.getItem(storageKey(tripId)));
    } catch {
      setLastSeenAt(null);
    }
  }, [mounted, tripId]);

  useEffect(() => {
    void loadNotifications();
    const intervalId = window.setInterval(() => void loadNotifications(), 30_000);
    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ unreadCount?: number; notificationId?: string }>).detail;
      if (typeof detail?.unreadCount === "number") {
        setUnreadNotificationCount(detail.unreadCount);
        if (detail.notificationId) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === detail.notificationId
                ? { ...n, read_at: n.read_at ?? new Date().toISOString() }
                : n
            )
          );
        } else if (detail.unreadCount === 0) {
          setNotifications((prev) =>
            prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
          );
        }
      } else {
        void loadNotifications();
      }
    };
    window.addEventListener(USER_NOTIFICATIONS_CHANGED_EVENT, onChanged as EventListener);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(USER_NOTIFICATIONS_CHANGED_EVENT, onChanged as EventListener);
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [auditRes] = await Promise.all([
          fetch(`/api/trip-audit?tripId=${encodeURIComponent(tripId)}&limit=40`, { cache: "no-store" }),
          loadNotifications(),
        ]);
        const payload = await auditRes.json().catch(() => null);
        if (!auditRes.ok) throw new Error(payload?.error || "No se pudo cargar novedades.");
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
  }, [open, tripId, loadNotifications]);

  function markActivitySeen(log: AuditLog) {
    const seenAt = log.created_at;
    try {
      const current = localStorage.getItem(storageKey(tripId));
      if (!current || new Date(seenAt).getTime() > new Date(current).getTime()) {
        localStorage.setItem(storageKey(tripId), seenAt);
        setLastSeenAt(seenAt);
      }
    } catch {
      setLastSeenAt(seenAt);
    }
  }

  function markAllActivitiesSeen() {
    if (!logs.length) return;
    const seenAt = logs[0]!.created_at;
    try {
      localStorage.setItem(storageKey(tripId), seenAt);
    } catch {
      /* */
    }
    setLastSeenAt(seenAt);
  }

  async function validateNotification(id: string) {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.read_at) return;

    const now = new Date().toISOString();
    const optimisticCount = Math.max(0, unreadNotificationCount - 1);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: now } : n)));
    setUnreadNotificationCount(optimisticCount);
    dispatchNotificationsChanged(optimisticCount, id);

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate_one", id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo validar.");
      const nextCount = typeof data.unreadCount === "number" ? data.unreadCount : optimisticCount;
      setUnreadNotificationCount(nextCount);
      dispatchNotificationsChanged(nextCount, id);
    } catch {
      void loadNotifications();
    }
  }

  async function validateAll() {
    setValidating(true);
    setError(null);
    try {
      if (unreadNotificationCount > 0) {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "validate_all" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "No se pudieron validar las notificaciones.");
        const now = new Date().toISOString();
        setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
        setUnreadNotificationCount(0);
        dispatchNotificationsChanged(0);
      }
      markAllActivitiesSeen();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al validar.");
    } finally {
      setValidating(false);
    }
  }

  function handleActivityClick(log: AuditLog) {
    markActivitySeen(log);
    setOpen(false);
  }

  function handleNotificationClick(notification: NotificationRow) {
    if (!notification.read_at) void validateNotification(notification.id);
    setOpen(false);
  }

  function isActivityPending(log: AuditLog) {
    if (!lastSeenAt) return true;
    return new Date(log.created_at).getTime() > new Date(lastSeenAt).getTime();
  }

  const buttonClass = heroMode
    ? "relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 border border-white/30 text-white transition hover:bg-white/30"
    : "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-4 text-[10px] font-semibold text-[var(--text-secondary)] shadow-sm transition hover:bg-[var(--surface-page)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-border)] dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]";

  const iconTile = heroMode
    ? `relative inline-flex h-5 w-5 items-center justify-center text-white ${iconSlotFill40}`
    : `relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/40 dark:text-slate-50 ${iconSlotFill40}`;

  const pendingLabel =
    pendingCount === 0
      ? "No tienes novedades pendientes de validar."
      : pendingCount === 1
        ? "1 novedad pendiente de validar."
        : `${pendingCount} novedades pendientes de validar.`;

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
          onClick={() => setOpen(false)}
        />
        <div className="pointer-events-auto relative my-auto flex min-h-0 w-full max-w-lg max-h-[min(92dvh,calc(100svh-1.5rem))] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl sm:max-h-[min(90dvh,calc(100svh-2rem))] dark:border-[#1E293B] dark:bg-[#0F1623]">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 pb-3 pt-4 sm:pt-5 dark:border-slate-700/60">
            <div className="min-w-0 pr-2">
              <h2 id="trip-activity-title" className="text-lg font-bold leading-snug text-slate-950 dark:text-slate-50">
                Novedades
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{pendingLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700/60 dark:text-slate-200 dark:hover:bg-slate-900/40"
              aria-label="Cerrar"
            >
              <X aria-hidden />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {(["all", "notifications", "plan", "expenses", "docs", "routes"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`inline-flex min-h-[36px] items-center justify-center rounded-full border px-3 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-border)] ${
                    filter === f
                      ? "border-[var(--brand-border)] bg-[var(--brand-light)] text-[var(--brand-text)]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-900/40"
                  }`}
                >
                  {filterLabel(f)}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="text-sm text-slate-500 dark:text-slate-300">Cargando…</div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-600 dark:border-[color:var(--brand-border)] dark:bg-[var(--surface-page)]/40 dark:text-slate-300">
                {filter === "notifications" ? "No tienes notificaciones todavía." : "No hay novedades todavía."}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleItems.map((item) => {
                  if (item.kind === "notification") {
                    const n = item.notification;
                    const pending = !n.read_at;
                    const className = `block rounded-2xl border px-4 py-3 transition ${
                      pending
                        ? "border-[var(--brand-border)] bg-[var(--brand-light)]/40 dark:border-[#F87171]/30 dark:bg-[#F87171]/5"
                        : "border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623]"
                    } ${n.url ? "hover:bg-slate-50 dark:hover:bg-[#1E293B]" : ""}`;

                    const inner = (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                            Notificaciones
                          </span>
                          <div className="flex items-center gap-2">
                            {pending ? (
                              <span className="h-2 w-2 rounded-full bg-[var(--brand)]" aria-hidden />
                            ) : null}
                            <span className="text-[11px] font-semibold text-slate-400">{formatWhen(n.created_at)}</span>
                          </div>
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">{n.title}</div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{n.body}</div>
                        {n.url ? (
                          <div className="mt-2 text-xs font-bold text-[var(--accent)]">Abrir →</div>
                        ) : null}
                      </>
                    );

                    return (
                      <div key={`n-${n.id}`}>
                        {n.url ? (
                          <Link href={n.url} onClick={() => handleNotificationClick(n)} className={className}>
                            {inner}
                          </Link>
                        ) : (
                          <button type="button" onClick={() => handleNotificationClick(n)} className={`${className} w-full text-left`}>
                            {inner}
                          </button>
                        )}
                      </div>
                    );
                  }

                  const l = item.log;
                  const pending = isActivityPending(l);
                  const className = `block rounded-2xl border px-4 py-3 transition ${
                    pending
                      ? "border-[var(--brand-border)] bg-[var(--brand-light)]/40 dark:border-[#F87171]/30 dark:bg-[#F87171]/5"
                      : "border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623]"
                  } hover:bg-slate-50 dark:hover:bg-[#1E293B]`;

                  return (
                    <Link
                      key={`a-${l.id}`}
                      href={moduleHref(tripId, l)}
                      onClick={() => handleActivityClick(l)}
                      className={className}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                            {entityLabel(l.entity_type)}
                          </span>
                          <span className="rounded-full bg-[var(--brand-light)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--brand-text)] ring-1 ring-[var(--brand-border)]">
                            {actionLabel(l.action)}
                          </span>
                          {pending ? <span className="h-2 w-2 rounded-full bg-[var(--brand)]" aria-hidden /> : null}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                          {formatWhen(l.created_at)}
                        </div>
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {l.summary || `${l.action} · ${l.entity_type}`}
                      </div>
                      {l.actor_email ? (
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Por {l.actor_email}</div>
                      ) : null}
                      <div className="mt-2 text-xs font-bold text-[var(--accent)]">Abrir módulo →</div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="shrink-0 space-y-2 border-t border-slate-100 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:pb-4 dark:border-slate-700/60">
            <button
              type="button"
              disabled={validating || pendingCount === 0}
              onClick={() => void validateAll()}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-border)]"
            >
              <CheckCheck className="h-4 w-4" aria-hidden />
              {validating ? "Validando…" : "Validar todas"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-100"
            >
              Cerrar
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
        aria-label={
          pendingCount > 0
            ? `Novedades, ${pendingCount} pendiente${pendingCount === 1 ? "" : "s"} de validar`
            : "Novedades del viaje"
        }
        title={pendingCount > 0 ? `${pendingCount} pendientes` : "Novedades"}
      >
        <span className={iconTile} aria-hidden>
          <Megaphone className={`h-5 w-5 ${heroMode ? "text-white" : "text-[var(--brand)]"}`} aria-hidden />
          {pendingCount > 0 ? (
            <span
              className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-extrabold text-[#EF4444] ring-2 ring-[#EF4444]/30 dark:bg-[#EF4444] dark:text-white dark:ring-white/30"
              aria-hidden
            >
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          ) : null}
        </span>
        {!heroMode && <span>Novedades</span>}
      </button>
      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
