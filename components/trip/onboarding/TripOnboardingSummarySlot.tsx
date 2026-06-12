"use client";

import { usePathname } from "next/navigation";
import TripOnboardingChecklistGate from "@/components/trip/onboarding/TripOnboardingChecklistGate";
import { isTripSummaryPath } from "@/lib/trip-section-hints";
import type { TripOnboardingCounts } from "@/lib/trip-onboarding";

type Props = {
  tripId: string;
  tripName: string;
  isPremium: boolean;
  tripMode?: "travel" | "expenses";
  /** Conteos ya calculados en SSR del resumen; evita /onboarding-counts al cargar. */
  initialCounts?: TripOnboardingCounts;
};

/** Checklist de configuración solo en la pestaña Resumen. */
export default function TripOnboardingSummarySlot(props: Props) {
  const pathname = usePathname() || "";
  if (!isTripSummaryPath(pathname, props.tripId)) return null;
  return <TripOnboardingChecklistGate {...props} summaryPage initialCounts={props.initialCounts} />;
}
