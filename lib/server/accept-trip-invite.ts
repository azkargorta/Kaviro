import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { TripInviteRecord } from "@/lib/trip-invite-accept";
import { ensureDemoTripForUser } from "@/lib/onboarding/createDemoTrip";
import { logger } from "@/lib/logger";
import type { User } from "@supabase/supabase-js";

function nowIso() {
  return new Date().toISOString();
}

export type AcceptTripInviteResult =
  | { tripId: string; invite: TripInviteRecord; alreadyAccepted: boolean }
  | { error: string; status: number };

export async function acceptTripInviteForUser(
  token: string,
  user: Pick<User, "id" | "email" | "user_metadata">
): Promise<AcceptTripInviteResult> {
  if (!token.trim()) {
    return { error: "Falta token", status: 400 };
  }

  const admin = getServiceRoleClient();

  const { data: invite, error: inviteError } = await admin
    .from("trip_invites")
    .select("*")
    .eq("token", token.trim())
    .maybeSingle();

  if (inviteError) {
    return { error: inviteError.message, status: 500 };
  }

  if (!invite) {
    return { error: "Invitación no encontrada", status: 404 };
  }

  const row = invite as TripInviteRecord;

  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { error: "Esta invitación ha caducado.", status: 410 };
  }

  if (row.status === "accepted") {
    return { tripId: row.trip_id, invite: row, alreadyAccepted: true };
  }

  if (row.participant_id) {
    const { data: existingParticipant, error: existingParticipantError } = await admin
      .from("trip_participants")
      .select("id, trip_id, user_id")
      .eq("id", row.participant_id)
      .maybeSingle();

    if (existingParticipantError || !existingParticipant) {
      return {
        error: existingParticipantError?.message || "No se encontró el participante asociado a la invitación",
        status: 500,
      };
    }

    if (existingParticipant.user_id && existingParticipant.user_id !== user.id) {
      return { error: "Este enlace ya está vinculado a otro usuario.", status: 409 };
    }

    const { error: updateParticipantError } = await admin
      .from("trip_participants")
      .update({
        user_id: user.id,
        joined_via: "invite",
        linked_at: nowIso(),
        updated_at: nowIso(),
      })
      .eq("id", row.participant_id);

    if (updateParticipantError) {
      return { error: updateParticipantError.message, status: 500 };
    }
  } else {
    const { data: existingByUser, error: existingByUserError } = await admin
      .from("trip_participants")
      .select("id")
      .eq("trip_id", row.trip_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingByUserError) {
      return { error: existingByUserError.message, status: 500 };
    }

    if (!existingByUser) {
      const { data: profile } = await admin
        .from("profiles")
        .select("username, email")
        .eq("id", user.id)
        .maybeSingle();

      const { error: insertError } = await admin.from("trip_participants").insert({
        trip_id: row.trip_id,
        display_name: row.display_name || profile?.username || "Participante",
        username: profile?.username || null,
        email: row.email || profile?.email || user.email || null,
        user_id: user.id,
        joined_via: "invite",
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

      if (insertError) {
        return { error: insertError.message, status: 500 };
      }
    }
  }

  const { error: markError } = await admin
    .from("trip_invites")
    .update({
      status: "accepted",
      accepted_by_user_id: user.id,
      accepted_at: nowIso(),
    })
    .eq("id", row.id);

  if (markError) {
    return { error: markError.message, status: 500 };
  }

  const { data: updatedInvite, error: reloadError } = await admin
    .from("trip_invites")
    .select("*")
    .eq("id", row.id)
    .maybeSingle();

  if (reloadError) {
    return { error: reloadError.message, status: 500 };
  }

  try {
    await ensureDemoTripForUser(user as User);
  } catch (demoErr) {
    logger.error("No se pudo crear el viaje demo tras invitación:", demoErr);
  }

  const finalInvite = (updatedInvite || {
    ...row,
    status: "accepted",
    accepted_by_user_id: user.id,
    accepted_at: nowIso(),
  }) as TripInviteRecord;

  return { tripId: row.trip_id, invite: finalInvite, alreadyAccepted: false };
}
