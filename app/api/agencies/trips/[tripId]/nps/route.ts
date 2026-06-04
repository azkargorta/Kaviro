import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { generatePretravelToken } from "@/lib/agency/pretravel-defaults";

type Params = { params: { tripId: string } };

function npsPath(token: string) {
  return `/nps/${token}`;
}

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const { data: config } = await gate.supabase
    .from("agency_trip_nps")
    .select("is_active")
    .eq("trip_id", params.tripId)
    .maybeSingle();

  const { data: responses, error } = await gate.supabase
    .from("agency_nps_responses")
    .select("id, traveler_label, token, nps_score, submitted_at, allow_testimonial, comment")
    .eq("trip_id", params.tripId)
    .order("created_at", { ascending: true });

  if (error?.message.includes("agency_nps")) {
    return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_nps.sql" });
  }

  const submitted = (responses ?? []).filter((r) => r.submitted_at);
  const scores = submitted.map((r) => Number(r.nps_score)).filter((n) => !Number.isNaN(n));
  const avgNps = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;

  return NextResponse.json({
    enabled: Boolean(config?.is_active),
    responses: (responses ?? []).map((r) => ({
      ...r,
      publicUrl: r.token ? npsPath(r.token as string) : null,
    })),
    progress: { submitted: submitted.length, total: responses?.length ?? 0 },
    avgNps,
  });
}

export async function POST(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const admin = createSupabaseAdmin();

  try {
    await admin.from("agency_trip_nps").upsert({
      trip_id: params.tripId,
      agency_id: gate.ctx.agency.id,
      is_active: true,
    });

    const { data: viewers } = await admin
      .from("trip_participants")
      .select("id, display_name")
      .eq("trip_id", params.tripId)
      .eq("role", "viewer")
      .neq("status", "removed");

    const { data: existing } = await admin
      .from("agency_nps_responses")
      .select("participant_id")
      .eq("trip_id", params.tripId);

    const have = new Set((existing ?? []).map((r) => r.participant_id).filter(Boolean));
    const toCreate = (viewers ?? []).filter((v) => !have.has(v.id));

    if (toCreate.length) {
      await admin.from("agency_nps_responses").insert(
        toCreate.map((v) => ({
          trip_id: params.tripId,
          participant_id: v.id,
          traveler_label: v.display_name,
          token: generatePretravelToken(),
        }))
      );
    }

    if (body?.action === "addAnonymous") {
      await admin.from("agency_nps_responses").insert({
        trip_id: params.tripId,
        traveler_label: typeof body?.label === "string" ? body.label.trim() : "Viajero",
        token: generatePretravelToken(),
      });
    }

    return GET(req, { params });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("agency_nps")) {
      return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_nps.sql" });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
