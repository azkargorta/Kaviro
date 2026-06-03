import { NextResponse } from "next/server";
import { copyTemplateSourceIntoTrip } from "@/lib/trips/duplicateTrip";
import { parseTripTemplateIncludes } from "@/lib/trips/template-includes";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  req: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await context.params;
    const gate = await requireAgencyTripAccess(tripId);
    if ("error" in gate && gate.error) return gate.error;

    const { user, ctx } = gate;
    const body = await req.json().catch(() => null);
    const templateId = typeof body?.template_id === "string" ? body.template_id.trim() : "";
    if (!templateId) {
      return NextResponse.json({ error: "Falta template_id." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: template, error: tplErr } = await supabase
      .from("agency_templates")
      .select("id, source_trip_id, agency_id, is_active, includes")
      .eq("id", templateId)
      .eq("agency_id", ctx.agency.id)
      .eq("is_active", true)
      .maybeSingle();

    if (tplErr) throw new Error(tplErr.message);
    if (!template) {
      return NextResponse.json({ error: "Plantilla no encontrada." }, { status: 404 });
    }

    const includes = parseTripTemplateIncludes(
      (template as { includes?: unknown }).includes
    );

    const result = await copyTemplateSourceIntoTrip(
      supabase,
      user,
      tripId,
      template.source_trip_id,
      includes
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      tripId,
      templateId,
      copied: result.stats,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
