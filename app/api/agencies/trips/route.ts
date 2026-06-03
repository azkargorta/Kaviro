import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser, isAgencyPlanActive } from "@/lib/agency";
import { createTripWithOwner } from "@/lib/trips/createTripWithOwner";
import { ensureUserCanCreateTrip } from "@/lib/trips/tripCreationLimits";
import { slugifyForUrl } from "@/lib/agency-slug";
import { bootstrapAgencyTripForTravelers } from "@/lib/agency/bootstrap-agency-trip";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No hay sesión activa." }, { status: 401 });
    }

    const ctx = await getAgencyForUser(supabase, user.id);
    if (!ctx) {
      return NextResponse.json({ error: "No perteneces a ninguna agencia." }, { status: 403 });
    }

    if (!isAgencyPlanActive(ctx.agency)) {
      const gate = await ensureUserCanCreateTrip(supabase, user.id);
      if ("error" in gate) {
        return NextResponse.json({ error: gate.error, code: gate.code }, { status: 402 });
      }
    }

    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const destination = typeof body?.destination === "string" ? body.destination.trim() : "";
    const start_date = typeof body?.start_date === "string" ? body.start_date : null;
    const end_date = typeof body?.end_date === "string" ? body.end_date : null;
    const base_currency =
      typeof body?.base_currency === "string" ? body.base_currency.trim().toUpperCase() : "EUR";
    const portalSlugRaw = typeof body?.client_portal_slug === "string" ? body.client_portal_slug : "";
    const agency_client_id =
      typeof body?.agency_client_id === "string" && body.agency_client_id.trim()
        ? body.agency_client_id.trim()
        : null;

    if (!name) {
      return NextResponse.json({ error: "El nombre del viaje es obligatorio." }, { status: 400 });
    }

    if (start_date && end_date && start_date > end_date) {
      return NextResponse.json(
        { error: "La fecha de fin debe ser igual o posterior a la fecha de inicio." },
        { status: 400 }
      );
    }

    const client_portal_slug = slugifyForUrl(portalSlugRaw || name);

    if (agency_client_id) {
      const { data: clientRow } = await supabase
        .from("agency_clients")
        .select("id")
        .eq("id", agency_client_id)
        .eq("agency_id", ctx.agency.id)
        .maybeSingle();
      if (!clientRow) {
        return NextResponse.json({ error: "Cliente no válido." }, { status: 400 });
      }
    }

    const created = await createTripWithOwner(supabase, user, {
      name,
      destination: destination || null,
      start_date,
      end_date,
      base_currency: /^[A-Z]{3}$/.test(base_currency) ? base_currency : "EUR",
      agency_id: ctx.agency.id,
      client_portal_slug,
      agency_client_id,
    });

    if ("error" in created) {
      return NextResponse.json({ error: created.error }, { status: 400 });
    }

    try {
      await bootstrapAgencyTripForTravelers(
        supabase,
        created.tripId,
        ctx.agency.id,
        client_portal_slug
      );
    } catch (e) {
      console.warn("bootstrapAgencyTripForTravelers:", e);
    }

    return NextResponse.json(
      { tripId: created.tripId, clientPortalSlug: client_portal_slug },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo crear el viaje.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
