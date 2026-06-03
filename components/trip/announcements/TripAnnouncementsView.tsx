"use client";

import { useCallback, useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { USER_NOTIFICATIONS_CHANGED_EVENT } from "@/components/notifications/UserNotificationsButton";

type Announcement = { id: string; title: string; body: string; created_at: string };

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function TripAnnouncementsView({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [organizerName, setOrganizerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const markRead = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}/announcements/read`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.unreadCount === "number") {
        window.dispatchEvent(
          new CustomEvent(USER_NOTIFICATIONS_CHANGED_EVENT, {
            detail: { unreadCount: data.unreadCount },
          })
        );
      }
    } catch {
      /* no bloquear la vista */
    }
  }, [tripId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}/announcements`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron cargar los avisos.");
      setItems(data.announcements ?? []);
      setOrganizerName(data.organizerName ?? null);
      void markRead();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar avisos.");
    } finally {
      setLoading(false);
    }
  }, [tripId, markRead]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pb-24 pt-4 md:px-0 md:pb-8">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-extrabold text-[var(--text-primary)]">
          <Megaphone className="h-6 w-6 text-[var(--brand)]" aria-hidden />
          Avisos del viaje
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Mensajes de {organizerName ?? "tu organizador"}. También los recibes en la campana de Mis viajes.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">Cargando avisos…</p>
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 text-center shadow-sm">
          <p className="text-sm text-[var(--text-secondary)]">
            Aún no hay avisos. Cuando el organizador publique uno, aparecerá aquí y te avisaremos en Mis viajes.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li
              key={a.id}
              className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-bold text-[var(--text-primary)]">{a.title}</h2>
                <time className="text-xs text-[var(--text-tertiary)]" dateTime={a.created_at}>
                  {formatWhen(a.created_at)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{a.body}</p>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                {organizerName ?? "Organizador"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
