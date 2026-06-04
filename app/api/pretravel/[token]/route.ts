import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { agencyBrandingFromRow, type AgencyRow } from "@/lib/agency";

type Params = { params: { token: string } };

export async function GET(_req: Request, { params }: Params) {
  const token = params.token?.trim();
  if (!token) return NextResponse.json({ error: "Token inválido." }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: row, error } = await admin
    .from("agency_pretravel_responses")
    .select("id, trip_id, participant_id, answers, submitted_at")
    .eq("token", token)
    .maybeSingle();

  if (error?.message.includes("agency_pretravel")) {
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  }
  if (!row) return NextResponse.json({ error: "Enlace no válido." }, { status: 404 });

  const { data: survey } = await admin
    .from("agency_trip_pretravel_surveys")
    .select("is_active")
    .eq("trip_id", row.trip_id)
    .maybeSingle();

  if (!survey?.is_active) {
    return NextResponse.json({ error: "Esta encuesta no está activa." }, { status: 403 });
  }

  const [{ data: trip }, { data: participant }, { data: fields }] = await Promise.all([
    admin.from("trips").select("name, start_date, agency_id").eq("id", row.trip_id).maybeSingle(),
    admin
      .from("trip_participants")
      .select("display_name")
      .eq("id", row.participant_id)
      .maybeSingle(),
    admin
      .from("agency_pretravel_survey_fields")
      .select("field_key, label, field_type, required, options, sort_order")
      .eq("trip_id", row.trip_id)
      .eq("is_enabled", true)
      .order("sort_order", { ascending: true }),
  ]);

  let branding = agencyBrandingFromRow({
    name: "Tu agencia",
    logo_url: null,
    brand_color: "#1e3a5f",
    contact_email: null,
  } as AgencyRow);

  if (trip?.agency_id) {
    const { data: agency } = await admin
      .from("agencies")
      .select("name, logo_url, brand_color, contact_email, slug, owner_id, plan, max_members")
      .eq("id", trip.agency_id)
      .maybeSingle();
    if (agency) branding = agencyBrandingFromRow(agency as AgencyRow);
  }

  return NextResponse.json({
    tripName: trip?.name ?? "Viaje",
    travelerName: participant?.display_name ?? "Viajero",
    fields: fields ?? [],
    answers: row.answers ?? {},
    submitted: Boolean(row.submitted_at),
    branding,
  });
}

export async function POST(req: Request, { params }: Params) {
  const token = params.token?.trim();
  if (!token) return NextResponse.json({ error: "Token inválido." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const answers = body?.answers;
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Respuestas inválidas." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: row } = await admin
    .from("agency_pretravel_responses")
    .select("id, trip_id, submitted_at")
    .eq("token", token)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Enlace no válido." }, { status: 404 });

  const { data: fields } = await admin
    .from("agency_pretravel_survey_fields")
    .select("field_key, required")
    .eq("trip_id", row.trip_id)
    .eq("is_enabled", true);

  const sanitized: Record<string, string> = {};
  for (const f of fields ?? []) {
    const key = f.field_key as string;
    const val = String((answers as Record<string, unknown>)[key] ?? "").trim();
    if (f.required && !val) {
      return NextResponse.json({ error: `Falta el campo obligatorio: ${key}` }, { status: 400 });
    }
    if (val) sanitized[key] = val.slice(0, 2000);
  }

  const { error } = await admin
    .from("agency_pretravel_responses")
    .update({
      answers: sanitized,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("token", token);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
