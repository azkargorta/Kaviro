"use client";

import { useEffect, useRef } from "react";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";

type Props = {
  tripId: string;
  tripMode?: "travel" | "expenses";
  isDemo?: boolean;
};

export default function TripOpenedTracker({ tripId, tripMode = "travel", isDemo = false }: Props) {
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!tripId || isDemo) return;
    if (trackedRef.current === tripId) return;
    trackedRef.current = tripId;

    trackEvent(ANALYTICS_EVENTS.TRIP_OPENED, {
      trip_id: tripId,
      trip_mode: tripMode,
    });
  }, [tripId, tripMode, isDemo]);

  return null;
}
