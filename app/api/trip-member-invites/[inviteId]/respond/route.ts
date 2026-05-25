import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { upsertTravelMatePair } from "@/lib/travel-mates";
import { ensureDemoTripForUser } from "@/lib/onboarding/createDemoTrip";
import { sendPushToUserIds } from "@/lib/server/web-push";
import { filterUserIdsByPushPreferences } from "@/lib/push-notification-preferences";
import { createUserNotification } from "@/lib/server/user-notifications";

export const runtime = "nodejs";

function nowIso() {
  return new Date().toISOString();
}

/** POST { action: "accept" | "decline" } */
export async function POST(
  request: Request,
  { params }: { params: { inviteId: string } }
) {
  try {
    const inviteId = params.inviteId;
    const body = await request.json().catch(() => null);
    const action = body?.action === "decline" ? "decline" : body?.action === "accept" ? "accept" : null;
    if (!action) return NextResponse.json({ error: "action debe ser accept o decline" }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const admin = createSupabaseAdmin();
    const { data: invite, error: loadErr } = await admin
      .from("trip_member_invites")
      .select("*")
      .eq("id", inviteId)
      .maybeSingle();

    if (loadErr) throw new Error(loadErr.message);
    if (!invite) return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });

    const row = invite as {
      id: string;
      trip_id: string;
      inviter_user_id: string;
      invitee_user_id: string;
      status: string;
      display_name: string | null;
      role: string;
      can_manage_trip?: boolean;
      can_manage_participants?: boolean;
      can_manage_expenses?: boolean;
      can_manage_plan?: boolean;
      can_manage_map?: boolean;
      can_manage_resources?: boolean;
    };

    if (row.invitee_user_id !== user.id) {
      return NextResponse.json({ error: "No tienes permiso sobre esta invitación." }, { status: 403 });
    }
    if (row.status !== "pending") {
      return NextResponse.json({ error: "Esta invitación ya fue respondida." }, { status: 400 });
    }

    if (action === "decline") {
      await admin
        .from("trip_member_invites")
        .update({ status: "declined", responded_at: nowIso() })
        .eq("id", inviteId);
      return NextResponse.json({ ok: true, status: "declined" });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("username, email")
      .eq("id", user.id)
      .maybeSingle();

    const { data: existing } = await admin
      .from("trip_participants")
      .select("id")
      .eq("trip_id", row.trip_id)
      .eq("user_id", user.id)
      .neq("status", "removed")
      .maybeSingle();

    if (!existing) {
      const { error: insertErr } = await admin.from("trip_participants").insert({
        trip_id: row.trip_id,
        display_name: row.display_name || profile?.username || "Participante",
        username: profile?.username ?? null,
        email: profile?.email ?? user.email ?? null,
        user_id: user.id,
        joined_via: "member_invite",
        role: row.role,
        status: "active",
        linked_at: nowIso(),
        can_manage_trip: row.can_manage_trip ?? false,
        can_manage_participants: row.can_manage_participants ?? false,
        can_manage_expenses: row.can_manage_expenses ?? false,
        can_manage_plan: row.can_manage_plan ?? false,
        can_manage_map: row.can_manage_map ?? false,
        can_manage_resources: row.can_manage_resources ?? false,
      });
      if (insertErr) throw new Error(insertErr.message);
    }

    await admin
      .from("trip_member_invites")
      .update({ status: "accepted", responded_at: nowIso() })
      .eq("id", inviteId);

    try {
      await upsertTravelMatePair(admin, row.inviter_user_id, user.id);
    } catch (mateErr) {
      console.warn("user_travel_mates no actualizado:", mateErr);
    }

    try {
      await ensureDemoTripForUser(user);
    } catch {
      /* opcional */
    }

    const [{ data: tripRow }, { data: inviteeProfile }] = await Promise.all([
      admin.from("trips").select("name").eq("id", row.trip_id).maybeSingle(),
      admin.from("profiles").select("username, full_name").eq("id", user.id).maybeSingle(),
    ]);
    const tripName = (tripRow as { name?: string } | null)?.name?.trim() || "tu viaje";
    const inviteeLabel =
      (inviteeProfile as { full_name?: string | null; username?: string | null } | null)?.full_name?.trim() ||
      ((inviteeProfile as { username?: string | null } | null)?.username
        ? `@${(inviteeProfile as { username: string }).username}`
        : row.display_name || "Alguien");

    const { data: prefRows } = await admin
      .from("push_notification_preferences")
      .select(
        "user_id, enabled, activity_added, activity_edited, expense_added, participant_joined, trip_starts_tomorrow, trip_invite"
      )
      .eq("user_id", row.inviter_user_id);

    const notifyIds = filterUserIdsByPushPreferences(
      [row.inviter_user_id],
      (prefRows ?? []) as Array<{ user_id: string } & Record<string, boolean>>,
      "participant_joined"
    );

    await createUserNotification(admin, {
      userId: row.inviter_user_id,
      type: "invite_accepted",
      title: "Invitación aceptada",
      body: `${inviteeLabel} se ha unido a «${tripName}»`,
      url: `/trip/${row.trip_id}/participants`,
    });

    if (notifyIds.length) {
      void sendPushToUserIds(notifyIds, {
        title: "Invitación aceptada",
        body: `${inviteeLabel} se ha unido a «${tripName}»`,
        url: `/trip/${row.trip_id}/participants`,
      });
    }

    return NextResponse.json({
      ok: true,
      status: "accepted",
      tripId: row.trip_id,
      redirectTo: `/trip/${row.trip_id}/summary`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo procesar la invitación." },
      { status: 500 }
    );
  }
}
