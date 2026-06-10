import TripHeroMobileShareSheet from "@/components/trip/common/TripHeroMobileShareSheet";

type Props = {
  tripId: string;
  tripName: string;
  destination?: string | null;
};

// La fila desktop se reemplazó por el dropdown TripHeroShareDropdown en TripHeroCard.
// Este componente mantiene solo el sheet de compartir en móvil.
export default function TripHeroShareBar({ tripId, tripName, destination }: Props) {
  return (
    <TripHeroMobileShareSheet tripId={tripId} tripName={tripName} destination={destination} />
  );
}
