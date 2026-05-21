"use client";

import { useEffect, useState } from "react";
import {
  PROFILE_AVATAR_EMOJIS,
  PROFILE_AVATAR_ILLUSTRATIONS,
  DICEBEAR_STYLES,
  DICEBEAR_SEEDS,
  normalizeProfileAvatar,
  resolveIllustration,
  parseDicebearValue,
  serializeDicebear,
  dicebearUrl,
  type ProfileAvatarKind,
  type ProfileIllustrationId,
  type DiceBearStyle,
  type DiceBearSeed,
} from "@/lib/profile-avatar";
import UserAvatar from "@/components/profile/UserAvatar";

type Tab = ProfileAvatarKind;

const CATEGORY_LABELS = {
  personas: "Personas",
  emojis: "Emojis y doodles",
  animales: "Animales y robots",
};

export default function ProfileAvatarPicker() {
  const [tab, setTab] = useState<Tab>("dicebear");

  // Emoji state
  const [emoji, setEmoji] = useState<string>(PROFILE_AVATAR_EMOJIS[0]!);

  // Gradient state
  const [illustration, setIllustration] = useState<ProfileIllustrationId>(
    PROFILE_AVATAR_ILLUSTRATIONS[0]!.id
  );

  // DiceBear state — style + seed chosen independently
  const [dicebearStyle, setDicebearStyle] = useState<DiceBearStyle>("fun-emoji");
  const [dicebearSeed, setDicebearSeed]   = useState<string>("fox");

  const [status, setStatus]   = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const [loaded, setLoaded]   = useState(false);

  // Load current avatar on mount
  useEffect(() => {
    fetch("/api/account/profile-avatar", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.avatar) return;
        const n = normalizeProfileAvatar(d.avatar);
        setTab(n.avatar_kind);
        if (n.avatar_kind === "dicebear" && n.avatar_illustration) {
          const { style, seed } = parseDicebearValue(n.avatar_illustration);
          setDicebearStyle(style);
          setDicebearSeed(seed);
        } else if (n.avatar_kind === "illustration" && n.avatar_illustration) {
          setIllustration(n.avatar_illustration as ProfileIllustrationId);
        } else if (n.avatar_kind === "emoji" && n.avatar_emoji) {
          setEmoji(n.avatar_emoji);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const body =
        tab === "dicebear"
          ? {
              avatar_kind: "dicebear",
              avatar_emoji: null,
              avatar_illustration: serializeDicebear(dicebearStyle, dicebearSeed),
            }
          : tab === "illustration"
          ? { avatar_kind: "illustration", avatar_emoji: null, avatar_illustration: illustration }
          : { avatar_kind: "emoji", avatar_emoji: emoji, avatar_illustration: null };

      const res = await fetch("/api/account/profile-avatar", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  // Preview illustration value
  const previewIllustration =
    tab === "dicebear"
      ? serializeDicebear(dicebearStyle, dicebearSeed)
      : illustration;

  // Group styles by category
  const byCategory = DICEBEAR_STYLES.reduce<Record<string, typeof DICEBEAR_STYLES>>(
    (acc, s) => { (acc[s.category] ||= []).push(s); return acc; },
    {}
  );

  return (
    <section className="card-soft space-y-5 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Personalización
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
          Tu avatar de viajero
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Primero elige un estilo, luego el personaje concreto que más te guste.
        </p>
      </div>

      {/* ── Preview ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <UserAvatar
          displayName="Tú"
          avatarKind={tab}
          avatarEmoji={tab === "emoji" ? emoji : null}
          avatarIllustration={tab === "emoji" ? null : previewIllustration}
          size="lg"
          ringClassName="ring-2 ring-[#F87171]/30"
        />
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Vista previa</p>
          {tab === "dicebear" && (
            <p className="text-xs text-slate-400">
              {DICEBEAR_STYLES.find(s => s.id === dicebearStyle)?.label} · {dicebearSeed}
            </p>
          )}
        </div>
      </div>

      {/* ── Tab selector ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: "dicebear",     label: "✨ Ilustraciones" },
          { id: "emoji",        label: "😎 Emojis" },
          { id: "illustration", label: "🎨 Gradientes" },
        ] as const).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              tab === t.id
                ? "bg-[#F87171] text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DiceBear panel ───────────────────────────────────────────────── */}
      {tab === "dicebear" && (
        <div className="space-y-6">

          {/* Step 1: choose style */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              1 · Elige un estilo
            </p>
            {(Object.entries(byCategory) as [string, typeof DICEBEAR_STYLES][]).map(([cat, styles]) => (
              <div key={cat} className="mb-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {styles.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setDicebearStyle(st.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        dicebearStyle === st.id
                          ? "border-[#F87171] bg-[#F87171]/10 text-[#F87171]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      }`}
                    >
                      {/* Single preview of this style */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dicebearUrl(st.id, dicebearSeed, 48)}
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full"
                        loading="lazy"
                      />
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Step 2: choose character */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              2 · Elige tu personaje
            </p>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {DICEBEAR_SEEDS.map((seed) => (
                <button
                  key={seed}
                  type="button"
                  onClick={() => setDicebearSeed(seed)}
                  title={seed}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 transition ${
                    dicebearSeed === seed
                      ? "border-[#F87171] bg-[#F87171]/10 ring-2 ring-[#F87171]/40"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dicebearUrl(dicebearStyle, seed, 80)}
                    alt={seed}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full"
                    loading="lazy"
                  />
                  <span className="text-[9px] text-slate-400 truncate w-full text-center">
                    {seed}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Emoji panel ──────────────────────────────────────────────────── */}
      {tab === "emoji" && (
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {PROFILE_AVATAR_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition ${
                emoji === e
                  ? "bg-[#F87171]/15 ring-2 ring-[#F87171]"
                  : "border border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-600"
              }`}
              aria-label={`Emoji ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* ── Gradient panel ───────────────────────────────────────────────── */}
      {tab === "illustration" && (
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
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {ill.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Save ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !loaded}
          className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#F87171] px-5 text-sm font-bold text-white transition hover:bg-[#EF4444] disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar avatar"}
        </button>
        {status && (
          <p className="text-sm text-slate-600 dark:text-slate-400">{status}</p>
        )}
      </div>
    </section>
  );
}
