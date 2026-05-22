import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUserIds } from "@/lib/server/web-push";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  filterUserIdsByPushPreferences,
  type PushNotifyEvent,
} from "@/lib/push-notification-preferences";

export type NotifyEvent = PushNotifyEvent;

const EVENT_COPY: Record<NotifyEvent, (actor: string, detail?: string) => { title: string; body: string }> = {
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

/**
 * POST /api/push/notify
 * Sends a trip notification to all participants except the actor.
 * Body: { tripId, event, actorName, detail?, url? }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tripId, event, actorName, detail, url } = await request.json() as {
      tripId: string;
      event: NotifyEvent;
      actorName: string;
      detail?: string;
      url?: string;
    };

    if (!tripId || !event) {
      return NextResponse.json({ error: "Missing tripId or event" }, { status: 400 });
    }

    const { data: participants } = await supabase
      .from("trip_participants")
      .select("user_id")
      .eq("trip_id", tripId)
      .neq("status", "removed")
      .neq("user_id", user.id)
      .not("user_id", "is", null);

    const userIds = (participants ?? [])
      .map((p) => p.user_id as string)
      .filter(Boolean);

    if (!userIds.length) return NextResponse.json({ sent: 0, reason: "no other participants" });

    const admin = createSupabaseAdmin();
    const { data: prefRows } = await admin
      .from("push_notification_preferences")
      .select(
        "user_id, enabled, activity_added, activity_edited, expense_added, participant_joined, trip_starts_tomorrow, trip_invite"
      )
      .in("user_id", userIds);

    const eligibleUserIds = filterUserIdsByPushPreferences(
      userIds,
      (prefRows ?? []) as Array<{ user_id: string } & Record<string, boolean>>,
      event
    );

    if (!eligibleUserIds.length) {
      return NextResponse.json({ sent: 0, reason: "filtered_by_preferences" });
    }

    const copy = EVENT_COPY[event]?.(actorName, detail);
    if (!copy) return NextResponse.json({ error: "Unknown event" }, { status: 400 });

    const result = await sendPushToUserIds(eligibleUserIds, {
      ...copy,
      url: url || `/trip/${tripId}/summary`,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Push notify error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
