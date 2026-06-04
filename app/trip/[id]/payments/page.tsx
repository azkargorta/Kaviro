import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadTripWorkspaceMeta } from "@/lib/load-trip-workspace";
import TripBoardPageHeader from "@/components/layout/TripBoardPageHeader";
import TripScreenActions from "@/components/trip/common/TripScreenActions";
import AgencyTripPaymentsSection from "@/components/agency/AgencyTripPaymentsSection";

type Props = { params: { id: string } };

export default async function TripPaymentsPage({ params }: Props) {
  const tripId = params.id;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const workspace = await loadTripWorkspaceMeta(supabase, tripId, user.id);
  if (!workspace.isAgencyTrip) redirect(`/trip/${tripId}/plan`);

  const { data: trip } = await supabase.from("trips").select("name").eq("id", tripId).maybeSingle();
  if (!trip) notFound();

  return (
    <main className="w-full min-w-0 max-w-full space-y-5 md:space-y-6">
      <TripBoardPageHeader
        section="Pagos"
        title={(trip as { name: string }).name}
        description="Estado de cobros, vencimientos y enlaces Stripe por viajero"
        iconKey="payments"
        iconAlt="Pagos"
        actions={<TripScreenActions tripId={tripId} homeLabel="Mis viajes" />}
      />
      <AgencyTripPaymentsSection tripId={tripId} showEmailHint />
    </main>
  );
}
