"use client";

import TrackPageView from "@/components/analytics/TrackPageView";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";

export default function AnalyticsRoot() {
  return (
    <>
      <TrackPageView />
      <GoogleAnalytics />
      <MicrosoftClarity />
    </>
  );
}
