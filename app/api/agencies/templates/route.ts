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

    const { data, error } = await supabase
      .from("agency_templates")
      .select(
        "id, name, description, category, is_active, created_at, source_trip_id, trips:source_trip_id ( id, name, destination )"
      )
      .eq("agency_id", ctx.agency.id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ templates: data ?? [] });
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
    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const ctx = await getAgencyForUser(supabase, user.id);
    if (!ctx) {
      return NextResponse.json({ error: "Sin agencia." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const source_trip_id = typeof body?.source_trip_id === "string" ? body.source_trip_id : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description.trim() || null : null;
    const category = typeof body?.category === "string" ? body.category.trim() || null : null;

    if (!source_trip_id || !name) {
      return NextResponse.json(
        { error: "Viaje origen y nombre de plantilla son obligatorios." },
        { status: 400 }
      );
    }

    const { data: trip } = await supabase
      .from("trips")
      .select("id, agency_id")
      .eq("id", source_trip_id)
      .maybeSingle();

    if (!trip || trip.agency_id !== ctx.agency.id) {
      return NextResponse.json({ error: "Viaje no válido para esta agencia." }, { status: 400 });
    }

    const { data: row, error } = await supabase
      .from("agency_templates")
      .insert({
        agency_id: ctx.agency.id,
        source_trip_id,
        name,
        description,
        category,
      })
      .select("id, name")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ template: row }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
