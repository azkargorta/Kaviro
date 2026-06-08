import { createClient } from "@/lib/supabase/server";
import { acceptTripInviteForUser } from "@/lib/server/accept-trip-invite";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token : "";
    if (!token) {
      return NextResponse.json({ error: "Falta token" }, { status: 400 });
    }

    const userClient = await createClient();
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Debes iniciar sesión para aceptar la invitación." }, { status: 401 });
    }

    const result = await acceptTripInviteForUser(token, user);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      invite: result.invite,
      alreadyAccepted: result.alreadyAccepted,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo aceptar la invitación." },
      { status: 500 }
    );
  }
}
