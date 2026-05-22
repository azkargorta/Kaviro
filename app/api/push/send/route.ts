import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUserIds, type PushPayload } from "@/lib/server/web-push";

export const runtime = "nodejs";

/**
 * POST /api/push/send
 * Body: { userIds: string[], payload: { title, body, url?, icon? } }
 * Solo el propio usuario o participantes del viaje (si url incluye /trip/[id]).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const userIds = Array.isArray(body?.userIds)
      ? (body.userIds as unknown[]).filter((id): id is string => typeof id === "string")
      : [];
    const payload = body?.payload as PushPayload | undefined;

    if (!userIds.length || !payload?.title || !payload?.body) {
      return NextResponse.json({ error: "Faltan userIds o payload" }, { status: 400 });
    }

    const tripMatch = payload.url?.match(/\/trip\/([^/]+)/);
    if (tripMatch) {
      const tripId = tripMatch[1];
      const { data: participant } = await supabase
        .from("trip_participants")
        .select("id")
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .neq("status", "removed")
        .maybeSingle();
      if (!participant) {
        return NextResponse.json({ error: "Sin acceso al viaje" }, { status: 403 });
      }
    } else if (!userIds.every((id) => id === user.id)) {
      return NextResponse.json({ error: "Solo puedes enviarte push a ti mismo sin contexto de viaje" }, { status: 403 });
    }

    const result = await sendPushToUserIds(userIds, payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error enviando push" },
      { status: 500 }
    );
  }
}
