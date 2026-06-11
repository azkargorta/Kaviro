"use client";

import TrackPageView from "@/components/analytics/TrackPageView";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

export default function AnalyticsRoot() {
  return (
    <>
      <TrackPageView />
      <GoogleAnalytics />
    </>
  );
}
