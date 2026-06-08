import TripShareButton from "@/components/trip/common/TripShareButton";
import ShareTodayPlanButton from "@/components/trip/common/ShareTodayPlanButton";
import TripMisViajesLink from "@/components/trip/common/TripMisViajesLink";
import TripHeroMobileShareSheet from "@/components/trip/common/TripHeroMobileShareSheet";

type Props = {
  tripId: string;
  tripName: string;
  destination?: string | null;
};

export default function TripHeroShareBar({ tripId, tripName, destination }: Props) {
  return (
    <>
      <TripHeroMobileShareSheet tripId={tripId} tripName={tripName} destination={destination} />

      <div className="hidden md:flex items-center justify-between gap-2 border-t border-white/20 px-4 pb-3 pt-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <TripShareButton tripId={tripId} hero />
          <ShareTodayPlanButton tripId={tripId} tripName={tripName} destination={destination} hero />
        </div>
        <TripMisViajesLink variant="hero" tour />
      </div>
    </>
  );
}
