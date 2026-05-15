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
