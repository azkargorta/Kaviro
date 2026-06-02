import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";
import { sendAgencyInviteNotification } from "@/lib/email/send-agency-invite";

export const runtime = "nodejs";

function isAgencyAdmin(role: string, userId: string, ownerId: string) {
  return role === "admin" || userId === ownerId;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const ctx = await getAgencyForUser(supabase, user.id);
    if (!ctx) return NextResponse.json({ error: "Sin agencia." }, { status: 403 });

    if (!isAgencyAdmin(ctx.membership.role, user.id, ctx.agency.owner_id)) {
      return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "Falta id de invitación." }, { status: 400 });

    const { data: invite, error } = await supabase
      .from("agency_invites")
      .select("id, email, role, token, expires_at, accepted_at")
      .eq("id", id)
      .eq("agency_id", ctx.agency.id)
      .maybeSingle();

    if (error || !invite) {
      return NextResponse.json({ error: "Invitación no encontrada." }, { status: 404 });
    }

    if (invite.accepted_at) {
      return NextResponse.json({ error: "La invitación ya fue aceptada." }, { status: 400 });
    }

    if (new Date(invite.expires_at as string).getTime() < Date.now()) {
      return NextResponse.json({ error: "La invitación ha caducado. Crea una nueva." }, { status: 410 });
    }

    const { inviteUrl, emailSent, emailError } = await sendAgencyInviteNotification({
      email: invite.email as string,
      agencyName: ctx.agency.name,
      role: invite.role as string,
      token: invite.token as string,
      expiresAt: invite.expires_at as string,
    });

    return NextResponse.json({ inviteUrl, emailSent, emailError: emailSent ? undefined : emailError });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
