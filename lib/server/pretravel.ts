import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { DEFAULT_PRETRAVEL_FIELDS, generatePretravelToken } from "@/lib/agency/pretravel-defaults";

export async function ensurePretravelSurvey(
  admin: ReturnType<typeof createSupabaseAdmin>,
  tripId: string,
  agencyId: string
) {
  const { data: existing } = await admin
    .from("agency_trip_pretravel_surveys")
    .select("trip_id")
    .eq("trip_id", tripId)
    .maybeSingle();

  if (existing) return;

  await admin.from("agency_trip_pretravel_surveys").insert({
    trip_id: tripId,
    agency_id: agencyId,
    is_active: true,
    send_days_before: 14,
  });

  const { count } = await admin
    .from("agency_pretravel_survey_fields")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId);

  if ((count ?? 0) > 0) return;

  await admin.from("agency_pretravel_survey_fields").insert(
    DEFAULT_PRETRAVEL_FIELDS.map((f) => ({
      trip_id: tripId,
      field_key: f.field_key,
      label: f.label,
      field_type: f.field_type,
      required: f.required,
      options: f.options ?? null,
      sort_order: f.sort_order,
      is_enabled: true,
    }))
  );
}

/** Crea tokens de respuesta para viajeros (role viewer) que aún no tienen. */
export async function syncPretravelTokensForTrip(
  admin: ReturnType<typeof createSupabaseAdmin>,
  tripId: string
) {
  const { data: viewers } = await admin
    .from("trip_participants")
    .select("id")
    .eq("trip_id", tripId)
    .eq("role", "viewer")
    .neq("status", "removed");

  if (!viewers?.length) return { created: 0 };

  const { data: existing } = await admin
    .from("agency_pretravel_responses")
    .select("participant_id")
    .eq("trip_id", tripId);

  const have = new Set((existing ?? []).map((r) => r.participant_id as string));
  const toCreate = viewers.filter((v) => !have.has(v.id as string));

  if (!toCreate.length) return { created: 0 };

  await admin.from("agency_pretravel_responses").insert(
    toCreate.map((v) => ({
      trip_id: tripId,
      participant_id: v.id,
      token: generatePretravelToken(),
    }))
  );

  return { created: toCreate.length };
}
