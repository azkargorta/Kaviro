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

/** Compañeros con los que has compartido al menos un viaje (excluye el viaje actual). */
export async function listTravelMatesForTrip(
  admin: SupabaseClient,
  userId: string,
  tripId: string
): Promise<TravelMateRow[]> {
  const { data: myRows, error: myErr } = await admin
    .from("trip_participants")
    .select("trip_id")
    .eq("user_id", userId)
    .neq("status", "removed");
  if (myErr) throw new Error(myErr.message);

  const myTripIds = ((myRows ?? []) as { trip_id: string }[]).map((r) => r.trip_id).filter(Boolean);
  if (!myTripIds.length) return [];

  const { data: inTrip } = await admin
    .from("trip_participants")
    .select("user_id")
    .eq("trip_id", tripId)
    .neq("status", "removed")
    .not("user_id", "is", null);
  const excludeIds = new Set(
    ((inTrip ?? []) as { user_id: string }[]).map((r) => r.user_id).filter(Boolean)
  );
  excludeIds.add(userId);

  const { data: coRows, error: coErr } = await admin
    .from("trip_participants")
    .select("user_id, trip_id")
    .in("trip_id", myTripIds)
    .neq("status", "removed")
    .not("user_id", "is", null);
  if (coErr) throw new Error(coErr.message);

  const counts = new Map<string, { trips: Set<string> }>();
  for (const row of (coRows ?? []) as { user_id: string; trip_id: string }[]) {
    if (!row.user_id || excludeIds.has(row.user_id)) continue;
    let entry = counts.get(row.user_id);
    if (!entry) {
      entry = { trips: new Set() };
      counts.set(row.user_id, entry);
    }
    entry.trips.add(row.trip_id);
  }

  const mateIds = [...counts.keys()];
  if (!mateIds.length) return [];

  const { data: profiles, error: profErr } = await admin
    .from("profiles")
    .select("id, username, full_name, avatar_kind, avatar_emoji, avatar_illustration")
    .in("id", mateIds);
  if (profErr) throw new Error(profErr.message);

  const profileMap = new Map(
    ((profiles ?? []) as Array<{
      id: string;
      username: string;
      full_name: string | null;
      avatar_kind: string | null;
      avatar_emoji: string | null;
      avatar_illustration: string | null;
    }>).map((p) => [p.id, p])
  );

  const mates: TravelMateRow[] = mateIds.map((id) => {
    const p = profileMap.get(id);
    const tripSet = counts.get(id)?.trips ?? new Set();
    return {
      user_id: id,
      username: p?.username ?? "usuario",
      full_name: p?.full_name ?? null,
      avatar_kind: p?.avatar_kind ?? null,
      avatar_emoji: p?.avatar_emoji ?? null,
      avatar_illustration: p?.avatar_illustration ?? null,
      shared_trips_count: tripSet.size,
      last_shared_at: null,
    };
  });

  mates.sort((a, b) => b.shared_trips_count - a.shared_trips_count || a.username.localeCompare(b.username, "es"));
  return mates;
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
