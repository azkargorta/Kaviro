"use client";

import TripPageHelp from "@/components/trip/common/TripPageHelp";
import TripActivityFeedButton from "@/components/trip/common/TripActivityFeedButton";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import LoggedInHeaderActions from "@/components/layout/LoggedInHeaderActions";

export default function TripHeroActions({ tripId }: { tripId: string }) {
  return (
    <div className="flex items-center gap-0.5">
      <TripPageHelp />
      <span data-tour="topbar-novedades">
        <TripActivityFeedButton tripId={tripId} />
      </span>
      <span data-tour="topbar-darkmode">
        <DarkModeToggle />
      </span>
      <LoggedInHeaderActions showNotifications={false} />
    </div>
  );
}
