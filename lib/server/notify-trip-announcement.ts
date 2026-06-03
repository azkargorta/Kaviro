import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { createUserNotification } from "@/lib/server/user-notifications";
import { sendPushToUserIds } from "@/lib/server/web-push";
import { getOtherTripParticipantUserIds } from "@/lib/server/notify-trip-members";

/** Aviso del organizador (Kaviro Trips): notificación in-app + push si está activado. */
export async function notifyTripAnnouncement(opts: {
  tripId: string;
  actorUserId: string;
  title: string;
  organizerLabel?: string;
}): Promise<{ inApp: number; push: number }> {
  const admin = createSupabaseAdmin();
  const userIds = await getOtherTripParticipantUserIds(admin, opts.tripId, opts.actorUserId);
  if (!userIds.length) return { inApp: 0, push: 0 };

  const organizer = opts.organizerLabel?.trim() || "Tu organizador";
  const detail = opts.title.trim() || "un aviso";
  const url = `/trip/${opts.tripId}/announcements`;

  const copy = {
    title: "Nuevo aviso del viaje",
    body: `${organizer} publicó «${detail}»`,
  };

  await Promise.all(
    userIds.map((userId) =>
      createUserNotification(admin, {
        userId,
        type: "trip_announcement",
        title: copy.title,
        body: copy.body,
        url,
      })
    )
  );

  const { data: prefRows } = await admin
    .from("push_notification_preferences")
    .select("user_id, enabled")
    .in("user_id", userIds);

  const pushUserIds = (prefRows ?? [])
    .filter((row) => (row as { enabled?: boolean }).enabled !== false)
    .map((row) => row.user_id as string);

  const targets = pushUserIds.length ? pushUserIds : userIds;
  let push = 0;
  if (targets.length) {
    const result = await sendPushToUserIds(targets, { ...copy, url });
    push = result.sent ?? targets.length;
  }

  return { inApp: userIds.length, push };
}
