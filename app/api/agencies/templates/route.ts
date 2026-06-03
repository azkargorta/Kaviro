import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";
import {
  normalizeTripTemplateIncludes,
  parseTripTemplateIncludes,
} from "@/lib/trips/template-includes";

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
        "id, name, description, category, is_active, created_at, source_trip_id, includes, trips:source_trip_id ( id, name, destination )"
      )
      .eq("agency_id", ctx.agency.id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);

    const templates = (data ?? []).map((row) => ({
      ...row,
      includes: parseTripTemplateIncludes((row as { includes?: unknown }).includes),
    }));

    return NextResponse.json({ templates });
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
    const includes = normalizeTripTemplateIncludes(body?.includes);

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

    const basePayload = {
      agency_id: ctx.agency.id,
      source_trip_id,
      name,
      description,
      category,
    };

    const withIncludes = await supabase
      .from("agency_templates")
      .insert({ ...basePayload, includes })
      .select("id, name, includes")
      .single();

    let row = withIncludes.data;
    let insertError = withIncludes.error;
    let includesColumnMissing = false;

    if (insertError && (insertError.message ?? "").toLowerCase().includes("includes")) {
      includesColumnMissing = true;
      const retry = await supabase.from("agency_templates").insert(basePayload).select("id, name").single();
      row = retry.data;
      insertError = retry.error;
    }

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json(
      {
        template: row,
        warning: includesColumnMissing
          ? "Ejecuta docs/kaviro_agency_template_includes.sql en Supabase para guardar qué bloques incluye la plantilla."
          : undefined,
      },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
