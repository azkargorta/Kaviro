import { NextResponse } from "next/server";
import { requireTripAccessApi } from "@/lib/trip-access-api";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { createUserNotification } from "@/lib/server/user-notifications";
import { getOtherTripParticipantUserIds, resolveActorDisplayName } from "@/lib/server/notify-trip-members";

export const runtime = "nodejs";
export const maxDuration = 60;

const TABLE = "trip_messages";
const PAGE_SIZE = 80;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId") || "";
    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;

    const { data, error } = await gate.supabase
      .from(TABLE)
      .select("id, trip_id, user_id, body, created_at")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true })
      .limit(PAGE_SIZE);

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Ejecuta docs/kaviro_trip_messages.sql en Supabase.", messages: [] },
          { status: 503 }
        );
      }
      throw error;
    }

    const userIds = [...new Set((data ?? []).map((m) => m.user_id as string).filter(Boolean))];
    let profilesById: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
    if (userIds.length) {
      const { data: profiles } = await gate.supabase
        .from("profiles")
        .select("id, display_name, full_name, username, avatar_url")
        .in("id", userIds);
      for (const p of profiles ?? []) {
        const row = p as {
          id: string;
          display_name?: string | null;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
        };
        profilesById[row.id] = {
          display_name:
            row.display_name?.trim() ||
            row.full_name?.trim() ||
            row.username?.trim() ||
            "Participante",
          avatar_url: row.avatar_url ?? null,
        };
      }
    }

    const messages = (data ?? []).map((m) => ({
      ...m,
      author_name: profilesById[m.user_id as string]?.display_name ?? "Participante",
      author_avatar_url: profilesById[m.user_id as string]?.avatar_url ?? null,
    }));

    return NextResponse.json({ messages });
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
          { error: "Ejecuta docs/kaviro_trip_messages.sql en Supabase." },
          { status: 503 }
        );
      }
      throw error;
    }

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

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo enviar el mensaje." },
      { status: 500 }
    );
  }
}
