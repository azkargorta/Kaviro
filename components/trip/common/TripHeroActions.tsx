"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TripPageHelp from "@/components/trip/common/TripPageHelp";
import TripActivityFeedButton from "@/components/trip/common/TripActivityFeedButton";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

export default function TripHeroActions({ tripId }: { tripId: string }) {
  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-1">
      {/* Back to dashboard */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white/80 transition hover:bg-white/15 hover:text-white"
        data-tour="topbar-mis-viajes"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Mis viajes
      </Link>

      {/* Utility actions */}
      <div className="flex items-center gap-0.5">
        {/* Wrap each action to apply white-tinted override */}
        <span className="[&_button]:text-white/80 [&_button:hover]:text-white [&_button:hover]:bg-white/15 [&_button]:rounded-full">
          <TripPageHelp />
        </span>
        <span data-tour="topbar-novedades" className="[&_button]:text-white/80 [&_button:hover]:text-white [&_button:hover]:bg-white/15 [&_button]:rounded-full">
          <TripActivityFeedButton tripId={tripId} />
        </span>
        <span data-tour="topbar-darkmode" className="[&_button]:text-white/80 [&_button:hover]:text-white [&_button:hover]:bg-white/15 [&_button]:rounded-full">
          <DarkModeToggle />
        </span>
      </div>
    </div>
  );
}
