import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { agencyBrandingFromRow, type AgencyRow } from "@/lib/agency";
import { validateSignatureDataUrl } from "@/lib/agency/signatures";

type Params = { params: { token: string } };

export async function GET(_req: Request, { params }: Params) {
  const admin = createSupabaseAdmin();

  const { data: row } = await admin
    .from("agency_signature_requests")
    .select("trip_id, traveler_label, signed_at, signer_name")
    .eq("token", params.token)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Enlace no válido." }, { status: 404 });

  const { data: pack } = await admin
    .from("agency_trip_signature_packs")
    .select("title, body_text, is_active")
    .eq("trip_id", row.trip_id)
    .maybeSingle();

  if (!pack?.is_active) {
    return NextResponse.json({ error: "La firma de documentos no está activa para este viaje." }, { status: 403 });
  }

  const { data: trip } = await admin.from("trips").select("name, agency_id").eq("id", row.trip_id).maybeSingle();

  const { data: agency } = trip?.agency_id
    ? await admin
        .from("agencies")
        .select("name, logo_url, brand_color, contact_email, slug, owner_id, plan, max_members")
        .eq("id", trip.agency_id)
        .maybeSingle()
    : { data: null };

  const branding = agency
    ? agencyBrandingFromRow(agency as AgencyRow)
    : agencyBrandingFromRow({ name: "Agencia", logo_url: null, brand_color: "#1e3a5f", contact_email: null } as AgencyRow);

  return NextResponse.json({
    signed: Boolean(row.signed_at),
    signerName: row.signer_name,
    travelerLabel: row.traveler_label,
    tripName: trip?.name ?? "Viaje",
    document: { title: pack.title, bodyText: pack.body_text },
    branding,
  });
}

export async function POST(req: Request, { params }: Params) {
  const admin = createSupabaseAdmin();
  const body = await req.json().catch(() => ({}));

  const { data: row } = await admin
    .from("agency_signature_requests")
    .select("id, trip_id, signed_at")
    .eq("token", params.token)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Enlace no válido." }, { status: 404 });
  if (row.signed_at) return NextResponse.json({ error: "Este documento ya está firmado." }, { status: 409 });

  const { data: pack } = await admin
    .from("agency_trip_signature_packs")
    .select("is_active")
    .eq("trip_id", row.trip_id)
    .maybeSingle();

  if (!pack?.is_active) {
    return NextResponse.json({ error: "La firma no está activa." }, { status: 403 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!name) return NextResponse.json({ error: "Indica tu nombre completo." }, { status: 400 });
  if (!body?.consent) {
    return NextResponse.json({ error: "Debes aceptar el documento." }, { status: 400 });
  }

  const sigErr = validateSignatureDataUrl(body?.signatureDataUrl);
  if (sigErr) return NextResponse.json({ error: sigErr }, { status: 400 });

  const now = new Date().toISOString();
  const { error } = await admin
    .from("agency_signature_requests")
    .update({
      signer_name: name,
      signer_email: email || null,
      signature_data_url: body.signatureDataUrl,
      consent_accepted: true,
      signed_at: now,
    })
    .eq("id", row.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, signedAt: now });
}
