import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RecapPage from "@/components/trip/recap/RecapPage";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TripRecapServerPage({ params }: Props) {
  const { id: tripId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Verify access
  const { data: participant } = await supabase
    .from("trip_participants")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .neq("status", "removed")
    .maybeSingle();

  if (!participant) notFound();

  // Fetch trip data
  const { data: trip } = await supabase
    .from("trips")
    .select("id, name, destination, start_date, end_date")
    .eq("id", tripId)
    .maybeSingle();

  if (!trip) notFound();

  // Activity count
  const { count: activitiesCount } = await supabase
    .from("trip_activities")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", tripId);

  // Participant count
  const { count: participantsCount } = await supabase
    .from("trip_participants")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", tripId)
    .neq("status", "removed");

  return (
    <RecapPage
      tripId={tripId}
      tripName={(trip as { name: string }).name}
      destination={(trip as { destination: string | null }).destination}
      startDate={(trip as { start_date: string | null }).start_date}
      endDate={(trip as { end_date: string | null }).end_date}
      activitiesCount={activitiesCount ?? 0}
      participantsCount={participantsCount ?? 0}
    />
  );
}
