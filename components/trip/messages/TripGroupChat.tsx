"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { displayNameFromProfileRow } from "@/lib/trip-chat-profiles";
import UserAvatar from "@/components/profile/UserAvatar";

export type TripChatMessage = {
  id: string;
  trip_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author_name?: string;
  author_avatar_url?: string | null;
};

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function TripGroupChat({
  tripId,
  currentUserId,
}: {
  tripId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<TripChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableMissing, setTableMissing] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const profileCacheRef = useRef<Map<string, { name: string; avatar: string | null }>>(new Map());

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const resolveAuthor = useCallback(async (userId: string) => {
    const cached = profileCacheRef.current.get(userId);
    if (cached) return cached;

    const { data } = await supabase
      .from("profiles")
      .select("display_name, full_name, username, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    const name = displayNameFromProfileRow(
      data as { display_name?: string | null; full_name?: string | null; username?: string | null } | null
    );
    const avatar =
      data && typeof (data as { avatar_url?: string | null }).avatar_url === "string"
        ? (data as { avatar_url: string | null }).avatar_url
        : null;
    const profile = { name, avatar };
    profileCacheRef.current.set(userId, profile);
    return profile;
  }, []);

  const loadMessages = useCallback(
    async (opts?: { before?: string; prepend?: boolean }) => {
      setError(null);
      const params = new URLSearchParams({ tripId });
      if (opts?.before) params.set("before", opts.before);
      const res = await fetch(`/api/trip-messages?${params.toString()}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (res.status === 503 && json?.tableMissing) {
        setTableMissing(true);
        setMessages([]);
        setHasMore(false);
        throw new Error(json?.error || "Chat no disponible");
      }
      if (!res.ok) throw new Error(json?.error || "No se pudieron cargar los mensajes.");
      setTableMissing(false);
      const batch = Array.isArray(json?.messages) ? (json.messages as TripChatMessage[]) : [];
      for (const m of batch) {
        if (m.author_name) {
          profileCacheRef.current.set(m.user_id, {
            name: m.author_name,
            avatar: m.author_avatar_url ?? null,
          });
        }
      }
      setHasMore(Boolean(json?.hasMore));
      if (opts?.prepend) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const older = batch.filter((m) => !ids.has(m.id));
          return [...older, ...prev];
        });
      } else {
        setMessages(batch);
      }
    },
    [tripId]
  );

  useEffect(() => {
    void loadMessages()
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [loadMessages]);

  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [loading, messages.length, scrollToBottom]);

  useEffect(() => {
    const channel = supabase
      .channel(`trip-messages:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trip_messages",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const row = payload.new as TripChatMessage;
          if (!row?.id) return;
          void (async () => {
            const profile = await resolveAuthor(row.user_id);
            setMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev;
              return [
                ...prev,
                {
                  ...row,
                  author_name: profile.name,
                  author_avatar_url: profile.avatar,
                },
              ];
            });
            setTimeout(scrollToBottom, 80);
          })();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId, scrollToBottom, resolveAuthor]);

  async function loadOlder() {
    const first = messages[0];
    if (!first || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await loadMessages({ before: first.created_at, prepend: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar más");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || tableMissing) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/trip-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, body: text }),
      });
      const json = await res.json().catch(() => null);
      if (res.status === 503 && json?.tableMissing) {
        setTableMissing(true);
        throw new Error(json?.error || "Chat no disponible");
      }
      if (!res.ok) throw new Error(json?.error || "No se pudo enviar.");
      const msg = json?.message as TripChatMessage | undefined;
      if (msg) {
        profileCacheRef.current.set(msg.user_id, {
          name: msg.author_name || "Tú",
          avatar: msg.author_avatar_url ?? null,
        });
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [
            ...prev,
            {
              ...msg,
              author_name: msg.user_id === currentUserId ? "Tú" : msg.author_name || "Participante",
            },
          ];
        });
      } else {
        await loadMessages();
      }
      setDraft("");
      scrollToBottom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setSending(false);
    }
  }

  if (tableMissing) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-extrabold">Chat del grupo no activado</p>
        <p className="mt-2 text-amber-800 dark:text-amber-200">
          Ejecuta el script{" "}
          <code className="rounded bg-white/60 px-1 py-0.5 text-xs dark:bg-black/30">docs/kaviro_trip_messages.sql</code>{" "}
          en el SQL Editor de Supabase para crear la tabla de mensajes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[min(70vh,560px)] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-[#1E293B]">
        <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50">Chat del grupo</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Mensajes visibles para todos los participantes del viaje.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {hasMore ? (
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => void loadOlder()}
            className="mx-auto block rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-[#334155] dark:bg-[#080C14] dark:text-slate-300"
          >
            {loadingMore ? "Cargando…" : "Cargar mensajes anteriores"}
          </button>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500 animate-pulse">Cargando mensajes…</p>
        ) : error && !messages.length ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : messages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 dark:border-[#334155] dark:bg-[#080C14] dark:text-slate-400">
            Aún no hay mensajes. Escribe el primero para coordinar con el grupo sin salir de Kaviro.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === currentUserId;
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                <UserAvatar displayName={m.author_name || "?"} size="sm" className="shrink-0" />
                <div className={`max-w-[85%] ${mine ? "items-end" : ""}`}>
                  <p className={`text-[11px] font-semibold text-slate-500 ${mine ? "text-right" : ""}`}>
                    {mine ? "Tú" : m.author_name}
                    <span className="ml-2 font-normal text-slate-400">{formatTime(m.created_at)}</span>
                  </p>
                  <div
                    className={`mt-0.5 rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      mine
                        ? "bg-[var(--brand)] text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-900 dark:border-[#334155] dark:bg-[#080C14] dark:text-slate-100"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && messages.length > 0 ? (
        <p className="px-4 text-xs font-semibold text-red-600">{error}</p>
      ) : null}

      <form onSubmit={handleSend} className="border-t border-slate-100 p-3 dark:border-[#1E293B]">
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escribe un mensaje…"
            maxLength={4000}
            disabled={sending}
            className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none ring-[var(--brand)] focus:border-[var(--brand)] focus:ring-2 dark:border-[#334155] dark:bg-[#080C14] dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-[var(--brand)] text-white transition hover:bg-[var(--brand-hover)] disabled:opacity-50"
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
