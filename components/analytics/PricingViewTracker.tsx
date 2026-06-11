"use client";

import { useEffect, useRef } from "react";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";

export default function PricingViewTracker() {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    trackEvent(ANALYTICS_EVENTS.PRICING_VIEWED);
  }, []);

  return null;
}
