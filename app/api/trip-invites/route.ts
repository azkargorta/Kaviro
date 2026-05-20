import { NextResponse } from "next/server";
import { forbidUnlessCanManageParticipants, requireTripAccessApi } from "@/lib/trip-access-api";
import { normalizePermissions, type TripRole } from "@/lib/participants";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const tripId = typeof body?.tripId === "string" ? body.tripId : body?.trip_id;
    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;
    const forbidden = forbidUnlessCanManageParticipants(gate.access);
    if (forbidden) return forbidden;

    const { access, supabase } = gate;

    const role = (typeof body?.role === "string" ? body.role : "viewer") as TripRole;
    const permissions = normalizePermissions(role, body || undefined);
    const token = crypto.randomUUID().replace(/-/g, "");

    const payload = {
      trip_id: tripId,
      participant_id: typeof body?.participant_id === "string" ? body.participant_id : null,
      token,
      display_name: typeof body?.display_name === "string" ? body.display_name.trim() : null,
      email: typeof body?.email === "string" ? body.email.trim().toLowerCase() : null,
      role,
      status: "pending",
      created_by_user_id: access.userId,
      expires_at: null,
      ...permissions,
    };

    let { data, error } = await supabase.from("trip_invites").insert(payload).select("*").single();
    if (error) {
      const msg = (error.message || "").toLowerCase();
      // Compatibilidad: algunos esquemas antiguos no tienen created_by_user_id.
      if (msg.includes("created_by_user_id") && msg.includes("could not find")) {
        const { created_by_user_id: _omit, ...payloadWithoutCreatedBy } = payload;
        const retry = await supabase.from("trip_invites").insert(payloadWithoutCreatedBy).select("*").single();
        data = retry.data;
        error = retry.error;
      }
    }
    if (error) throw new Error(error.message);

    return NextResponse.json({ invite: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear la invitación." },
      { status: 500 }
    );
  }
}
