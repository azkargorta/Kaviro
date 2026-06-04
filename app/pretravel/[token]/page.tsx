import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { agencyBrandingFromRow, type AgencyRow } from "@/lib/agency";
import PretravelPublicForm from "@/components/pretravel/PretravelPublicForm";
import { notFound } from "next/navigation";

type Props = { params: { token: string } };

export default async function PretravelPublicPage({ params }: Props) {
  const admin = createSupabaseAdmin();
  const { data: row } = await admin
    .from("agency_pretravel_responses")
    .select("trip_id, participant_id, answers, submitted_at")
    .eq("token", params.token)
    .maybeSingle();

  if (!row) notFound();

  const [{ data: trip }, { data: participant }, { data: fields }, { data: survey }] = await Promise.all([
    admin.from("trips").select("name, agency_id").eq("id", row.trip_id).maybeSingle(),
    admin.from("trip_participants").select("display_name").eq("id", row.participant_id).maybeSingle(),
    admin
      .from("agency_pretravel_survey_fields")
      .select("field_key, label, field_type, required, options, sort_order")
      .eq("trip_id", row.trip_id)
      .eq("is_enabled", true)
      .order("sort_order", { ascending: true }),
    admin.from("agency_trip_pretravel_surveys").select("is_active").eq("trip_id", row.trip_id).maybeSingle(),
  ]);

  if (!survey?.is_active) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4">
        <p className="text-sm text-slate-600">Esta encuesta no está disponible.</p>
      </main>
    );
  }

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

  const initialAnswers: Record<string, string> = {};
  for (const [k, v] of Object.entries((row.answers ?? {}) as Record<string, unknown>)) {
    initialAnswers[k] = String(v ?? "");
  }

  return (
    <main className="min-h-[100dvh] bg-slate-100 px-4 py-10">
      <PretravelPublicForm
        token={params.token}
        tripName={trip?.name ?? "Viaje"}
        travelerName={participant?.display_name ?? "Viajero"}
        fields={(fields ?? []).map((f) => ({
          ...f,
          options: Array.isArray(f.options) ? (f.options as string[]) : null,
        }))}
        initialAnswers={initialAnswers}
        alreadySubmitted={Boolean(row.submitted_at)}
        brandColor={branding.brandColor}
        agencyName={branding.name}
      />
    </main>
  );
}
