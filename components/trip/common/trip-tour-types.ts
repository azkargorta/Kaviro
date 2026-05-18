import type { TripTabKey } from "@/lib/trip-tab-assets";

export type TourStep = {
  id: string;
  title: string;
  lead: string;
  body: string;
  mobileTip: string;
  href: (tripId: string) => string;
  visual:
    | { type: "emoji"; value: string }
    | { type: "image"; tabKey: TripTabKey; alt: string; imageClassName?: string };
};

export type SpotlightStep = {
  id: string;
  tab: string;
  target: string | null;
  placement: "top" | "bottom" | "left" | "right" | "center";
  title: string;
  body: string;
  emoji?: string;
  /** Optional pre-step action to execute before showing the step */
  action?: "expand-days" | "calendar-mode";
};
