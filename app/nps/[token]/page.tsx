import { notFound } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { agencyBrandingFromRow, type AgencyRow } from "@/lib/agency";
import NpsPublicForm from "@/components/nps/NpsPublicForm";

type Props = { params: { token: string } };

export default async function NpsPublicPage({ params }: Props) {
  const admin = createSupabaseAdmin();
  const { data: row } = await admin
    .from("agency_nps_responses")
    .select("trip_id, traveler_label, submitted_at")
    .eq("token", params.token)
    .maybeSingle();

  if (!row) notFound();
  if (row.submitted_at) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4">
        <p className="text-sm text-slate-600">Ya has enviado tu valoración. ¡Gracias!</p>
      </main>
    );
  }

  const { data: trip } = await admin.from("trips").select("name, agency_id").eq("id", row.trip_id).maybeSingle();
  let branding = agencyBrandingFromRow({ name: "Agencia", logo_url: null, brand_color: "#1e3a5f", contact_email: null } as AgencyRow);
  if (trip?.agency_id) {
    const { data: agency } = await admin
      .from("agencies")
      .select("name, logo_url, brand_color, contact_email, slug, owner_id, plan, max_members")
      .eq("id", trip.agency_id)
      .maybeSingle();
    if (agency) branding = agencyBrandingFromRow(agency as AgencyRow);
  }

  return (
    <main className="min-h-[100dvh] bg-slate-100 px-4 py-10">
      <NpsPublicForm
        token={params.token}
        tripName={trip?.name ?? "Viaje"}
        travelerLabel={(row.traveler_label as string) || "Viajero"}
        branding={branding}
      />
    </main>
  );
}
