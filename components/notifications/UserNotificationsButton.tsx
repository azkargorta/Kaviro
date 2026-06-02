"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const USER_NOTIFICATIONS_CHANGED_EVENT = "kaviro:user-notifications-changed";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string | null;
  read_at: string | null;
  created_at: string;
};

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

function dispatchNotificationsChanged(unreadCount: number, notificationId?: string) {
  window.dispatchEvent(
    new CustomEvent(USER_NOTIFICATIONS_CHANGED_EVENT, {
      detail: { unreadCount, notificationId },
    })
  );
}

type Props = {
  /** Estilo sobre hero coral del dashboard */
  heroMode?: boolean;
};

export default function UserNotificationsButton({ heroMode = true }: Props) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const applyPayload = useCallback((data: { notifications?: NotificationRow[]; unreadCount?: number }) => {
    setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      applyPayload(data);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [applyPayload]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    void load();
    const intervalId = window.setInterval(() => void load(), 30_000);
    const onFocus = () => void load();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return;
      channel = supabase
        .channel(`user-notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "user_notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            void load();
          }
        )
        .subscribe();
    })();
    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ unreadCount?: number; notificationId?: string }>).detail;
      if (typeof detail?.unreadCount === "number") {
        setUnreadCount(detail.unreadCount);
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
        void load();
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener(USER_NOTIFICATIONS_CHANGED_EVENT, onChanged as EventListener);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(USER_NOTIFICATIONS_CHANGED_EVENT, onChanged as EventListener);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function fetchOpen() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/notifications", { credentials: "include", cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "No se pudieron cargar las notificaciones.");
        if (!cancelled) applyPayload(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchOpen();
    return () => {
      cancelled = true;
    };
  }, [open, applyPayload]);

  async function validateOne(id: string) {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.read_at) return;

    const now = new Date().toISOString();
    const optimisticCount = Math.max(0, unreadCount - 1);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: now } : n)));
    setUnreadCount(optimisticCount);
    dispatchNotificationsChanged(optimisticCount, id);

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate_one", id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo validar la notificación.");
      await load();
      const nextCount = typeof data.unreadCount === "number" ? data.unreadCount : optimisticCount;
      dispatchNotificationsChanged(nextCount, id);
    } catch {
      void load();
    }
  }

  function handleNotificationClick(id: string, pending: boolean) {
    if (pending) void validateOne(id);
    setOpen(false);
  }

  async function validateAll() {
    setValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate_all" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudieron validar las notificaciones.");
      await load();
      dispatchNotificationsChanged(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al validar.");
    } finally {
      setValidating(false);
    }
  }

  const buttonClass = heroMode
    ? "relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    : "relative inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-4 text-[10px] font-semibold text-[var(--text-secondary)] shadow-sm";

  const badge =
    unreadCount > 0 ? (
      <span
        className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-extrabold text-[#EF4444] ring-2 ring-[#EF4444]/30 dark:bg-[#EF4444] dark:text-white dark:ring-white/30"
        aria-hidden
      >
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    ) : null;

  const pendingLabel =
    unreadCount === 0
      ? "No tienes notificaciones pendientes."
      : unreadCount === 1
        ? "1 notificación pendiente de validar."
        : `${unreadCount} notificaciones pendientes de validar.`;

  const modal =
    mounted && open ? (
      <div
        className="fixed inset-0 z-[1180] flex items-center justify-center overflow-y-auto overscroll-contain px-3 py-[max(10px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-notifications-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] dark:bg-black/60"
          aria-label="Cerrar notificaciones"
          onClick={() => setOpen(false)}
        />
        <div className="pointer-events-auto relative my-auto flex min-h-0 w-full max-w-lg max-h-[min(92dvh,calc(100svh-1.5rem))] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl dark:border-[#1E293B] dark:bg-[#0F1623]">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 pb-3 pt-4 sm:pt-5 dark:border-slate-700/60">
            <div className="min-w-0 pr-2">
              <h2 id="user-notifications-title" className="text-lg font-bold text-slate-950 dark:text-slate-50">
                Notificaciones
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{pendingLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700/60 dark:text-slate-200"
              aria-label="Cerrar"
            >
              <X aria-hidden />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {loading ? (
              <p className="text-sm text-slate-500">Cargando…</p>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300">
                No tienes notificaciones todavía.
              </div>
            ) : (
              <ul className="space-y-3">
                {notifications.map((n) => {
                  const pending = !n.read_at;
                  const inner = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-bold ${pending ? "text-slate-950 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}
                        >
                          {n.title}
                        </p>
                        {pending ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--brand)]" aria-hidden />
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{n.body}</p>
                      <p className="mt-2 text-[11px] font-semibold text-slate-400">{formatWhen(n.created_at)}</p>
                    </>
                  );

                  const className = `block rounded-2xl border px-4 py-3 transition ${
                    pending
                      ? "border-[var(--brand-border)] bg-[var(--brand-light)]/40 dark:border-[#F87171]/30 dark:bg-[#F87171]/5"
                      : "border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623]"
                  } ${n.url ? "hover:bg-slate-50 dark:hover:bg-[#1E293B]" : ""}`;

                  return (
                    <li key={n.id}>
                      {n.url ? (
                        <Link
                          href={n.url}
                          onClick={() => handleNotificationClick(n.id, pending)}
                          className={className}
                        >
                          {inner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(n.id, pending)}
                          className={`${className} w-full text-left`}
                        >
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="shrink-0 space-y-2 border-t border-slate-100 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:pb-4 dark:border-slate-700/60">
            <button
              type="button"
              disabled={validating || unreadCount === 0}
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
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} pendiente${unreadCount === 1 ? "" : "s"} de validar`
            : "Notificaciones"
        }
        title={unreadCount > 0 ? `${unreadCount} pendientes` : "Notificaciones"}
      >
        <Bell className={`h-5 w-5 ${heroMode ? "text-white" : "text-[var(--brand)]"}`} aria-hidden />
        {badge}
      </button>
      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
