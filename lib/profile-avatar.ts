/** Avatar de perfil: emoji, ilustración (gradiente) o DiceBear (personas/animales). */

export type ProfileAvatarKind = "emoji" | "illustration" | "dicebear";

// ── Emojis ─────────────────────────────────────────────────────────────────
export const PROFILE_AVATAR_EMOJIS = [
  "😎", "🧳", "✈️", "🌍", "🏔️", "🌴", "🚐", "🎒",
  "🦊", "🐧", "🌊", "☀️", "🌙", "⭐", "🎯", "🔥",
  "🎨", "📸", "🗺️", "⛵", "🚂", "🛳️", "🏕️", "🎪",
] as const;

// ── Ilustraciones con gradiente (las existentes) ───────────────────────────
export type ProfileIllustrationId =
  | "explorer" | "sunset" | "mountain" | "wave" | "city" | "camper";

export const PROFILE_AVATAR_ILLUSTRATIONS: Array<{
  id: ProfileIllustrationId;
  label: string;
  glyph: string;
  gradient: string;
}> = [
  { id: "explorer", label: "Explorador", glyph: "🧭", gradient: "from-amber-400 to-orange-500" },
  { id: "sunset",   label: "Atardecer",  glyph: "🌅", gradient: "from-rose-400 to-orange-500" },
  { id: "mountain", label: "Montaña",    glyph: "⛰️", gradient: "from-sky-400 to-indigo-500" },
  { id: "wave",     label: "Playa",      glyph: "🏄", gradient: "from-cyan-400 to-blue-500" },
  { id: "city",     label: "Ciudad",     glyph: "🏙️", gradient: "from-violet-400 to-fuchsia-500" },
  { id: "camper",   label: "Ruta",       glyph: "🚐", gradient: "from-emerald-400 to-teal-500" },
];

// ── DiceBear ───────────────────────────────────────────────────────────────
// Estilos disponibles: people, emoji style, animals/fun
export type DiceBearStyle =
  | "adventurer"
  | "fun-emoji"
  | "notionists"
  | "lorelei"
  | "personas"
  | "open-peeps"
  | "micah"
  | "croodles"
  | "pixel-art"
  | "bottts";

export const DICEBEAR_STYLES: Array<{
  id: DiceBearStyle;
  label: string;
  category: "personas" | "emojis" | "animales";
}> = [
  // Personas
  { id: "adventurer", label: "Aventurero",  category: "personas" },
  { id: "lorelei",    label: "Lorelei",     category: "personas" },
  { id: "personas",   label: "Personas",    category: "personas" },
  { id: "open-peeps", label: "Open Peeps",  category: "personas" },
  { id: "micah",      label: "Micah",       category: "personas" },
  // Emojis y doodles
  { id: "fun-emoji",  label: "Fun Emoji",   category: "emojis" },
  { id: "croodles",   label: "Croodles",    category: "emojis" },
  // Animales y robots
  { id: "notionists", label: "Notionists",  category: "animales" },
  { id: "pixel-art",  label: "Pixel Art",   category: "animales" },
  { id: "bottts",     label: "Robots",      category: "animales" },
];

// Seeds de ejemplo para mostrar en el picker (6 previews por estilo)
export const DICEBEAR_PREVIEW_SEEDS = [
  "kaviro1", "kaviro2", "kaviro3", "kaviro4", "kaviro5", "kaviro6",
];

/**
 * Genera la URL de DiceBear para un avatar.
 * El seed es el user.id o cualquier string único — siempre da el mismo avatar.
 */
export function dicebearUrl(style: DiceBearStyle, seed: string, size = 80): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
}

// ── Tipos compartidos ──────────────────────────────────────────────────────
export type ProfileAvatarFields = {
  avatar_kind?: string | null;
  avatar_emoji?: string | null;
  avatar_illustration?: string | null;
};

/**
 * Normaliza los campos del avatar antes de guardarlos.
 * Para DiceBear: avatar_kind = "dicebear", avatar_illustration = estilo (e.g. "fun-emoji")
 */
export function normalizeProfileAvatar(input: ProfileAvatarFields): {
  avatar_kind: ProfileAvatarKind;
  avatar_emoji: string | null;
  avatar_illustration: string | null;
} {
  const rawKind = input.avatar_kind ?? "emoji";
  const kind: ProfileAvatarKind =
    rawKind === "illustration" ? "illustration"
    : rawKind === "dicebear"   ? "dicebear"
    : "emoji";

  if (kind === "dicebear") {
    const style = DICEBEAR_STYLES.find((s) => s.id === input.avatar_illustration)?.id
      ?? "fun-emoji";
    return { avatar_kind: "dicebear", avatar_emoji: null, avatar_illustration: style };
  }

  if (kind === "illustration") {
    const illRaw = typeof input.avatar_illustration === "string" ? input.avatar_illustration.trim() : "";
    const illustration = PROFILE_AVATAR_ILLUSTRATIONS.some((i) => i.id === illRaw)
      ? (illRaw as ProfileIllustrationId) : "explorer";
    return { avatar_kind: "illustration", avatar_emoji: null, avatar_illustration: illustration };
  }

  const emojiRaw = typeof input.avatar_emoji === "string" ? input.avatar_emoji.trim() : "";
  const emoji = PROFILE_AVATAR_EMOJIS.includes(emojiRaw as (typeof PROFILE_AVATAR_EMOJIS)[number])
    ? emojiRaw : PROFILE_AVATAR_EMOJIS[0]!;
  return { avatar_kind: "emoji", avatar_emoji: emoji, avatar_illustration: null };
}

export function resolveIllustration(id: string | null | undefined) {
  return PROFILE_AVATAR_ILLUSTRATIONS.find((i) => i.id === id) ?? PROFILE_AVATAR_ILLUSTRATIONS[0]!;
}
