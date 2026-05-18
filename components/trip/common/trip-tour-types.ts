import type { TripTabKey } from "@/lib/trip-tab-assets";

/** Step for the tab-level tour (between tabs) — kept for non-demo trips */
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

/**
 * Intra-tab spotlight step.
 * `target` is a CSS selector or data-tour attribute selector that
 * identifies the DOM element to highlight.
 * Example: '[data-tour="plan-add-btn"]'
 */
export type SpotlightStep = {
  /** Unique id for this step */
  id: string;
  /** Which tab/page this step belongs to */
  tab: string;
  /** CSS selector for the element to spotlight. If null, shows centered modal. */
  target: string | null;
  /** Where to position the tooltip relative to the target */
  placement: "top" | "bottom" | "left" | "right" | "center";
  /** Short title shown in the tooltip */
  title: string;
  /** Explanation text */
  body: string;
  /** Optional emoji to show in the tooltip */
  emoji?: string;
};

/** Full intra-tab tour: steps grouped by tab */
export type SpotlightTour = SpotlightStep[];
