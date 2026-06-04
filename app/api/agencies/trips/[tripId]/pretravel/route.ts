import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import { pretravelPublicPath } from "@/lib/agency/pretravel-defaults";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { ensurePretravelSurvey, syncPretravelTokensForTrip } from "@/lib/server/pretravel";

type Params = { params: { tripId: string } };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const { data: survey, error: sErr } = await gate.supabase
    .from("agency_trip_pretravel_surveys")
    .select("is_active, send_days_before")
    .eq("trip_id", params.tripId)
    .maybeSingle();

  if (sErr?.message.includes("agency_trip_pretravel")) {
    return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_pretravel_survey.sql" });
  }

  const { data: fields, error: fErr } = await gate.supabase
    .from("agency_pretravel_survey_fields")
    .select("id, field_key, label, field_type, required, options, sort_order, is_enabled")
    .eq("trip_id", params.tripId)
    .order("sort_order", { ascending: true });

  if (fErr) {
    return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_pretravel_survey.sql" });
  }

  const { data: responses } = await gate.supabase
    .from("agency_pretravel_responses")
    .select("id, participant_id, token, submitted_at, answers")
    .eq("trip_id", params.tripId);

  const { data: participants } = await gate.supabase
    .from("trip_participants")
    .select("id, display_name, email")
    .eq("trip_id", params.tripId)
    .eq("role", "viewer")
    .neq("status", "removed");

  const byParticipant = new Map(
    (responses ?? []).map((r) => [
      r.participant_id as string,
      {
        id: r.id,
        token: r.token,
        submittedAt: r.submitted_at,
        publicUrl: pretravelPublicPath(r.token as string),
        answers: r.answers,
      },
    ])
  );

  const roster = (participants ?? []).map((p) => {
    const resp = byParticipant.get(p.id as string);
    return {
      participantId: p.id,
      displayName: p.display_name,
      email: p.email,
      submitted: Boolean(resp?.submittedAt),
      publicUrl: resp?.publicUrl ?? null,
      responseId: resp?.id ?? null,
    };
  });

  const submitted = roster.filter((r) => r.submitted).length;

  return NextResponse.json({
    survey: survey ?? null,
    fields: fields ?? [],
    roster,
    progress: { submitted, total: roster.length },
    enabled: Boolean(survey?.is_active),
  });
}

export async function POST(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const action = body?.action as string;

  const admin = createSupabaseAdmin();

  try {
    if (action === "setup") {
      await ensurePretravelSurvey(admin, params.tripId, gate.ctx.agency.id);
      const sync = await syncPretravelTokensForTrip(admin, params.tripId);
      return NextResponse.json({ ok: true, tokensCreated: sync.created });
    }

    if (action === "syncTokens") {
      const sync = await syncPretravelTokensForTrip(admin, params.tripId);
      return NextResponse.json({ ok: true, tokensCreated: sync.created });
    }

    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("agency_pretravel") || msg.includes("agency_trip_pretravel")) {
      return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_pretravel_survey.sql" });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));

  if (typeof body?.isActive === "boolean") {
    const admin = createSupabaseAdmin();
    await ensurePretravelSurvey(admin, params.tripId, gate.ctx.agency.id);
    const { error } = await gate.supabase
      .from("agency_trip_pretravel_surveys")
      .update({ is_active: body.isActive, updated_at: new Date().toISOString() })
      .eq("trip_id", params.tripId);
    if (error) {
      return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_pretravel_survey.sql" });
    }
  }

  if (body?.sendDaysBefore !== undefined) {
    const n = body.sendDaysBefore === null ? null : Number(body.sendDaysBefore);
    if (n !== null && (!Number.isFinite(n) || n < 1 || n > 90)) {
      return NextResponse.json({ error: "Días antes del viaje: 1-90 o null." }, { status: 400 });
    }
    await gate.supabase
      .from("agency_trip_pretravel_surveys")
      .update({ send_days_before: n, updated_at: new Date().toISOString() })
      .eq("trip_id", params.tripId);
  }

  return GET(_req, { params });
}
