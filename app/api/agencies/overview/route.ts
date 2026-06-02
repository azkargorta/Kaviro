import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser, getAgencyTrips } from "@/lib/agency";
import { countAgencyMembers, countPendingAgencyInvites } from "@/lib/agency-invites";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const ctx = await getAgencyForUser(supabase, user.id);
    if (!ctx) return NextResponse.json({ error: "Sin agencia." }, { status: 403 });

    const trips = await getAgencyTrips(supabase, ctx.agency.id);
    const tripIds = trips.map((t) => t.id);

    let publishedPortals = 0;
    let portalViews30d = 0;

    if (tripIds.length > 0) {
      const { data: portals } = await supabase
        .from("agency_client_portals")
        .select("trip_id, is_active")
        .in("trip_id", tripIds);

      publishedPortals = (portals ?? []).filter((p) => p.is_active === true).length;

      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { count, error: viewsErr } = await supabase
        .from("agency_portal_views")
        .select("id", { count: "exact", head: true })
        .eq("agency_id", ctx.agency.id)
        .gte("viewed_at", since.toISOString());

      if (!viewsErr) portalViews30d = count ?? 0;
    }

    const members = await countAgencyMembers(supabase, ctx.agency.id, ctx.agency.owner_id);
    const pendingInvites = await countPendingAgencyInvites(supabase, ctx.agency.id);

    const { count: templateCount } = await supabase
      .from("agency_templates")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", ctx.agency.id)
      .eq("is_active", true);

    return NextResponse.json({
      trips: trips.length,
      publishedPortals,
      portalViews30d,
      members,
      maxMembers: ctx.agency.max_members,
      pendingInvites,
      templates: templateCount ?? 0,
      commercialNote: "Acuerdo comercial personalizado con Kaviro.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
