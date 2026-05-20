"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Users } from "lucide-react";

type Reaction = {
  id: string;
  user_id: string;
  display_name: string;
  reaction: "join" | "skip" | "maybe";
  comment: string | null;
};

const REACTION_META = {
  join:  { label: "Sí",     icon: "✅" },
  skip:  { label: "No",     icon: "❌" },
  maybe: { label: "Quizás", icon: "🤔" },
} as const;

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
  const [open, setOpen] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tableReady, setTableReady] = useState<boolean | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(currentUserId);
  const [resolvedName, setResolvedName] = useState(displayName);
  const [voteError, setVoteError] = useState<string | null>(null);

  useEffect(() => {
    setResolvedUserId(currentUserId);
    setResolvedName(displayName);
  }, [currentUserId, displayName]);

  // Respaldo por si el padre no pasó userId (cookies vía API)
  useEffect(() => {
    if (currentUserId) return;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (data?.userId) setResolvedUserId(String(data.userId));
      } catch {
        // ignore
      }
    })();
  }, [currentUserId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/trip-activity-reactions?tripId=${encodeURIComponent(tripId)}&activityId=${encodeURIComponent(activityId)}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setReactions(Array.isArray(data.reactions) ? data.reactions : []);
      setTableReady(data.tableReady !== false);
    } finally {
      setLoading(false);
    }
  }, [tripId, activityId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const myReaction = reactions.find((r) => r.user_id === resolvedUserId);

  async function vote(reaction: "join" | "skip" | "maybe") {
    setSaving(true);
    setVoteError(null);
    try {
      const res = await fetch("/api/trip-activity-reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tripId,
          activityId,
          reaction,
          comment: null,
          displayName: resolvedName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVoteError(typeof data?.error === "string" ? data.error : "No se pudo guardar tu respuesta.");
        return;
      }
      await load();
    } catch {
      setVoteError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectChange(value: string) {
    if (!value) {
      if (myReaction) {
        setSaving(true);
        setVoteError(null);
        try {
          await fetch(
            `/api/trip-activity-reactions?tripId=${encodeURIComponent(tripId)}&activityId=${encodeURIComponent(activityId)}`,
            { method: "DELETE", credentials: "include" }
          );
          await load();
        } catch {
          setVoteError("No se pudo quitar tu respuesta.");
        } finally {
          setSaving(false);
        }
      }
      return;
    }
    if (value === "join" || value === "skip" || value === "maybe") {
      await vote(value);
    }
  }

  const counts = { join: 0, skip: 0, maybe: 0 };
  for (const r of reactions) counts[r.reaction] = (counts[r.reaction] || 0) + 1;
  const total = reactions.length;
  const joiners = reactions.filter((r) => r.reaction === "join");

  return (
    <div>
      {/* Cabecera clicable */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
          open
            ? "border-[var(--brand-border)] bg-[var(--brand-light)] text-[var(--brand-text)]"
            : "border-[var(--brand-border)] bg-[var(--brand-light)] text-[var(--brand-text)] hover:opacity-90"
        }`}
      >
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0" aria-hidden />
          <span>¿Te apuntas?</span>
          {total > 0 && (
            <span className="flex items-center gap-1.5 font-semibold text-slate-600">
              {counts.join > 0 && <span>✅ {counts.join}</span>}
              {counts.maybe > 0 && <span>🤔 {counts.maybe}</span>}
              {counts.skip > 0 && <span>❌ {counts.skip}</span>}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        )}
      </button>

      {/* Resumen compacto (cerrado): quién va */}
      {!open && joiners.length > 0 && (
        <p className="mt-1.5 text-xs text-slate-600">
          <span className="font-semibold text-emerald-700">Van: </span>
          {joiners.map((r) => r.display_name).join(", ")}
        </p>
      )}

      {open && (
        <div className="mt-2.5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
          {tableReady === false && (
            <p className="text-xs font-semibold text-amber-700">
              ⚠️ Crea la tabla <code>trip_activity_reactions</code> en Supabase para activar esta función.
            </p>
          )}

          {loading && reactions.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Cargando…
            </div>
          ) : (
            <>
              {/* Desplegable Sí / No / Quizás */}
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <label
                  htmlFor={`rsvp-${activityId}`}
                  className="shrink-0 text-xs font-bold text-slate-700"
                >
                  Tu respuesta
                </label>
                <select
                  id={`rsvp-${activityId}`}
                  disabled={saving || tableReady === false}
                  value={myReaction?.reaction ?? ""}
                  onChange={(e) => void handleSelectChange(e.target.value)}
                  className="min-h-[40px] flex-1 cursor-pointer rounded-xl border-2 border-[var(--brand-border)] bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-border)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">— Elige una opción —</option>
                  <option value="join">✅ Sí, me apunto</option>
                  <option value="skip">❌ No puedo</option>
                  <option value="maybe">🤔 Quizás</option>
                </select>
                {saving && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" aria-hidden />}
              </div>

              {voteError && (
                <p className="text-xs font-semibold text-rose-600">{voteError}</p>
              )}

              {/* Quién va al plan */}
              {reactions.length > 0 ? (
                <div className="space-y-2 border-t border-slate-200 pt-2.5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Quién va
                  </p>
                  <ul className="space-y-1">
                    {reactions.map((r) => {
                      const meta = REACTION_META[r.reaction];
                      return (
                        <li key={r.id} className="flex items-center gap-2 text-xs text-slate-700">
                          <span aria-hidden>{meta.icon}</span>
                          <span className="font-semibold">{r.display_name}</span>
                          <span className="text-slate-400">· {meta.label}</span>
                          {r.comment ? (
                            <span className="truncate text-slate-400">— {r.comment}</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Nadie ha respondido aún. Sé el primero.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
