"use client";

import { usePathname } from "next/navigation";
import TripOnboardingChecklistGate from "@/components/trip/onboarding/TripOnboardingChecklistGate";
import { isTripSummaryPath } from "@/lib/trip-section-hints";

type Props = {
  tripId: string;
  tripName: string;
  isPremium: boolean;
  tripMode?: "travel" | "expenses";
};

/** Checklist de configuración solo en la pestaña Resumen. */
export default function TripOnboardingSummarySlot(props: Props) {
  const pathname = usePathname() || "";
  if (!isTripSummaryPath(pathname, props.tripId)) return null;
  return <TripOnboardingChecklistGate {...props} summaryPage />;
}
