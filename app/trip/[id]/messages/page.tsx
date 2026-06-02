import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TripBoardPageHeader from "@/components/layout/TripBoardPageHeader";
import TripScreenActions from "@/components/trip/common/TripScreenActions";
import TripGroupChat from "@/components/trip/messages/TripGroupChat";

type Props = { params: { id: string } };

export default async function TripMessagesPage({ params }: Props) {
  const tripId = params.id;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: participant } = await supabase
    .from("trip_participants")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .neq("status", "removed")
    .maybeSingle();

  if (!participant) notFound();

  const { data: trip } = await supabase.from("trips").select("name").eq("id", tripId).maybeSingle();
  if (!trip) notFound();

  return (
    <main className="w-full min-w-0 max-w-full space-y-5 md:space-y-6">
      <TripBoardPageHeader
        section="Grupo"
        title={(trip as { name: string }).name}
        description="Chat entre participantes"
        iconKey="participants"
        iconAlt="Mensajes"
        actions={<TripScreenActions tripId={tripId} homeLabel="Mis viajes" />}
      />
      <TripGroupChat tripId={tripId} currentUserId={user.id} />
    </main>
  );
}
