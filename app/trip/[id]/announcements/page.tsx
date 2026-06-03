import { redirect } from "next/navigation";
import { getCachedTripAccess } from "@/lib/trip-access";
import { createClient } from "@/lib/supabase/server";
import TripAnnouncementsView from "@/components/trip/announcements/TripAnnouncementsView";

type PageProps = { params: { id: string } };

export default async function TripAnnouncementsPage({ params }: PageProps) {
  await getCachedTripAccess(params.id);

  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("agency_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!(trip as { agency_id?: string | null } | null)?.agency_id) {
    redirect(`/trip/${params.id}/summary`);
  }

  return <TripAnnouncementsView tripId={params.id} />;
}
