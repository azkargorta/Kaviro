import TripOfflineReader from "@/components/offline/TripOfflineReader";

type Props = { params: { id: string } };

export default function OfflineTripPage({ params }: Props) {
  return <TripOfflineReader tripId={params.id} />;
}
