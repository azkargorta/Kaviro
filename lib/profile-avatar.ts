/** Avatar de perfil: emoji, ilustración (gradiente) o DiceBear con seed elegido. */

export type ProfileAvatarKind = "emoji" | "illustration" | "dicebear";

// ── Emojis de viaje ────────────────────────────────────────────────────────
export const PROFILE_AVATAR_EMOJIS = [
  "😎", "🧳", "✈️", "🌍", "🏔️", "🌴", "🚐", "🎒",
  "🦊", "🐧", "🌊", "☀️", "🌙", "⭐", "🎯", "🔥",
  "🎨", "📸", "🗺️", "⛵", "🚂", "🛳️", "🏕️", "🎪",
] as const;

// ── Ilustraciones con gradiente ────────────────────────────────────────────
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

// ── DiceBear ────────────────────────────────────────────────────────────────
export type DiceBearStyle =
  | "adventurer" | "fun-emoji" | "notionists"
  | "lorelei"    | "personas"  | "open-peeps"
  | "micah"      | "croodles"  | "pixel-art" | "bottts";

/** Estilos agrupados por categoría, con label descriptivo */
export const DICEBEAR_STYLES: Array<{
  id: DiceBearStyle;
  label: string;
  category: "personas" | "emojis" | "animales";
}> = [
  { id: "adventurer", label: "Aventurero",  category: "personas" },
  { id: "lorelei",    label: "Lorelei",     category: "personas" },
  { id: "personas",   label: "Personas",    category: "personas" },
  { id: "open-peeps", label: "Open Peeps",  category: "personas" },
  { id: "micah",      label: "Micah",       category: "personas" },
  { id: "fun-emoji",  label: "Fun Emoji",   category: "emojis"   },
  { id: "croodles",   label: "Croodles",    category: "emojis"   },
  { id: "notionists", label: "Notionists",  category: "animales" },
  { id: "pixel-art",  label: "Pixel Art",   category: "animales" },
  { id: "bottts",     label: "Robots",      category: "animales" },
];

/**
 * 24 seeds con nombres evocadores — cada uno produce un avatar visualmente
 * distinto en todos los estilos de DiceBear.
 * Se muestran en la rejilla para que el usuario elija el que más le gusta.
 */
export const DICEBEAR_SEEDS = [
  "fox",    "bear",   "wolf",   "owl",
  "tiger",  "panda",  "eagle",  "lion",
  "cat",    "dog",    "rabbit", "deer",
  "luna",   "sol",    "nova",   "sky",
  "ember",  "frost",  "zara",   "miko",
  "leo",    "aria",   "finn",   "jade",
] as const;

export type DiceBearSeed = (typeof DICEBEAR_SEEDS)[number];

/** Genera la URL de DiceBear */
export function dicebearUrl(
  style: DiceBearStyle,
  seed: string,
  size = 80
): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
}

// ── Tipos compartidos ──────────────────────────────────────────────────────
export type ProfileAvatarFields = {
  avatar_kind?: string | null;
  avatar_emoji?: string | null;
  /** Para illustration: slug del gradiente. Para dicebear: "estilo:seed" (e.g. "fun-emoji:fox") */
  avatar_illustration?: string | null;
};

/** Parsea "fun-emoji:fox" → { style, seed } */
export function parseDicebearValue(value: string | null | undefined): {
  style: DiceBearStyle;
  seed: string;
} {
  const [stylePart, seedPart] = (value ?? "").split(":");
  const style =
    DICEBEAR_STYLES.find((s) => s.id === stylePart)?.id ?? "fun-emoji";
  const seed = seedPart || "fox";
  return { style, seed };
}

/** Serializa estilo + seed para guardar en BD */
export function serializeDicebear(style: DiceBearStyle, seed: string): string {
  return `${style}:${seed}`;
}

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
    const { style, seed } = parseDicebearValue(input.avatar_illustration);
    return {
      avatar_kind: "dicebear",
      avatar_emoji: null,
      avatar_illustration: serializeDicebear(style, seed),
    };
  }

  if (kind === "illustration") {
    const illRaw = (input.avatar_illustration ?? "").trim();
    const illustration = PROFILE_AVATAR_ILLUSTRATIONS.some((i) => i.id === illRaw)
      ? (illRaw as ProfileIllustrationId)
      : "explorer";
    return { avatar_kind: "illustration", avatar_emoji: null, avatar_illustration: illustration };
  }

  const emojiRaw = (input.avatar_emoji ?? "").trim();
  const emoji = PROFILE_AVATAR_EMOJIS.includes(
    emojiRaw as (typeof PROFILE_AVATAR_EMOJIS)[number]
  )
    ? emojiRaw
    : PROFILE_AVATAR_EMOJIS[0]!;
  return { avatar_kind: "emoji", avatar_emoji: emoji, avatar_illustration: null };
}

export function resolveIllustration(id: string | null | undefined) {
  return (
    PROFILE_AVATAR_ILLUSTRATIONS.find((i) => i.id === id) ??
    PROFILE_AVATAR_ILLUSTRATIONS[0]!
  );
}
