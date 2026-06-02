import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  filterUserIdsByPushPreferences,
  type PushNotifyEvent,
} from "@/lib/push-notification-preferences";
import { createUserNotification, type UserNotificationType } from "@/lib/server/user-notifications";
import { sendPushToUserIds } from "@/lib/server/web-push";

type Admin = ReturnType<typeof createSupabaseAdmin>;

const EVENT_COPY: Record<
  PushNotifyEvent,
  (actor: string, detail?: string) => { title: string; body: string }
> = {
  activity_added: (actor, detail) => ({
    title: "Nueva actividad",
    body: `${actor} añadió «${detail || "una actividad"}» al plan`,
  }),
  activity_edited: (actor, detail) => ({
    title: "Plan actualizado",
    body: `${actor} editó «${detail || "una actividad"}»`,
  }),
  expense_added: (actor, detail) => ({
    title: "Nuevo gasto",
    body: `${actor} registró ${detail || "un gasto"}`,
  }),
  participant_joined: (actor) => ({
    title: "Alguien se unió",
    body: `${actor} se ha unido al viaje`,
  }),
  trip_invite: (actor, detail) => ({
    title: "Invitación al viaje",
    body: `${actor} te invita a «${detail || "un viaje"}»`,
  }),
  trip_starts_tomorrow: (_, detail) => ({
    title: "¡Mañana empieza el viaje!",
    body: `Tu viaje a ${detail || "tu destino"} empieza mañana`,
  }),
};

const PUSH_TO_IN_APP: Record<PushNotifyEvent, UserNotificationType> = {
  activity_added: "activity_added",
  activity_edited: "activity_edited",
  expense_added: "expense_added",
  participant_joined: "participant_joined",
  trip_invite: "trip_invite",
  trip_starts_tomorrow: "trip_starts_tomorrow",
};

export async function getOtherTripParticipantUserIds(
  client: SupabaseClient | Admin,
  tripId: string,
  exceptUserId: string
): Promise<string[]> {
  const { data: participants } = await client
    .from("trip_participants")
    .select("user_id")
    .eq("trip_id", tripId)
    .neq("status", "removed")
    .neq("user_id", exceptUserId)
    .not("user_id", "is", null);

  return (participants ?? [])
    .map((p) => p.user_id as string)
    .filter(Boolean);
}

export async function resolveActorDisplayName(
  admin: Admin,
  userId: string,
  fallback = "Un participante"
): Promise<string> {
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name, full_name, username")
    .eq("id", userId)
    .maybeSingle();

  const row = profile as { display_name?: string; full_name?: string; username?: string } | null;
  return (
    row?.display_name?.trim() ||
    row?.full_name?.trim() ||
    row?.username?.trim() ||
    fallback
  );
}

/** Notifica al resto del viaje: in-app para todos; push según preferencias. */
export async function notifyTripMembers(opts: {
  tripId: string;
  actorUserId: string;
  event: PushNotifyEvent;
  actorName?: string;
  detail?: string;
  url?: string;
}): Promise<{ inApp: number; push: number }> {
  const admin = createSupabaseAdmin();
  const userIds = await getOtherTripParticipantUserIds(admin, opts.tripId, opts.actorUserId);
  if (!userIds.length) return { inApp: 0, push: 0 };

  const actorName =
    opts.actorName?.trim() ||
    (await resolveActorDisplayName(admin, opts.actorUserId));
  const copy = EVENT_COPY[opts.event]?.(actorName, opts.detail);
  if (!copy) return { inApp: 0, push: 0 };

  const url = opts.url || `/trip/${opts.tripId}/summary`;
  const inAppType = PUSH_TO_IN_APP[opts.event];

  await Promise.all(
    userIds.map((userId) =>
      createUserNotification(admin, {
        userId,
        type: inAppType,
        title: copy.title,
        body: copy.body,
        url,
      })
    )
  );

  const { data: prefRows } = await admin
    .from("push_notification_preferences")
    .select(
      "user_id, enabled, activity_added, activity_edited, expense_added, participant_joined, trip_starts_tomorrow, trip_invite"
    )
    .in("user_id", userIds);

  const pushUserIds = filterUserIdsByPushPreferences(
    userIds,
    (prefRows ?? []) as Array<{ user_id: string } & Record<string, boolean>>,
    opts.event
  );

  let push = 0;
  if (pushUserIds.length) {
    const result = await sendPushToUserIds(pushUserIds, { ...copy, url });
    push = result.sent ?? pushUserIds.length;
  }

  return { inApp: userIds.length, push };
}
