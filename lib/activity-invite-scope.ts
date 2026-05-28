import type { TripAccessResult } from "@/lib/trip-access";

export type ActivityInviteScope = "all" | "self" | "selected";

export type ActivityWithInvite = {
  id: string;
  invite_scope?: string | null;
  created_by_user_id?: string | null;
  invited_participant_ids?: string[];
};

export function normalizeInviteScope(raw: unknown): ActivityInviteScope {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (v === "self" || v === "private" || v === "solo") return "self";
  if (v === "selected" || v === "custom" || v === "some") return "selected";
  return "all";
}

export function parseInvitedParticipantIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean))];
}

export function inviteScopeLabel(scope: ActivityInviteScope | string | null | undefined): string {
  const s = normalizeInviteScope(scope);
  if (s === "self") return "Solo yo";
  if (s === "selected") return "Invitados concretos";
  return "Todo el viaje";
}

export function canViewerSeeActivity(
  activity: ActivityWithInvite,
  access: Pick<TripAccessResult, "userId" | "participantId" | "can_manage_plan">,
  inviteesByActivityId: Map<string, string[]>
): boolean {
  const scope = normalizeInviteScope(activity.invite_scope);
  if (scope === "all") return true;
  if (access.can_manage_plan) return true;

  const creatorId =
    typeof activity.created_by_user_id === "string" ? activity.created_by_user_id : null;
  if (creatorId && creatorId === access.userId) return true;

  if (scope === "self") return false;

  const invited =
    activity.invited_participant_ids ??
    inviteesByActivityId.get(activity.id) ??
    [];
  return invited.includes(access.participantId);
}

export function filterActivitiesForViewer<T extends ActivityWithInvite>(
  activities: T[],
  access: Pick<TripAccessResult, "userId" | "participantId" | "can_manage_plan">,
  inviteesByActivityId: Map<string, string[]>
): T[] {
  return activities.filter((a) => canViewerSeeActivity(a, access, inviteesByActivityId));
}

export function buildInviteesMap(
  rows: Array<{ activity_id: string; participant_id: string }> | null | undefined
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows ?? []) {
    const aid = row.activity_id;
    const pid = row.participant_id;
    if (!aid || !pid) continue;
    const prev = map.get(aid) ?? [];
    prev.push(pid);
    map.set(aid, prev);
  }
  return map;
}

export function attachInvitedParticipantIds<T extends { id: string }>(
  activities: T[],
  inviteesByActivityId: Map<string, string[]>
): Array<T & { invited_participant_ids: string[] }> {
  return activities.map((a) => ({
    ...a,
    invited_participant_ids: inviteesByActivityId.get(a.id) ?? [],
  }));
}
