import { NextResponse } from "next/server";
import { requireTripAccessApi } from "@/lib/trip-access-api";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { createUserNotification } from "@/lib/server/user-notifications";
import { getOtherTripParticipantUserIds, resolveActorDisplayName } from "@/lib/server/notify-trip-members";
import { enrichChatMessages, loadChatProfilesByUserIds } from "@/lib/trip-chat-profiles";

export const runtime = "nodejs";
export const maxDuration = 60;

const TABLE = "trip_messages";
const PAGE_SIZE = 80;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId") || "";
    const before = searchParams.get("before") || "";
    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;

    let query = gate.supabase
      .from(TABLE)
      .select("id, trip_id, user_id, body, created_at")
      .eq("trip_id", tripId);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Ejecuta docs/kaviro_trip_messages.sql en Supabase.", messages: [], tableMissing: true },
          { status: 503 }
        );
      }
      throw error;
    }

    const page = [...(data ?? [])].reverse();
    const userIds = page.map((m) => m.user_id as string).filter(Boolean);
    const profilesById = await loadChatProfilesByUserIds(gate.supabase, userIds);
    const messages = enrichChatMessages(page, profilesById);

    return NextResponse.json({
      messages,
      hasMore: (data?.length ?? 0) === PAGE_SIZE,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudieron cargar los mensajes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const tripId = typeof body?.tripId === "string" ? body.tripId : body?.trip_id;
    const text = typeof body?.body === "string" ? body.body.trim() : "";
    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });
    if (!text) return NextResponse.json({ error: "Escribe un mensaje." }, { status: 400 });
    if (text.length > 4000) return NextResponse.json({ error: "Mensaje demasiado largo." }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;

    const { access, supabase } = gate;

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        trip_id: tripId,
        user_id: access.userId,
        body: text,
      })
      .select("id, trip_id, user_id, body, created_at")
      .single();

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Ejecuta docs/kaviro_trip_messages.sql en Supabase.", tableMissing: true },
          { status: 503 }
        );
      }
      throw error;
    }

    const profilesById = await loadChatProfilesByUserIds(supabase, [access.userId]);
    const [enriched] = enrichChatMessages([data], profilesById);

    const admin = createSupabaseAdmin();
    const actorName = await resolveActorDisplayName(admin, access.userId);
    const others = await getOtherTripParticipantUserIds(admin, tripId, access.userId);
    const preview = text.length > 80 ? `${text.slice(0, 77)}…` : text;
    await Promise.all(
      others.map((userId) =>
        createUserNotification(admin, {
          userId,
          type: "generic",
          title: "Nuevo mensaje en el viaje",
          body: `${actorName}: ${preview}`,
          url: `/trip/${tripId}/messages`,
        })
      )
    );

    return NextResponse.json({ message: enriched }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo enviar el mensaje." },
      { status: 500 }
    );
  }
}
