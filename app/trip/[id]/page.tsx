import { redirect } from "next/navigation";
import { getCachedTripAccess } from "@/lib/trip-access";

type TripPageProps = {
  params: {
    id: string;
  };
};

export default async function TripPage({ params }: TripPageProps) {
  const tripId = params.id;
  await getCachedTripAccess(tripId);
  redirect(`/trip/${encodeURIComponent(tripId)}/summary`);
}

