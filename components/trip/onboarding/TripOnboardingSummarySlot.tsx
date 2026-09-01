"use client";

import { usePathname } from "next/navigation";
import { isTripSummaryPath } from "@/lib/trip-section-hints";
import type { TripOnboardingCounts } from "@/lib/trip-onboarding";
import TripFirstStepsGuide from "@/components/trip/onboarding/TripFirstStepsGuide";

type Props = {
  tripId: string;
  tripName: string;
  isPremium: boolean;
  tripMode?: "travel" | "expenses";
  /** Conteos ya calculados en SSR del resumen. */
  initialCounts?: TripOnboardingCounts;
};

/**
 * En Resumen priorizamos una única recomendación accionable.
 * El usuario descubre el resto de módulos cuando los necesita, en vez de aprenderlos todos al principio.
 */
export default function TripOnboardingSummarySlot({
  tripId,
  tripName,
  tripMode = "travel",
  initialCounts,
}: Props) {
  const pathname = usePathname() || "";
  if (!isTripSummaryPath(pathname, tripId)) return null;
  if (tripMode === "expenses" || !initialCounts) return null;

  return <TripFirstStepsGuide tripId={tripId} tripName={tripName} counts={initialCounts} />;
}
