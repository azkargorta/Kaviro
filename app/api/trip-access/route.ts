import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizePermissions, normalizeRole } from "@/lib/permissions";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");
    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw new Error(userError.message);
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const { data: participant, error: participantError } = await supabase
      .from("trip_participants")
      .select(
        "id, role, can_manage_trip, can_manage_participants, can_manage_expenses, can_manage_plan, can_manage_map, can_manage_resources"
      )
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .neq("status", "removed")
      .maybeSingle();
    if (participantError) throw new Error(participantError.message);
    if (!participant) return NextResponse.json({ error: "Sin acceso al viaje." }, { status: 403 });

    const role = normalizeRole(participant.role);
    const perms = normalizePermissions(role, participant);

    return NextResponse.json({
      access: {
        role,
        canManageTrip: perms.can_manage_trip,
        canManageParticipants: perms.can_manage_participants,
        canManageExpenses: perms.can_manage_expenses,
        canManagePlan: perms.can_manage_plan,
        canManageMap: perms.can_manage_map,
        canManageResources: perms.can_manage_resources,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo comprobar el acceso." },
      { status: 500 }
    );
  }
}
