import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type NotifyEvent =
  | "activity_added"
  | "activity_edited"
  | "expense_added"
  | "participant_joined"
  | "trip_starts_tomorrow";

const EVENT_COPY: Record<NotifyEvent, (actor: string, detail?: string) => { title: string; body: string }> = {
  activity_added:     (actor, detail) => ({ title: "Nueva actividad 📅", body: `${actor} añadió "${detail}" al plan` }),
  activity_edited:    (actor, detail) => ({ title: "Plan actualizado ✏️", body: `${actor} editó "${detail}"` }),
  expense_added:      (actor, detail) => ({ title: "Nuevo gasto 💶", body: `${actor} registró ${detail}` }),
  participant_joined: (actor)         => ({ title: "Alguien se unió 👋", body: `${actor} se ha unido al viaje` }),
  trip_starts_tomorrow: (_, detail)  => ({ title: "¡Mañana empieza el viaje! ✈️", body: `Tu viaje a ${detail} empieza mañana` }),
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

    // Get all active participants except the actor
    const { data: participants } = await supabase
      .from("trip_participants")
      .select("user_id")
      .eq("trip_id", tripId)
      .eq("status", "active")
      .neq("user_id", user.id)
      .not("user_id", "is", null);

    const userIds = (participants ?? [])
      .map((p) => p.user_id as string)
      .filter(Boolean);

    if (!userIds.length) return NextResponse.json({ sent: 0, reason: "no other participants" });

    const copy = EVENT_COPY[event]?.(actorName, detail);
    if (!copy) return NextResponse.json({ error: "Unknown event" }, { status: 400 });

    // Delegate to the send route
    const sendRes = await fetch(new URL("/api/push/send", request.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") || "" },
      body: JSON.stringify({
        userIds,
        payload: { ...copy, url: url || `/trip/${tripId}/summary` },
      }),
    });

    const result = await sendRes.json();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Push notify error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
