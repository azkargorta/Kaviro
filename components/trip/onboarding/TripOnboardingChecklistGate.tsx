"use client";

import { useEffect, useState } from "react";
import TripOnboardingChecklist from "@/components/trip/onboarding/TripOnboardingChecklist";
import { isTripOnboardingDismissed, type TripOnboardingCounts } from "@/lib/trip-onboarding";

type Props = {
  tripId: string;
  tripName: string;
  isPremium: boolean;
};

/**
 * Carga el checklist en el cliente (no bloquea el layout del servidor).
 * Si el usuario ya lo cerró, no hace ninguna petición.
 */
export default function TripOnboardingChecklistGate({ tripId, tripName, isPremium }: Props) {
  const [counts, setCounts] = useState<TripOnboardingCounts | null>(null);

  useEffect(() => {
    if (isTripOnboardingDismissed(tripId)) return;

    let cancelled = false;

    const run = () => {
      void fetch(`/api/trips/${encodeURIComponent(tripId)}/onboarding-counts`, {
        credentials: "include",
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && data?.counts) setCounts(data.counts as TripOnboardingCounts);
        })
        .catch(() => {});
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 5000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const t = window.setTimeout(run, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [tripId]);

  if (!counts) return null;

  return (
    <TripOnboardingChecklist
      tripId={tripId}
      tripName={tripName}
      isPremium={isPremium}
      counts={counts}
    />
  );
}
