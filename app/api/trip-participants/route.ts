import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { forbidUnlessCanManageParticipants, requireTripAccessApi } from "@/lib/trip-access-api";
import { normalizePermissions, type TripRole } from "@/lib/participants";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");
    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;
    const { supabase } = gate;

    const { data, error } = await supabase
      .from("trip_participants")
      .select("*")
      .eq("trip_id", tripId)
      .neq("status", "removed")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<{ user_id?: string | null } & Record<string, unknown>>;
    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];

    let profileMap = new Map<string, Record<string, unknown>>();
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, avatar_kind, avatar_emoji, avatar_illustration")
        .in("id", userIds);
      profileMap = new Map(
        ((profiles ?? []) as Array<{ id: string } & Record<string, unknown>>).map((p) => [p.id, p])
      );
    }

    const participants = rows.map((row) => {
      const uid = row.user_id as string | null | undefined;
      const prof = uid ? profileMap.get(uid) : null;
      return {
        ...row,
        profile_avatar_kind: prof?.avatar_kind ?? null,
        profile_avatar_emoji: prof?.avatar_emoji ?? null,
        profile_avatar_illustration: prof?.avatar_illustration ?? null,
      };
    });

    return NextResponse.json({ participants });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron cargar los participantes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const tripId = typeof body?.tripId === "string" ? body.tripId : body?.trip_id;
    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;
    const denied = forbidUnlessCanManageParticipants(gate.access);
    if (denied) return denied;

    const { supabase } = gate;

    const role = (typeof body?.role === "string" ? body.role : "viewer") as TripRole;
    const permissions = normalizePermissions(role, body || undefined);

    const payload = {
      trip_id: tripId,
      display_name: typeof body?.display_name === "string" ? body.display_name.trim() : "",
      username: typeof body?.username === "string" ? body.username.trim() : null,
      email: typeof body?.email === "string" ? body.email.trim().toLowerCase() : null,
      phone: typeof body?.phone === "string" ? body.phone.trim() : null,
      joined_via: typeof body?.joined_via === "string" ? body.joined_via : "manual",
      user_id: typeof body?.user_id === "string" ? body.user_id : null,
      role,
      status: typeof body?.status === "string" ? body.status : (body?.user_id ? "active" : "pending"),
      linked_at: typeof body?.linked_at === "string" ? body.linked_at : (body?.user_id ? new Date().toISOString() : null),
      ...permissions,
    };

    if (!payload.display_name.trim()) {
      return NextResponse.json({ error: "Falta display_name" }, { status: 400 });
    }

    const { data, error } = await supabase.from("trip_participants").insert(payload).select("*").single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ participant: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear el participante." },
      { status: 500 }
    );
  }
}

