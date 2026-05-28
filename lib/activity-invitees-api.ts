import type { SupabaseClient } from "@supabase/supabase-js";
import type { TripAccessResult } from "@/lib/trip-access";
import {
  normalizeInviteScope,
  parseInvitedParticipantIds,
  type ActivityInviteScope,
} from "@/lib/activity-invite-scope";

export async function loadActivityInviteesForTrip(
  supabase: SupabaseClient,
  tripId: string,
  activityIds: string[]
) {
  if (!activityIds.length) return new Map<string, string[]>();

  void tripId;
  const { data, error } = await supabase
    .from("trip_activity_invitees")
    .select("activity_id, participant_id")
    .in("activity_id", activityIds);

  if (error) {
    if (isMissingInviteesTable(error.message)) return new Map<string, string[]>();
    throw new Error(error.message);
  }

  const map = new Map<string, string[]>();
  for (const row of data ?? []) {
    const aid = String((row as { activity_id?: string }).activity_id || "");
    const pid = String((row as { participant_id?: string }).participant_id || "");
    if (!aid || !pid) continue;
    const prev = map.get(aid) ?? [];
    prev.push(pid);
    map.set(aid, prev);
  }
  return map;
}

export function isMissingInviteScopeColumn(message: string) {
  const m = message.toLowerCase();
  return m.includes("invite_scope") && m.includes("column");
}

export function isMissingInviteesTable(message: string) {
  const m = message.toLowerCase();
  return m.includes("trip_activity_invitees") && (m.includes("does not exist") || m.includes("could not find"));
}

export async function syncActivityInvitees(
  supabase: SupabaseClient,
  tripId: string,
  activityId: string,
  scope: ActivityInviteScope,
  invitedParticipantIds: string[],
  access: TripAccessResult
): Promise<{ ok: true } | { ok: false; warning: string }> {
  const { error: delError } = await supabase
    .from("trip_activity_invitees")
    .delete()
    .eq("activity_id", activityId);

  if (delError && !isMissingInviteesTable(delError.message)) {
    return { ok: false, warning: delError.message };
  }
  if (delError && isMissingInviteesTable(delError.message)) {
    return {
      ok: false,
      warning:
        "La tabla `trip_activity_invitees` no existe. Ejecuta `docs/tripboard_activity_invite_scope.sql` en Supabase.",
    };
  }

  if (scope !== "selected") return { ok: true };

  const ids = parseInvitedParticipantIds(invitedParticipantIds);
  const withCreator = new Set(ids);
  withCreator.add(access.participantId);

  if (!withCreator.size) return { ok: true };

  const { data: validRows, error: validError } = await supabase
    .from("trip_participants")
    .select("id")
    .eq("trip_id", tripId)
    .neq("status", "removed")
    .in("id", [...withCreator]);

  if (validError) {
    return { ok: false, warning: validError.message };
  }

  const validIds = new Set((validRows ?? []).map((r) => String((r as { id: string }).id)));
  const payload = [...withCreator]
    .filter((id) => validIds.has(id))
    .map((participant_id) => ({ activity_id: activityId, participant_id }));

  if (!payload.length) return { ok: true };

  const { error: insError } = await supabase.from("trip_activity_invitees").insert(payload);
  if (insError) {
    return { ok: false, warning: insError.message };
  }
  return { ok: true };
}

export function inviteFieldsFromBody(body: Record<string, unknown> | null | undefined) {
  const invite_scope = normalizeInviteScope(body?.invite_scope ?? body?.inviteScope);
  const invited_participant_ids = parseInvitedParticipantIds(
    body?.invited_participant_ids ?? body?.invitedParticipantIds
  );
  return { invite_scope, invited_participant_ids };
}
