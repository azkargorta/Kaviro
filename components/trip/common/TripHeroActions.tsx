"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TripPageHelp from "@/components/trip/common/TripPageHelp";
import TripActivityFeedButton from "@/components/trip/common/TripActivityFeedButton";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import LoggedInHeaderActions from "@/components/layout/LoggedInHeaderActions";

export default function TripHeroActions({ tripId }: { tripId: string }) {
  return (
    <div className="flex items-center justify-between px-4 pt-safe-min pb-1 max-md:pl-[max(1rem,var(--safe-area-left))] max-md:pr-[max(1rem,var(--safe-area-right))]">
      <Link
        href="/dashboard"
        data-tour="topbar-mis-viajes"
        className="inline-flex max-w-[42vw] items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/30 sm:max-w-none sm:gap-1.5 sm:px-3 sm:text-[12px]"
      >
        <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Mis viajes</span>
      </Link>

      <div className="flex items-center gap-1">
        <TripPageHelp heroMode />
        <span data-tour="topbar-novedades">
          <TripActivityFeedButton tripId={tripId} heroMode />
        </span>
        <span data-tour="topbar-darkmode">
          <DarkModeToggle heroMode />
        </span>
        <LoggedInHeaderActions heroMode showNotifications={false} />
      </div>
    </div>
  );
}
