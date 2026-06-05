import type { AgencyRow } from "@/lib/agency";

export const AGENCY_TRIAL_DAYS = 14;
export const AGENCY_TRIAL_MAX_MEMBERS = 2;
export const AGENCY_PRO_MAX_MEMBERS = 5;

const ALWAYS_ACTIVE_PLANS = new Set(["partnership", "agency_pro"]);

export function agencyTrialEndsAt(from = new Date()): string {
  const end = new Date(from);
  end.setDate(end.getDate() + AGENCY_TRIAL_DAYS);
  return end.toISOString();
}

export function isAgencyPlanActive(agency: Pick<AgencyRow, "plan" | "plan_active_until">): boolean {
  if (agency.plan === "suspended") return false;
  if (ALWAYS_ACTIVE_PLANS.has(agency.plan)) {
    if (agency.plan === "agency_pro" && agency.plan_active_until) {
      return new Date(agency.plan_active_until) > new Date();
    }
    return true;
  }
  if (agency.plan === "trial" || agency.plan === "free") {
    if (!agency.plan_active_until) return true;
    return new Date(agency.plan_active_until) > new Date();
  }
  return true;
}

export function agencyPlanLabel(plan: string): string {
  switch (plan) {
    case "agency_pro":
      return "Agency Pro";
    case "trial":
      return "Prueba gratuita";
    case "partnership":
      return "Partnership";
    case "suspended":
      return "Suspendido";
    default:
      return plan;
  }
}

export function isAgencySelfServeCheckoutConfigured(): boolean {
  return Boolean(process.env.STRIPE_AGENCY_PRICE_ID_MONTHLY?.trim());
}
