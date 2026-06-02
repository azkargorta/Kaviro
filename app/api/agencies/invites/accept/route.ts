import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { countAgencyMembers } from "@/lib/agency-invites";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesión para aceptar la invitación." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json({ error: "Token no válido." }, { status: 400 });
    }

    const { data: invite, error: inviteErr } = await supabase
      .from("agency_invites")
      .select("id, agency_id, email, role, expires_at, accepted_at")
      .eq("token", token)
      .maybeSingle();

    if (inviteErr) {
      if (inviteErr.message.includes("agency_invites")) {
        return NextResponse.json({ error: "Migración pendiente (agency_invites)." }, { status: 503 });
      }
      throw new Error(inviteErr.message);
    }

    if (!invite) {
      return NextResponse.json({ error: "Invitación no encontrada." }, { status: 404 });
    }

    if (invite.accepted_at) {
      return NextResponse.json({ ok: true, agencyId: invite.agency_id, alreadyAccepted: true });
    }

    if (new Date(invite.expires_at as string).getTime() < Date.now()) {
      return NextResponse.json({ error: "La invitación ha caducado." }, { status: 410 });
    }

    const userEmail = (user.email || "").trim().toLowerCase();
    const inviteEmail = (invite.email as string).trim().toLowerCase();
    if (userEmail && inviteEmail && userEmail !== inviteEmail) {
      return NextResponse.json(
        {
          error: `Esta invitación es para ${inviteEmail}. Estás conectado como ${userEmail}.`,
        },
        { status: 403 }
      );
    }

    const { data: agency } = await supabase
      .from("agencies")
      .select("id, owner_id, max_members")
      .eq("id", invite.agency_id)
      .maybeSingle();

    if (!agency) {
      return NextResponse.json({ error: "Agencia no encontrada." }, { status: 404 });
    }

    const members = await countAgencyMembers(supabase, agency.id, agency.owner_id);
    if (members >= (agency.max_members ?? 99)) {
      return NextResponse.json(
        { error: "La agencia ha alcanzado el límite de miembros acordado." },
        { status: 403 }
      );
    }

    const { error: memberErr } = await supabase.from("agency_members").upsert(
      {
        agency_id: invite.agency_id,
        user_id: user.id,
        role: invite.role,
      },
      { onConflict: "agency_id,user_id" }
    );

    if (memberErr) throw new Error(memberErr.message);

    await supabase
      .from("agency_invites")
      .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
      .eq("id", invite.id);

    return NextResponse.json({ ok: true, agencyId: invite.agency_id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
