import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser, type AgencyRole } from "@/lib/agency";
import {
  agencyInvitePath,
  countAgencyMembers,
  countPendingAgencyInvites,
  createAgencyInvite,
} from "@/lib/agency-invites";
import { headers } from "next/headers";

export const runtime = "nodejs";

function isAgencyAdmin(role: string, userId: string, ownerId: string) {
  return role === "admin" || userId === ownerId;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const ctx = await getAgencyForUser(supabase, user.id);
    if (!ctx) return NextResponse.json({ error: "Sin agencia." }, { status: 403 });

    const { data, error } = await supabase
      .from("agency_invites")
      .select("id, email, role, token, expires_at, accepted_at, created_at")
      .eq("agency_id", ctx.agency.id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.message.includes("agency_invites")) {
        return NextResponse.json({ invites: [], needsMigration: true });
      }
      throw new Error(error.message);
    }

    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "";
    const proto = h.get("x-forwarded-proto") || "https";
    const origin = host ? `${proto}://${host}` : "";

    const invites = (data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      expiresAt: row.expires_at,
      inviteUrl: origin ? `${origin}${agencyInvitePath(row.token as string)}` : agencyInvitePath(row.token as string),
    }));

    return NextResponse.json({ invites });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
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
      return NextResponse.json({ error: "Solo administradores pueden invitar." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const role: AgencyRole = body?.role === "admin" ? "admin" : "editor";

    if (!email) {
      return NextResponse.json({ error: "El email es obligatorio." }, { status: 400 });
    }

    const members = await countAgencyMembers(supabase, ctx.agency.id, ctx.agency.owner_id);
    const pending = await countPendingAgencyInvites(supabase, ctx.agency.id);
    const max = ctx.agency.max_members ?? 99;

    if (members + pending >= max) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${max} perfiles acordado. Contacta con Kaviro para ampliarlo.`,
          code: "member_limit",
        },
        { status: 403 }
      );
    }

    const invite = await createAgencyInvite(supabase, ctx.agency.id, {
      email,
      role,
      invitedBy: user.id,
    });

    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "";
    const proto = h.get("x-forwarded-proto") || "https";
    const origin = host ? `${proto}://${host}` : "";
    const inviteUrl = `${origin}${agencyInvitePath(invite.token as string)}`;

    return NextResponse.json({ inviteUrl, email: invite.email, role: invite.role }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400 });

    const { error } = await supabase
      .from("agency_invites")
      .delete()
      .eq("id", id)
      .eq("agency_id", ctx.agency.id)
      .is("accepted_at", null);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
