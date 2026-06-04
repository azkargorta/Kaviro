import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import {
  isSignatureDocumentType,
  signPublicPath,
  signatureProgress,
  SIGNATURE_TYPE_LABELS,
} from "@/lib/agency/signatures";
import { ensureSignaturePack, syncAgencySignatureRequests } from "@/lib/server/agency-signatures";

type Params = { params: { tripId: string } };

function migration() {
  return NextResponse.json({ needsMigration: true, migration: "kaviro_agency_signatures.sql" });
}

function isMigration(msg: string) {
  return msg.includes("agency_signature") || msg.includes("agency_trip_signature");
}

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const { data: pack, error: pErr } = await gate.supabase
    .from("agency_trip_signature_packs")
    .select("title, document_type, body_text, is_active, updated_at")
    .eq("trip_id", params.tripId)
    .maybeSingle();

  if (pErr && isMigration(pErr.message)) return migration();

  const { data: requests, error: rErr } = await gate.supabase
    .from("agency_signature_requests")
    .select("id, participant_id, traveler_label, token, signer_name, signer_email, signed_at")
    .eq("trip_id", params.tripId)
    .order("created_at", { ascending: true });

  if (rErr && isMigration(rErr.message)) return migration();

  const progress = signatureProgress(
    (requests ?? []).map((r) => ({ signed_at: r.signed_at as string | null }))
  );

  return NextResponse.json({
    pack: pack
      ? {
          title: pack.title,
          documentType: pack.document_type,
          documentTypeLabel: SIGNATURE_TYPE_LABELS[pack.document_type as keyof typeof SIGNATURE_TYPE_LABELS],
          bodyText: pack.body_text,
          isActive: pack.is_active,
          updatedAt: pack.updated_at,
        }
      : null,
    requests: (requests ?? []).map((r) => ({
      id: r.id,
      participantId: r.participant_id,
      travelerLabel: r.traveler_label,
      signerName: r.signer_name,
      signerEmail: r.signer_email,
      signedAt: r.signed_at,
      publicUrl: r.token && !r.signed_at ? signPublicPath(r.token as string) : null,
    })),
    progress,
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));

  try {
    await ensureSignaturePack(params.tripId, gate.ctx.agency.id, {
      documentType: isSignatureDocumentType(body?.documentType) ? body.documentType : undefined,
      title: typeof body?.title === "string" ? body.title : undefined,
      bodyText: typeof body?.bodyText === "string" ? body.bodyText : undefined,
    });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body?.title === "string" && body.title.trim()) patch.title = body.title.trim();
    if (typeof body?.bodyText === "string") patch.body_text = body.bodyText;
    if (isSignatureDocumentType(body?.documentType)) patch.document_type = body.documentType;
    if (typeof body?.isActive === "boolean") patch.is_active = body.isActive;

    const { error } = await gate.supabase
      .from("agency_trip_signature_packs")
      .update(patch)
      .eq("trip_id", params.tripId);

    if (error) {
      if (isMigration(error.message)) return migration();
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return GET(req, { params });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (isMigration(msg)) return migration();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));

  try {
    if (body?.action === "setup") {
      await ensureSignaturePack(params.tripId, gate.ctx.agency.id, {
        documentType: isSignatureDocumentType(body?.documentType) ? body.documentType : "contract",
        title: typeof body?.title === "string" ? body.title : undefined,
        bodyText: typeof body?.bodyText === "string" ? body.bodyText : undefined,
      });
      if (body?.activate === true) {
        await gate.supabase
          .from("agency_trip_signature_packs")
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq("trip_id", params.tripId);
      }
    }

    const sync = await syncAgencySignatureRequests(params.tripId, gate.ctx.agency.id);
    return NextResponse.json(sync);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (isMigration(msg)) return migration();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
