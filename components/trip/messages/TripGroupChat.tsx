"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
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
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/trip-messages?tripId=${encodeURIComponent(tripId)}`, {
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || "No se pudieron cargar los mensajes.");
    setMessages(Array.isArray(json?.messages) ? json.messages : []);
  }, [tripId]);

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
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, { ...row, author_name: "Participante" }];
          });
          setTimeout(scrollToBottom, 80);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId, scrollToBottom]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/trip-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, body: text }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "No se pudo enviar.");
      const msg = json?.message as TripChatMessage | undefined;
      if (msg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, { ...msg, author_name: "Tú" }];
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

  return (
    <div className="flex min-h-[min(70vh,560px)] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-[#1E293B]">
        <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50">Chat del grupo</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Mensajes visibles para todos los participantes del viaje.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
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
