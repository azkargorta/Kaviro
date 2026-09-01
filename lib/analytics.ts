import { STORAGE_KEY_PREFIX } from "@/lib/brand";

const CONSENT_KEY = `${STORAGE_KEY_PREFIX}_cookie_consent`;

export const ANALYTICS_EVENTS = {
  SIGN_UP_COMPLETED: "sign_up_completed",
  TRIP_CREATED: "trip_created",
  TRIP_OPENED: "trip_opened",
  ONBOARDING_STEP_CLICKED: "onboarding_step_clicked",
  ONBOARDING_COMPLETED: "onboarding_completed",
  EXPENSE_GROUP_CREATED: "expense_group_created",
  AI_PLANNER_STARTED: "ai_planner_started",
  AI_PLANNER_COMPLETED: "ai_planner_completed",
  PRICING_VIEWED: "pricing_viewed",
  PREMIUM_CLICKED: "premium_clicked",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsEventParams = Record<string, string | number | boolean | undefined | null>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "all";
  } catch {
    return false;
  }
}

/**
 * Envía un evento personalizado a Google Analytics 4 (gtag).
 * Solo actúa si el usuario aceptó cookies de medición.
 */
export function trackEvent(name: AnalyticsEventName, params?: AnalyticsEventParams): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  const payload = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== null)
  );

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, payload);
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...payload });
  } catch {
    /* no bloquear la UI por analytics */
  }
}
