import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { PushNotifyEvent } from "@/lib/push-notification-preferences";
import { notifyTripMembers } from "@/lib/server/notify-trip-members";

export type NotifyEvent = PushNotifyEvent;

/**
 * POST /api/push/notify
 * Notifica al resto del viaje: in-app + push (según preferencias).
 * Body: { tripId, event, actorName, detail?, url? }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tripId, event, actorName, detail, url } = (await request.json()) as {
      tripId: string;
      event: NotifyEvent;
      actorName: string;
      detail?: string;
      url?: string;
    };

    if (!tripId || !event) {
      return NextResponse.json({ error: "Missing tripId or event" }, { status: 400 });
    }

    const result = await notifyTripMembers({
      tripId,
      actorUserId: user.id,
      event,
      actorName,
      detail,
      url,
    });

    if (!result.inApp && !result.push) {
      return NextResponse.json({ sent: 0, inApp: 0, reason: "no other participants" });
    }

    return NextResponse.json({ sent: result.push, inApp: result.inApp, push: result.push });
  } catch (err) {
    logger.error("Push notify error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
