"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Send, Loader2, X, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Reaction = {
  id: string;
  user_id: string;
  display_name: string;
  reaction: "join" | "skip" | "maybe";
  comment: string | null;
};

const REACTIONS = [
  { key: "join"  as const, label: "Sí, me apunto", icon: "✅", color: "bg-emerald-50 border-emerald-300 text-emerald-800" },
  { key: "skip"  as const, label: "No puedo",      icon: "❌", color: "bg-red-50 border-red-300 text-red-700"           },
  { key: "maybe" as const, label: "Quizás",         icon: "🤔", color: "bg-amber-50 border-amber-300 text-amber-800"     },
];

export function ActivityReactions({
  tripId,
  activityId,
  currentUserId,
  displayName,
}: {
  tripId: string;
  activityId: string;
  currentUserId: string | null;
  displayName: string;
}) {
  const [open, setOpen]                   = useState(false);
  const [reactions, setReactions]         = useState<Reaction[]>([]);
  const [loading, setLoading]             = useState(false);
  const [saving, setSaving]               = useState(false);
  const [comment, setComment]             = useState("");
  const [tableReady, setTableReady]       = useState<boolean | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(currentUserId);
  const [resolvedName, setResolvedName]   = useState(displayName);

  // Si el padre no pasó el userId, lo obtenemos aquí directamente
  useEffect(() => {
    if (currentUserId) {
      setResolvedUserId(currentUserId);
      setResolvedName(displayName);
      return;
    }
    const supabase = createClient();
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setResolvedUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.display_name) setResolvedName(String(profile.display_name));
    })();
  }, [currentUserId, displayName]);

  const myReaction = reactions.find((r) => r.user_id === resolvedUserId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/trip-activity-reactions?tripId=${encodeURIComponent(tripId)}&activityId=${encodeURIComponent(activityId)}`);
      const data = await res.json();
      setReactions(Array.isArray(data.reactions) ? data.reactions : []);
      setTableReady(data.tableReady !== false);
    } finally {
      setLoading(false);
    }
  }, [tripId, activityId]);

  useEffect(() => { if (open) void load(); }, [open, load]);

  async function vote(reaction: "join" | "skip" | "maybe") {
    if (!resolvedUserId) return;
    setSaving(true);
    try {
      await fetch("/api/trip-activity-reactions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tripId, activityId, reaction, comment: comment.trim() || null, displayName: resolvedName }),
      });
      await load();
      setComment("");
    } finally {
      setSaving(false);
    }
  }

  async function removeVote() {
    if (!resolvedUserId) return;
    setSaving(true);
    try {
      await fetch(`/api/trip-activity-reactions?tripId=${encodeURIComponent(tripId)}&activityId=${encodeURIComponent(activityId)}`, { method: "DELETE" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  const counts = { join: 0, skip: 0, maybe: 0 };
  for (const r of reactions) counts[r.reaction] = (counts[r.reaction] || 0) + 1;
  const total = reactions.length;

  return (
    <div>
      {/* ── Toggle pill ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
          open
            ? "border-[var(--brand-border)] bg-[var(--brand-light)] text-[var(--brand-text)]"
            : total > 0
              ? "border-slate-200 bg-slate-50 text-slate-700 hover:border-[var(--brand-border)] hover:bg-[var(--brand-light)] hover:text-[var(--brand-text)]"
              : "border-[var(--brand-border)] bg-[var(--brand-light)] text-[var(--brand-text)] hover:opacity-80"
        }`}
      >
        <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {total > 0 ? (
          <span className="flex items-center gap-1.5">
            {counts.join  > 0 && <span>✅ {counts.join}</span>}
            {counts.maybe > 0 && <span>🤔 {counts.maybe}</span>}
            {counts.skip  > 0 && <span>❌ {counts.skip}</span>}
          </span>
        ) : (
          <span>¿Te apuntas?</span>
        )}
        {open ? <ChevronUp className="h-3 w-3 shrink-0" aria-hidden /> : <ChevronDown className="h-3 w-3 shrink-0" aria-hidden />}
      </button>

      {/* ── Panel desplegable ── */}
      {open && (
        <div className="mt-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          {tableReady === false && (
            <p className="text-xs text-amber-600 font-semibold">
              ⚠️ Crea la tabla <code>trip_activity_reactions</code> en Supabase para activar esta función.
            </p>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Cargando…
            </div>
          ) : (
            <>
              {/* Botones de voto */}
              {resolvedUserId ? (
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-slate-500">Tu respuesta</p>
                  <div className="flex flex-wrap gap-2">
                    {REACTIONS.map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        disabled={saving}
                        onClick={() => (myReaction?.reaction === r.key ? removeVote() : vote(r.key))}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                          myReaction?.reaction === r.key
                            ? `${r.color} ring-2 ring-offset-1 ring-current shadow-sm`
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {r.icon} {r.label}
                        {myReaction?.reaction === r.key && <X className="h-3 w-3 ml-0.5 shrink-0" />}
                      </button>
                    ))}
                  </div>

                  {/* Comentario */}
                  <div className="flex gap-2">
                    <input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && myReaction) {
                          e.preventDefault();
                          void vote(myReaction.reaction);
                        }
                      }}
                      placeholder="Añade un comentario (opcional)"
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none transition focus:border-[var(--brand)] focus-visible:ring-2 focus-visible:ring-[var(--brand-border)]"
                    />
                    {myReaction && (
                      <button
                        type="button"
                        disabled={saving || !comment.trim()}
                        onClick={() => void vote(myReaction.reaction)}
                        className="rounded-xl bg-[var(--brand)] px-3 py-1.5 text-white disabled:opacity-40 transition hover:bg-[var(--brand-hover)]"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Inicia sesión para responder.</p>
              )}

              {/* Lista de respuestas */}
              {reactions.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400">Respuestas del grupo</p>
                  {reactions.map((r) => {
                    const meta = REACTIONS.find((x) => x.key === r.reaction)!;
                    return (
                      <div key={r.id} className="flex items-start gap-2 text-xs">
                        <span className="shrink-0 mt-0.5">{meta.icon}</span>
                        <span className="font-semibold text-slate-700">{r.display_name}</span>
                        {r.comment && <span className="text-slate-400">— {r.comment}</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {reactions.length === 0 && !loading && (
                <p className="text-xs text-slate-400">Nadie ha respondido aún. Sé el primero.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
