import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";

type Params = { params: { tripId: string; requestId: string } };

export async function GET(_req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  const { data, error } = await gate.supabase
    .from("agency_signature_requests")
    .select("signer_name, signer_email, signed_at, signature_data_url, consent_accepted")
    .eq("id", params.requestId)
    .eq("trip_id", params.tripId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Solicitud no encontrada." }, { status: 404 });
  }

  if (!data.signed_at) {
    return NextResponse.json({ error: "Aún no firmado." }, { status: 404 });
  }

  return NextResponse.json({
    signerName: data.signer_name,
    signerEmail: data.signer_email,
    signedAt: data.signed_at,
    consentAccepted: data.consent_accepted,
    signatureDataUrl: data.signature_data_url,
  });
}
