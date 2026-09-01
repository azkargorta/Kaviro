import TripParticipantsView from "@/components/trip/participants/TripParticipantsView";
import TripEmptyModuleGuide from "@/components/trip/onboarding/TripEmptyModuleGuide";
import { getCachedTripAccess } from "@/lib/trip-access";
import { createClient } from "@/lib/supabase/server";

type ParticipantsPageProps = {
  params: {
    id: string;
  };
};

export default async function ParticipantsPage({ params }: ParticipantsPageProps) {
  const access = await getCachedTripAccess(params.id);
  const supabase = await createClient();
  const { count } = await supabase
    .from("trip_participants")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", params.id)
    .neq("status", "removed");

  const onlyOrganizer = (count ?? 0) <= 1;

  return (
    <div className="space-y-5 md:space-y-6">
      {onlyOrganizer && access.can_manage_participants ? (
        <TripEmptyModuleGuide
          icon="👥"
          title="Añade a la primera persona del viaje"
          description="Invita a tu pareja, amigos o familia para que el viaje deje de depender de una sola persona y todos consulten la misma información."
          primaryHref={`/trip/${encodeURIComponent(params.id)}/participants#participants-workspace`}
          primaryLabel="Ir a invitar a alguien"
          secondaryText="Puedes añadir su nombre primero y enviarle el enlace por WhatsApp cuando quieras."
        />
      ) : null}

      <section id="participants-workspace" className="scroll-mt-24">
        <TripParticipantsView tripId={params.id} />
      </section>
    </div>
  );
}
