import { isValidUsername, normalizeUsername } from "@/lib/validators/auth";
import { buildUsernameFromEmail } from "@/lib/profile";
import type { createSupabaseAdmin } from "@/lib/supabase-admin";

type ProfileRow = { username?: string | null; email?: string | null } | null;

type AuthUserLike = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null;

type AdminClient = ReturnType<typeof createSupabaseAdmin>;

/** Username guardado en profiles o, en cuentas antiguas, en auth user_metadata. */
export function resolveProfileUsername(profile: ProfileRow, user?: AuthUserLike): string {
  const fromProfile = typeof profile?.username === "string" ? profile.username.trim() : "";
  if (fromProfile) return fromProfile;

  const meta = user?.user_metadata?.username;
  if (typeof meta === "string" && meta.trim()) {
    const normalized = normalizeUsername(meta);
    if (isValidUsername(normalized)) return normalized;
  }

  return "";
}

/**
 * Si profiles.username está vacío pero hay username en metadata (o email), lo sincroniza en BD.
 */
export async function syncProfileUsernameIfMissing(
  admin: AdminClient,
  userId: string,
  profile: ProfileRow,
  user: AuthUserLike
): Promise<string> {
  const existing = resolveProfileUsername(profile, user);
  if (existing) return existing;

  const email = user?.email || profile?.email || "";
  let candidate = "";

  const meta = user?.user_metadata?.username;
  if (typeof meta === "string" && meta.trim()) {
    const normalized = normalizeUsername(meta);
    if (isValidUsername(normalized)) candidate = normalized;
  }

  if (!candidate && typeof email === "string" && email.includes("@")) {
    candidate = buildUsernameFromEmail(email);
    if (!isValidUsername(candidate)) candidate = "";
  }

  if (!candidate) return "";

  const { error } = await admin
    .from("profiles")
    .update({ username: candidate, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return candidate;
  return candidate;
}
