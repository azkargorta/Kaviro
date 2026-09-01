import TripResourcesView from "@/components/trip/resources/TripResourcesView";
import TripScreenActions from "@/components/trip/common/TripScreenActions";
import TripBoardPageHeader from "@/components/layout/TripBoardPageHeader";
import TripEmptyModuleGuide from "@/components/trip/onboarding/TripEmptyModuleGuide";
import { getCachedTripAccess } from "@/lib/trip-access";
import { createClient } from "@/lib/supabase/server";
import { getCachedTripPremium } from "@/lib/entitlements";

export default async function TripResourcesPage({
  params,
}: {
  params: { id: string };
}) {
  const tripId = params.id;

  // Nota: esta página NO está gated por premium, pero usamos el flag para habilitar el asistente personal si el viaje lo permite.
  // (Si no, el endpoint del asistente también lo rechazará.)
  const access = await getCachedTripAccess(tripId);
  const supabase = await createClient();
  const [isPremium, { count: resourcesCount }] = await Promise.all([
    getCachedTripPremium(tripId, access.userId),
    supabase
      .from("trip_resources")
      .select("id", { count: "exact", head: true })
      .eq("trip_id", tripId),
  ]);

  return (
    <main className="space-y-6">
      <TripBoardPageHeader
        section="Recursos y reservas"
        title="Documentos del viaje"
        description="Adjunta PDFs o imágenes de reservas, guarda alojamientos y analiza documentos para rellenar formularios automáticamente."
        iconKey="resources"
        iconAlt="Recursos"
        actions={<TripScreenActions tripId={tripId} />}
      />

      {(resourcesCount ?? 0) === 0 && access.can_manage_resources ? (
        <TripEmptyModuleGuide
          icon="📎"
          title="Guarda el primer documento del viaje"
          description="Empieza por algo que ya tengas: una reserva de hotel, un billete, una entrada o cualquier PDF o imagen que no quieras buscar después entre emails y WhatsApp."
          primaryHref={`/trip/${encodeURIComponent(tripId)}/resources#resources-workspace`}
          primaryLabel="Ir a adjuntar documento"
          secondaryText="Más adelante puedes usar el analizador con IA o crear reservas manuales. Para empezar, basta con guardar un documento."
        />
      ) : null}

      <section id="resources-workspace" className="scroll-mt-24">
        <TripResourcesView tripId={tripId} isPremium={isPremium} canManageResources={access.can_manage_resources} />
      </section>
    </main>
  );
}
