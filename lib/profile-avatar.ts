/** Avatar de perfil: emoji o “ilustración” (gradiente + icono). */

export type ProfileAvatarKind = "emoji" | "illustration";

export const PROFILE_AVATAR_EMOJIS = [
  "😎", "🧳", "✈️", "🌍", "🏔️", "🌴", "🚐", "🎒",
  "🦊", "🐧", "🌊", "☀️", "🌙", "⭐", "🎯", "🔥",
  "🎨", "📸", "🗺️", "⛵", "🚂", "🛳️", "🏕️", "🎪",
] as const;

export type ProfileIllustrationId =
  | "explorer"
  | "sunset"
  | "mountain"
  | "wave"
  | "city"
  | "camper";

export const PROFILE_AVATAR_ILLUSTRATIONS: Array<{
  id: ProfileIllustrationId;
  label: string;
  glyph: string;
  gradient: string;
}> = [
  { id: "explorer", label: "Explorador", glyph: "🧭", gradient: "from-amber-400 to-orange-500" },
  { id: "sunset", label: "Atardecer", glyph: "🌅", gradient: "from-rose-400 to-orange-500" },
  { id: "mountain", label: "Montaña", glyph: "⛰️", gradient: "from-sky-400 to-indigo-500" },
  { id: "wave", label: "Playa", glyph: "🏄", gradient: "from-cyan-400 to-blue-500" },
  { id: "city", label: "Ciudad", glyph: "🏙️", gradient: "from-violet-400 to-fuchsia-500" },
  { id: "camper", label: "Ruta", glyph: "🚐", gradient: "from-emerald-400 to-teal-500" },
];

export type ProfileAvatarFields = {
  avatar_kind?: string | null;
  avatar_emoji?: string | null;
  avatar_illustration?: string | null;
};

export function normalizeProfileAvatar(input: ProfileAvatarFields): {
  avatar_kind: ProfileAvatarKind;
  avatar_emoji: string | null;
  avatar_illustration: string | null;
} {
  const kind: ProfileAvatarKind =
    input.avatar_kind === "illustration" ? "illustration" : "emoji";
  const emojiRaw = typeof input.avatar_emoji === "string" ? input.avatar_emoji.trim() : "";
  const emoji = PROFILE_AVATAR_EMOJIS.includes(emojiRaw as (typeof PROFILE_AVATAR_EMOJIS)[number])
    ? emojiRaw
    : PROFILE_AVATAR_EMOJIS[0];
  const illRaw = typeof input.avatar_illustration === "string" ? input.avatar_illustration.trim() : "";
  const illustration = PROFILE_AVATAR_ILLUSTRATIONS.some((i) => i.id === illRaw)
    ? (illRaw as ProfileIllustrationId)
    : "explorer";

  if (kind === "illustration") {
    return { avatar_kind: "illustration", avatar_emoji: null, avatar_illustration: illustration };
  }
  return { avatar_kind: "emoji", avatar_emoji: emoji, avatar_illustration: null };
}

export function resolveIllustration(id: string | null | undefined) {
  return PROFILE_AVATAR_ILLUSTRATIONS.find((i) => i.id === id) ?? PROFILE_AVATAR_ILLUSTRATIONS[0];
}
