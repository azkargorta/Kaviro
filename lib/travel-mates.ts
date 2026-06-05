import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePermissions, type TripRole } from "@/lib/participants";

export type TravelMateRow = {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_kind: string | null;
  avatar_emoji: string | null;
  avatar_illustration: string | null;
  shared_trips_count: number;
  last_shared_at: string | null;
};

type MateAggregate = {
  shared_trips_count: number;
  last_shared_at: string | null;
};

type ProfileRow = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_kind: string | null;
  avatar_emoji: string | null;
  avatar_illustration: string | null;
};

function isMissingSocialTableError(message: string) {
  return message.includes("user_travel_mates") || message.includes("avatar_kind");
}

/** Co-ocurrencia en viajes (fallback cuando no hay fila en user_travel_mates). */
async function listCoOccurrenceMateStats(
  admin: SupabaseClient,
  userId: string,
  excludeIds: Set<string>
): Promise<Map<string, MateAggregate>> {
  const { data: myRows, error: myErr } = await admin
    .from("trip_participants")
    .select("trip_id")
    .eq("user_id", userId)
    .neq("status", "removed");
  if (myErr) throw new Error(myErr.message);

  const myTripIds = ((myRows ?? []) as { trip_id: string }[]).map((r) => r.trip_id).filter(Boolean);
  if (!myTripIds.length) return new Map();

  const { data: coRows, error: coErr } = await admin
    .from("trip_participants")
    .select("user_id, trip_id")
    .in("trip_id", myTripIds)
    .neq("status", "removed")
    .not("user_id", "is", null);
  if (coErr) throw new Error(coErr.message);

  const counts = new Map<string, MateAggregate>();
  for (const row of (coRows ?? []) as { user_id: string; trip_id: string }[]) {
    if (!row.user_id || excludeIds.has(row.user_id)) continue;
    let entry = counts.get(row.user_id);
    if (!entry) {
      entry = { shared_trips_count: 0, last_shared_at: null };
      counts.set(row.user_id, entry);
    }
    entry.shared_trips_count += 1;
  }
  return counts;
}

async function listStoredMateStats(
  admin: SupabaseClient,
  userId: string,
  excludeIds: Set<string>
): Promise<Map<string, MateAggregate>> {
  const { data, error } = await admin
    .from("user_travel_mates")
    .select("mate_user_id, shared_trips_count, last_shared_at")
    .eq("user_id", userId)
    .order("last_shared_at", { ascending: false, nullsFirst: false });

  if (error) {
    if (isMissingSocialTableError(error.message)) throw error;
    throw new Error(error.message);
  }

  const map = new Map<string, MateAggregate>();
  for (const row of (data ?? []) as Array<{
    mate_user_id: string;
    shared_trips_count?: number;
    last_shared_at?: string | null;
  }>) {
    if (!row.mate_user_id || excludeIds.has(row.mate_user_id)) continue;
    map.set(row.mate_user_id, {
      shared_trips_count: Number(row.shared_trips_count ?? 0),
      last_shared_at: typeof row.last_shared_at === "string" ? row.last_shared_at : null,
    });
  }
  return map;
}

function mergeMateStats(
  stored: Map<string, MateAggregate>,
  coOccurrence: Map<string, MateAggregate>
): Map<string, MateAggregate> {
  const merged = new Map<string, MateAggregate>(stored);
  for (const [mateId, co] of coOccurrence) {
    const prev = merged.get(mateId);
    if (!prev) {
      merged.set(mateId, { ...co });
      continue;
    }
    merged.set(mateId, {
      shared_trips_count: Math.max(prev.shared_trips_count, co.shared_trips_count),
      last_shared_at: prev.last_shared_at || co.last_shared_at,
    });
  }
  return merged;
}

