"use client";

import TripShareButton from "@/components/trip/common/TripShareButton";
import ShareTodayPlanButton from "@/components/trip/common/ShareTodayPlanButton";

type Props = {
  tripId: string;
  tripName: string;
  destination?: string | null;
};

export default function TripHeroShareBar({ tripId, tripName, destination }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-white/20 px-4 pb-3 pt-2">
      <TripShareButton tripId={tripId} hero />
      <ShareTodayPlanButton tripId={tripId} tripName={tripName} destination={destination} hero />
    </div>
  );
}
