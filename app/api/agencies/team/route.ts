import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const ctx = await getAgencyForUser(supabase, user.id);
    if (!ctx) {
      return NextResponse.json({ error: "Sin agencia." }, { status: 403 });
    }

    const { data: members, error } = await supabase
      .from("agency_members")
      .select("user_id, role, created_at")
      .eq("agency_id", ctx.agency.id)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    const userIds = (members ?? []).map((m) => m.user_id as string);
    let profiles: Record<string, { username?: string | null; email?: string | null; full_name?: string | null }> =
      {};

    if (userIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, username, email, full_name")
        .in("id", userIds);

      for (const p of profileRows ?? []) {
        profiles[p.id as string] = {
          username: p.username as string | null,
          email: p.email as string | null,
          full_name: p.full_name as string | null,
        };
      }
    }

    const ownerId = ctx.agency.owner_id;
    const list = (members ?? []).map((m) => {
      const pid = m.user_id as string;
      const profile = profiles[pid];
      return {
        userId: pid,
        role: m.role as string,
        createdAt: m.created_at,
        isOwner: pid === ownerId,
        displayName:
          profile?.full_name ||
          (profile?.username ? `@${profile.username}` : null) ||
          profile?.email ||
          "Usuario",
        email: profile?.email ?? null,
      };
    });

    if (!list.some((m) => m.userId === ownerId)) {
      const ownerProfile = profiles[ownerId];
      list.unshift({
        userId: ownerId,
        role: "admin",
        createdAt: ctx.agency.id,
        isOwner: true,
        displayName:
          ownerProfile?.full_name ||
          (ownerProfile?.username ? `@${ownerProfile.username}` : null) ||
          "Propietario",
        email: ownerProfile?.email ?? null,
      });
    }

    return NextResponse.json({
      members: list,
      maxMembers: ctx.agency.max_members,
      plan: ctx.agency.plan,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
