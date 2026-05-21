"use client";

import {
  resolveIllustration,
  dicebearUrl,
  DICEBEAR_STYLES,
  type ProfileAvatarKind,
  type DiceBearStyle,
} from "@/lib/profile-avatar";

type Props = {
  displayName: string;
  avatarKind?: string | null;
  avatarEmoji?: string | null;
  avatarIllustration?: string | null;
  /** For DiceBear — the user's unique seed (user.id). Falls back to displayName. */
  avatarSeed?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  ringClassName?: string;
};

const sizeMap = {
  sm: { box: "h-8 w-8 text-sm",   emoji: "text-base", px: 32 },
  md: { box: "h-10 w-10 text-sm", emoji: "text-lg",   px: 40 },
  lg: { box: "h-12 w-12 text-base",emoji: "text-xl",  px: 48 },
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  if (parts.length === 1 && parts[0]!.length >= 2) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

function fallbackColor(name: string) {
  const palette = [
    { bg: "bg-violet-200", text: "text-violet-900" },
    { bg: "bg-sky-200",    text: "text-sky-900" },
    { bg: "bg-emerald-200",text: "text-emerald-900" },
    { bg: "bg-amber-200",  text: "text-amber-900" },
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length]!;
}

export default function UserAvatar({
  displayName,
  avatarKind,
  avatarEmoji,
  avatarIllustration,
  avatarSeed,
  size = "md",
  className = "",
  ringClassName = "ring-2 ring-white/60",
}: Props) {
  const s = sizeMap[size];
  const kind: ProfileAvatarKind =
    avatarKind === "illustration" ? "illustration"
    : avatarKind === "dicebear"   ? "dicebear"
    : "emoji";

  // ── DiceBear ──────────────────────────────────────────────────────────────
  if (kind === "dicebear") {
    const style = (DICEBEAR_STYLES.find((st) => st.id === avatarIllustration)?.id
      ?? "fun-emoji") as DiceBearStyle;
    const seed = avatarSeed || displayName || "kaviro";
    const url = dicebearUrl(style, seed, s.px * 2); // 2x for retina
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={displayName}
        width={s.px}
        height={s.px}
        className={`shrink-0 rounded-full object-cover ${ringClassName} ${className}`}
        title={displayName}
        loading="lazy"
      />
    );
  }

  // ── Ilustración con gradiente ─────────────────────────────────────────────
  if (kind === "illustration") {
    const ill = resolveIllustration(avatarIllustration);
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${ill.gradient} ${s.box} ${ringClassName} ${className}`}
        title={displayName}
        aria-hidden
      >
        <span className={s.emoji}>{ill.glyph}</span>
      </span>
    );
  }

  // ── Emoji ─────────────────────────────────────────────────────────────────
  if (avatarEmoji) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white/90 ${s.box} ${ringClassName} ${className}`}
        title={displayName}
        aria-hidden
      >
        <span className={s.emoji}>{avatarEmoji}</span>
      </span>
    );
  }

  // ── Iniciales (fallback) ──────────────────────────────────────────────────
  const c = fallbackColor(displayName);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-extrabold ${c.bg} ${c.text} ${s.box} ${ringClassName} ${className}`}
      title={displayName}
      aria-hidden
    >
      {initials(displayName)}
    </span>
  );
}
