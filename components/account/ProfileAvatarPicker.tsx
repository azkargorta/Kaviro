"use client";

import { useEffect, useState } from "react";
import {
  PROFILE_AVATAR_EMOJIS,
  PROFILE_AVATAR_ILLUSTRATIONS,
  normalizeProfileAvatar,
  resolveIllustration,
  type ProfileAvatarKind,
  type ProfileIllustrationId,
} from "@/lib/profile-avatar";
import UserAvatar from "@/components/profile/UserAvatar";

export default function ProfileAvatarPicker() {
  const [kind, setKind] = useState<ProfileAvatarKind>("emoji");
  const [emoji, setEmoji] = useState<string>(PROFILE_AVATAR_EMOJIS[0]);
  const [illustration, setIllustration] = useState<ProfileIllustrationId>(
    PROFILE_AVATAR_ILLUSTRATIONS[0]!.id
  );
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/account/profile-avatar", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.avatar) {
          const n = normalizeProfileAvatar(d.avatar);
          setKind(n.avatar_kind);
          if (n.avatar_emoji) setEmoji(n.avatar_emoji);
          if (n.avatar_illustration) setIllustration(resolveIllustration(n.avatar_illustration).id);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/account/profile-avatar", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar_kind: kind,
          avatar_emoji: emoji,
          avatar_illustration: illustration,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Error al guardar");
      setStatus("Avatar guardado.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  const previewName = "Tú";

  return (
    <section className="card-soft space-y-4 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Personalización</p>
        <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">Tu avatar de viajero</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Elige un emoji o una ilustración. Se verá en participantes, invitaciones y tu perfil en el grupo.
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <UserAvatar
          displayName={previewName}
          avatarKind={kind}
          avatarEmoji={emoji}
          avatarIllustration={illustration}
          size="lg"
          ringClassName="ring-2 ring-[#F87171]/30"
        />
        <p className="text-sm text-slate-600 dark:text-slate-300">Vista previa</p>
      </div>

      <div className="flex gap-2">
        {(["emoji", "illustration"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              kind === k
                ? "bg-[#F87171] text-white"
                : "border border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            {k === "emoji" ? "Emoji" : "Ilustración"}
          </button>
        ))}
      </div>

      {kind === "emoji" ? (
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {PROFILE_AVATAR_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition ${
                emoji === e
                  ? "bg-[#F87171]/15 ring-2 ring-[#F87171]"
                  : "bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-600"
              }`}
              aria-label={`Emoji ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROFILE_AVATAR_ILLUSTRATIONS.map((ill) => (
            <button
              key={ill.id}
              type="button"
              onClick={() => setIllustration(ill.id)}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                illustration === ill.id
                  ? "border-[#F87171] bg-[#F87171]/5 ring-1 ring-[#F87171]/40"
                  : "border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${ill.gradient} text-lg`}
              >
                {ill.glyph}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{ill.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !loaded}
          className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#F87171] px-5 text-sm font-bold text-white transition hover:bg-[#EF4444] disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar avatar"}
        </button>
        {status ? <p className="text-sm text-slate-600 dark:text-slate-400">{status}</p> : null}
      </div>
    </section>
  );
}
