import type { SupabaseClient } from "@supabase/supabase-js";

export type ChatAuthorProfile = {
  display_name: string;
  avatar_url: string | null;
};

export function displayNameFromProfileRow(row: {
  display_name?: string | null;
  full_name?: string | null;
  username?: string | null;
} | null) {
  return (
    row?.display_name?.trim() ||
    row?.full_name?.trim() ||
    row?.username?.trim() ||
    "Participante"
  );
}

export async function loadChatProfilesByUserIds(
  client: SupabaseClient,
  userIds: string[]
): Promise<Record<string, ChatAuthorProfile>> {
  const out: Record<string, ChatAuthorProfile> = {};
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return out;

  const { data: profiles } = await client
    .from("profiles")
    .select("id, display_name, full_name, username, avatar_url")
    .in("id", unique);

  for (const p of profiles ?? []) {
    const row = p as {
      id: string;
      display_name?: string | null;
      full_name?: string | null;
      username?: string | null;
      avatar_url?: string | null;
    };
    out[row.id] = {
      display_name: displayNameFromProfileRow(row),
      avatar_url: row.avatar_url ?? null,
    };
  }

  return out;
}

export function enrichChatMessages<T extends { user_id: string }>(
  rows: T[],
  profilesById: Record<string, ChatAuthorProfile>
): Array<
  T & {
    author_name: string;
    author_avatar_url: string | null;
  }
> {
  return rows.map((m) => ({
    ...m,
    author_name: profilesById[m.user_id]?.display_name ?? "Participante",
    author_avatar_url: profilesById[m.user_id]?.avatar_url ?? null,
  }));
}
