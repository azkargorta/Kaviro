import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";
import { duplicateTripForUser } from "@/lib/trips/duplicateTrip";
import { slugifyForUrl } from "@/lib/agency-slug";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: templateId } = await context.params;
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

    const { data: template, error: tplErr } = await supabase
      .from("agency_templates")
      .select("id, source_trip_id, agency_id, is_active")
      .eq("id", templateId)
      .eq("agency_id", ctx.agency.id)
      .eq("is_active", true)
      .maybeSingle();

    if (tplErr) throw new Error(tplErr.message);
    if (!template) {
      return NextResponse.json({ error: "Plantilla no encontrada." }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const destination = typeof body?.destination === "string" ? body.destination.trim() : "";
    const start_date = typeof body?.start_date === "string" ? body.start_date : null;
    const end_date = typeof body?.end_date === "string" ? body.end_date : null;
    const portalSlugRaw = typeof body?.client_portal_slug === "string" ? body.client_portal_slug : "";

    if (!name) {
      return NextResponse.json({ error: "El nombre del nuevo viaje es obligatorio." }, { status: 400 });
    }

    if (start_date && end_date && start_date > end_date) {
      return NextResponse.json(
        { error: "La fecha de fin debe ser igual o posterior a la fecha de inicio." },
        { status: 400 }
      );
    }

    const client_portal_slug = slugifyForUrl(portalSlugRaw || name);

    const dup = await duplicateTripForUser(supabase, user, template.source_trip_id, {
      customName: name,
      resetDates: false,
      agencyId: ctx.agency.id,
      clientPortalSlug: client_portal_slug,
    });

    if (!dup.ok) {
      return NextResponse.json({ error: dup.error }, { status: dup.status });
    }

    if (destination || start_date || end_date) {
      await supabase
        .from("trips")
        .update({
          ...(destination ? { destination } : {}),
          ...(start_date ? { start_date } : {}),
          ...(end_date ? { end_date } : {}),
        })
        .eq("id", dup.tripId);
    }

    try {
      await supabase.from("agency_client_portals").upsert(
        {
          trip_id: dup.tripId,
          agency_id: ctx.agency.id,
          slug: client_portal_slug,
          is_active: true,
          last_published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "trip_id" }
      );
    } catch {
      /* migración opcional */
    }

    return NextResponse.json(
      { tripId: dup.tripId, clientPortalSlug: client_portal_slug },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
