import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  DEFAULT_SIGNATURE_BODY,
  generateSignatureToken,
  type SignatureDocumentType,
} from "@/lib/agency/signatures";

export async function syncAgencySignatureRequests(tripId: string, agencyId: string) {
  const admin = createSupabaseAdmin();

  const { data: viewers } = await admin
    .from("trip_participants")
    .select("id, display_name")
    .eq("trip_id", tripId)
    .eq("role", "viewer")
    .neq("status", "removed");

  const { data: existing } = await admin
    .from("agency_signature_requests")
    .select("participant_id")
    .eq("trip_id", tripId);

  const have = new Set((existing ?? []).map((r) => r.participant_id).filter(Boolean));
  const toCreate = (viewers ?? []).filter((v) => !have.has(v.id as string));

  if (!toCreate.length) return { created: 0 };

  await admin.from("agency_signature_requests").insert(
    toCreate.map((v) => ({
      trip_id: tripId,
      agency_id: agencyId,
      participant_id: v.id,
      traveler_label: v.display_name,
      token: generateSignatureToken(),
    }))
  );

  return { created: toCreate.length };
}

export async function ensureSignaturePack(
  tripId: string,
  agencyId: string,
  opts?: { documentType?: SignatureDocumentType; title?: string; bodyText?: string }
) {
  const admin = createSupabaseAdmin();
  const docType = opts?.documentType ?? "contract";

  const { data: existing } = await admin
    .from("agency_trip_signature_packs")
    .select("trip_id")
    .eq("trip_id", tripId)
    .maybeSingle();

  if (existing) return { created: false };

  await admin.from("agency_trip_signature_packs").insert({
    trip_id: tripId,
    agency_id: agencyId,
    title: opts?.title ?? "Contrato de viaje",
    document_type: docType,
    body_text: opts?.bodyText ?? DEFAULT_SIGNATURE_BODY[docType],
    is_active: false,
  });

  return { created: true };
}