async function hydrateTravelMateRows(
  admin: SupabaseClient,
  stats: Map<string, MateAggregate>
): Promise<TravelMateRow[]> {
  const mateIds = [...stats.keys()];
  if (!mateIds.length) return [];

  const { data: profiles, error: profErr } = await admin
    .from("profiles")
    .select("id, username, full_name, avatar_kind, avatar_emoji, avatar_illustration")
    .in("id", mateIds);
  if (profErr) throw new Error(profErr.message);

  const profileMap = new Map(((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p]));

  const mates: TravelMateRow[] = mateIds.map((id) => {
    const p = profileMap.get(id);
    const agg = stats.get(id)!;
    return {
      user_id: id,
      username: p?.username ?? "usuario",
      full_name: p?.full_name ?? null,
      avatar_kind: p?.avatar_kind ?? null,
      avatar_emoji: p?.avatar_emoji ?? null,
      avatar_illustration: p?.avatar_illustration ?? null,
      shared_trips_count: agg.shared_trips_count,
      last_shared_at: agg.last_shared_at,
    };
  });

  mates.sort(
    (a, b) =>
      (b.last_shared_at || "").localeCompare(a.last_shared_at || "") ||
      b.shared_trips_count - a.shared_trips_count ||
      a.username.localeCompare(b.username, "es")
  );
  return mates;
}

/** Compañeros habituales del usuario (opcionalmente excluyendo IDs). */
export async function listTravelMatesForUser(
  admin: SupabaseClient,
  userId: string,
  excludeIds: Set<string> = new Set()
): Promise<TravelMateRow[]> {
  const exclusions = new Set(excludeIds);
  exclusions.add(userId);

  let stored = new Map<string, MateAggregate>();
  try {
    stored = await listStoredMateStats(admin, userId, exclusions);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!isMissingSocialTableError(msg)) throw e;
  }

  const coOccurrence = await listCoOccurrenceMateStats(admin, userId, exclusions);
  const merged = mergeMateStats(stored, coOccurrence);
  return hydrateTravelMateRows(admin, merged);
}

/** Compañeros habituales excluyendo participantes del viaje actual. */
export async function listTravelMatesForTrip(
  admin: SupabaseClient,
  userId: string,
  tripId: string
): Promise<TravelMateRow[]> {
  const { data: inTrip } = await admin
    .from("trip_participants")
    .select("user_id")
    .eq("trip_id", tripId)
    .neq("status", "removed")
    .not("user_id", "is", null);
  const excludeIds = new Set(
    ((inTrip ?? []) as { user_id: string }[]).map((r) => r.user_id).filter(Boolean)
  );
  return listTravelMatesForUser(admin, userId, excludeIds);
}

export async function listPendingInviteeIdsForTrip(
  admin: SupabaseClient,
  inviterUserId: string,
  tripId: string
): Promise<string[]> {
  const { data, error } = await admin
    .from("trip_member_invites")
    .select("invitee_user_id")
    .eq("trip_id", tripId)
    .eq("inviter_user_id", inviterUserId)
    .eq("status", "pending");

  if (error) {
    if (error.message.includes("trip_member_invites")) return [];
    throw new Error(error.message);
  }

  return ((data ?? []) as { invitee_user_id: string }[])
    .map((r) => r.invitee_user_id)
    .filter(Boolean);
}

/** Refuerza la “memoria” de compañeros al aceptar una invitación o compartir viaje. */
export async function upsertTravelMatePair(
  admin: SupabaseClient,
  userA: string,
  userB: string
): Promise<void> {
  if (!userA || !userB || userA === userB) return;
  const now = new Date().toISOString();

  for (const [owner, mate] of [
    [userA, userB],
    [userB, userA],
  ] as const) {
    const { data: existing } = await admin
      .from("user_travel_mates")
      .select("shared_trips_count")
      .eq("user_id", owner)
      .eq("mate_user_id", mate)
      .maybeSingle();

    if (existing) {
      await admin
        .from("user_travel_mates")
        .update({
          shared_trips_count: Number((existing as { shared_trips_count?: number }).shared_trips_count ?? 0) + 1,
          last_shared_at: now,
        })
        .eq("user_id", owner)
        .eq("mate_user_id", mate);
    } else {
      await admin.from("user_travel_mates").insert({
        user_id: owner,
        mate_user_id: mate,
        shared_trips_count: 1,
        last_shared_at: now,
      });
    }
  }
}

export function memberInvitePermissions(role: TripRole, body?: Record<string, unknown>) {
  return normalizePermissions(role, body);
}
