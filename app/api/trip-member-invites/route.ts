import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { forbidUnlessCanManageParticipants, requireTripAccessApi } from "@/lib/trip-access-api";
import { memberInvitePermissions } from "@/lib/travel-mates";
import type { TripRole } from "@/lib/participants";
import { sendPushToUserIds } from "@/lib/server/web-push";
import { createUserNotification } from "@/lib/server/user-notifications";
import { isValidUsername, normalizeUsername } from "@/lib/validators/auth";

export const runtime = "nodejs";

/** GET — bandeja de invitaciones pendientes para el usuario actual */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("trip_member_invites")
      .select("id, trip_id, inviter_user_id, role, display_name, created_at")
      .eq("invitee_user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.message.includes("trip_member_invites")) {
        return NextResponse.json({ invites: [], needsMigration: true });
      }
      throw new Error(error.message);
    }

    const rows = (data ?? []) as Array<{
      id: string;
      trip_id: string;
      inviter_user_id: string;
      role: string;
      display_name: string | null;
      created_at: string;
    }>;

    const tripIds = [...new Set(rows.map((r) => r.trip_id))];
    const inviterIds = [...new Set(rows.map((r) => r.inviter_user_id))];

    const [{ data: trips }, { data: inviters }] = await Promise.all([
      tripIds.length
        ? admin.from("trips").select("id, name, destination").in("id", tripIds)
        : Promise.resolve({ data: [] }),
      inviterIds.length
        ? admin
            .from("profiles")
            .select("id, username, full_name, avatar_kind, avatar_emoji, avatar_illustration")
            .in("id", inviterIds)
        : Promise.resolve({ data: [] }),
    ]);

    const tripMap = new Map(
      ((trips ?? []) as { id: string; name?: string; destination?: string }[]).map((t) => [t.id, t])
    );
    const inviterMap = new Map(
      (
        (inviters ?? []) as Array<{
          id: string;
          username: string;
          full_name: string | null;
          avatar_kind: string | null;
          avatar_emoji: string | null;
          avatar_illustration: string | null;
        }>
      ).map((p) => [p.id, p])
    );

    const invites = rows.map((row) => {
      const trip = tripMap.get(row.trip_id);
      const inviter = inviterMap.get(row.inviter_user_id);
      return {
        id: row.id,
        trip_id: row.trip_id,
        role: row.role,
        display_name: row.display_name,
        created_at: row.created_at,
        trip_name: trip?.name ?? "Viaje",
        trip_destination: trip?.destination ?? null,
        inviter_username: inviter?.username ?? "Alguien",
        inviter_name: inviter?.full_name ?? null,
        inviter_avatar_kind: inviter?.avatar_kind ?? null,
        inviter_avatar_emoji: inviter?.avatar_emoji ?? null,
        inviter_avatar_illustration: inviter?.avatar_illustration ?? null,
      };
    });

    return NextResponse.json({ invites });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron cargar invitaciones." },
      { status: 500 }
    );
  }
}

/** POST — invitar a un usuario Kaviro al viaje */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const tripId = typeof body?.tripId === "string" ? body.tripId : "";
    let inviteeUserId = typeof body?.inviteeUserId === "string" ? body.inviteeUserId : "";

    if (!inviteeUserId && typeof body?.inviteeUsername === "string") {
      const username = normalizeUsername(body.inviteeUsername.replace(/^@+/, ""));
      if (!isValidUsername(username)) {
        return NextResponse.json({ error: "Username inválido." }, { status: 400 });
      }
      const adminLookup = createSupabaseAdmin();
      const { data: profileByUsername } = await adminLookup
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (!profileByUsername?.id) {
        return NextResponse.json(
          { error: `No encontramos ningún usuario con @${username}.` },
          { status: 404 }
        );
      }
      inviteeUserId = String(profileByUsername.id);
    }

    if (!tripId || !inviteeUserId) {
      return NextResponse.json({ error: "Faltan tripId o usuario a invitar." }, { status: 400 });
    }

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;
    const denied = forbidUnlessCanManageParticipants(gate.access);
    if (denied) return denied;

    if (inviteeUserId === gate.access.userId) {
      return NextResponse.json({ error: "No puedes invitarte a ti mismo." }, { status: 400 });
    }

    const admin = createSupabaseAdmin();
    const role = (typeof body?.role === "string" ? body.role : "viewer") as TripRole;
    const permissions = memberInvitePermissions(role, body ?? undefined);

    const { data: existingParticipant } = await admin
      .from("trip_participants")
      .select("id")
      .eq("trip_id", tripId)
      .eq("user_id", inviteeUserId)
      .neq("status", "removed")
      .maybeSingle();
    if (existingParticipant) {
      return NextResponse.json({ error: "Esa persona ya está en el viaje." }, { status: 400 });
    }

    const { data: pending } = await admin
      .from("trip_member_invites")
      .select("id")
      .eq("trip_id", tripId)
      .eq("invitee_user_id", inviteeUserId)
      .eq("status", "pending")
      .maybeSingle();
    if (pending) {
      return NextResponse.json({ error: "Ya hay una invitación pendiente para esa persona." }, { status: 400 });
    }

    const { data: inviteeProfile } = await admin
      .from("profiles")
      .select("username, full_name")
      .eq("id", inviteeUserId)
      .maybeSingle();

    const displayName =
      typeof body?.displayName === "string" && body.displayName.trim()
        ? body.displayName.trim()
        : (inviteeProfile as { full_name?: string; username?: string } | null)?.full_name ||
          (inviteeProfile as { username?: string } | null)?.username ||
          "Participante";

    const { data, error } = await admin
      .from("trip_member_invites")
      .insert({
        trip_id: tripId,
        inviter_user_id: gate.access.userId,
        invitee_user_id: inviteeUserId,
        role,
        status: "pending",
        display_name: displayName,
        ...permissions,
      })
      .select("id, trip_id, invitee_user_id, status, created_at")
      .single();

    if (error) {
      if (error.message.includes("trip_member_invites")) {
        return NextResponse.json(
          { error: "Ejecuta docs/kaviro_social_features.sql en Supabase." },
          { status: 503 }
        );
      }
      throw new Error(error.message);
    }

    const [{ data: tripRow }, { data: inviterProfile }] = await Promise.all([
      admin.from("trips").select("name").eq("id", tripId).maybeSingle(),
      admin
        .from("profiles")
        .select("display_name, full_name, username")
        .eq("id", gate.access.userId)
        .maybeSingle(),
    ]);
    const tripName = (tripRow as { name?: string } | null)?.name?.trim() || "un viaje";
    const inviter =
      (inviterProfile as { display_name?: string; full_name?: string; username?: string } | null)
        ?.display_name?.trim() ||
      (inviterProfile as { full_name?: string } | null)?.full_name?.trim() ||
      (inviterProfile as { username?: string } | null)?.username?.trim() ||
      "Alguien";

    await createUserNotification(admin, {
      userId: inviteeUserId,
      type: "trip_invite",
      title: "Invitación al viaje",
      body: `${inviter} te invitó a «${tripName}»`,
      url: "/dashboard",
    });

    void sendPushToUserIds([inviteeUserId], {
      title: "Invitación al viaje",
      body: `${inviter} te invitó a «${tripName}»`,
      url: "/dashboard",
    });

    return NextResponse.json({ invite: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo enviar la invitación." },
      { status: 500 }
    );
  }
}
