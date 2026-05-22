import TripResourcesView from "@/components/trip/resources/TripResourcesView";
import TripScreenActions from "@/components/trip/common/TripScreenActions";
import TripBoardPageHeader from "@/components/layout/TripBoardPageHeader";
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
  const isPremium = await getCachedTripPremium(tripId, access.userId);

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

      <TripResourcesView tripId={tripId} isPremium={isPremium} canManageResources={access.can_manage_resources} />
    </main>
  );
}
