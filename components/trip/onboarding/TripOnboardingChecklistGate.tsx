"use client";

import { useEffect, useState } from "react";
import TripOnboardingChecklist from "@/components/trip/onboarding/TripOnboardingChecklist";
import { useIsMobile } from "@/hooks/useIsMobile";
import { KAVIRO_TRIP_HELP_TOGGLE_EVENT } from "@/lib/trip-section-hints";
import { isTripOnboardingDismissed, type TripOnboardingCounts } from "@/lib/trip-onboarding";

type Props = {
  tripId: string;
  tripName: string;
  isPremium: boolean;
  tripMode?: "travel" | "expenses";
  /** En Resumen el checklist es visible también en móvil sin abrir ayuda. */
  summaryPage?: boolean;
  /** Si el servidor ya calculó los conteos, no se llama a la API al montar. */
  initialCounts?: TripOnboardingCounts | null;
};

/**
 * Carga el checklist en el cliente (no bloquea el layout del servidor).
 * Si el usuario ya lo cerró, no hace ninguna petición.
 */
export default function TripOnboardingChecklistGate({
  tripId,
  tripName,
  isPremium,
  tripMode = "travel",
  summaryPage = false,
  initialCounts = null,
}: Props) {
  const isMobile = useIsMobile();
  const [counts, setCounts] = useState<TripOnboardingCounts | null>(initialCounts);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ open?: boolean }>).detail;
      setHelpOpen((prev) => (typeof detail?.open === "boolean" ? detail.open : !prev));
    };
    window.addEventListener(KAVIRO_TRIP_HELP_TOGGLE_EVENT, onToggle);
    return () => window.removeEventListener(KAVIRO_TRIP_HELP_TOGGLE_EVENT, onToggle);
  }, [isMobile]);

  useEffect(() => {
    if (initialCounts) {
      setCounts(initialCounts);
      return;
    }
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
  }, [tripId, initialCounts]);

  if (!counts) return null;
  if (isMobile && !helpOpen && !summaryPage) return null;

  return (
    <TripOnboardingChecklist
      tripId={tripId}
      tripName={tripName}
      isPremium={isPremium}
      counts={counts}
      startExpanded={isMobile && helpOpen}
      tripMode={tripMode}
    />
  );
}
