"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TripSectionHint from "@/components/trip/TripSectionHint";
import {
  dispatchTripHelpToggle,
  getTripSectionHint,
  KAVIRO_TRIP_HELP_TOGGLE_EVENT,
} from "@/lib/trip-section-hints";

export default function TripSectionHintHost({ tripId }: { tripId: string }) {
  const pathname = usePathname() || "";
  const match = getTripSectionHint(pathname);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
    dispatchTripHelpToggle(false);
  }, [pathname]);

  useEffect(() => {
    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ open?: boolean }>).detail;
      setOpen((prev) => (typeof detail?.open === "boolean" ? detail.open : !prev));
    };
    window.addEventListener(KAVIRO_TRIP_HELP_TOGGLE_EVENT, onToggle);
    return () => window.removeEventListener(KAVIRO_TRIP_HELP_TOGGLE_EVENT, onToggle);
  }, []);

  if (!match) return null;

  return (
    <TripSectionHint
      tripId={tripId}
      sectionKey={match.key}
      message={match.message}
      open={open}
      onClose={() => {
        setOpen(false);
        dispatchTripHelpToggle(false);
      }}
    />
  );
}
