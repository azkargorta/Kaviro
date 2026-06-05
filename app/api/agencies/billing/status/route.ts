import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";
import {
  agencyPlanLabel,
  isAgencyPlanActive,
  isAgencySelfServeCheckoutConfigured,
} from "@/lib/agency-plan";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const ctx = await getAgencyForUser(supabase, user.id);
  if (!ctx) {
    return NextResponse.json({
      hasAgency: false,
      selfServeCheckout: isAgencySelfServeCheckoutConfigured(),
    });
  }

  const { agency } = ctx;
  const active = isAgencyPlanActive(agency);

  return NextResponse.json({
    hasAgency: true,
    plan: agency.plan,
    planLabel: agencyPlanLabel(agency.plan),
    active,
    trialEndsAt: agency.plan_active_until,
    maxMembers: agency.max_members,
    selfServeCheckout: isAgencySelfServeCheckoutConfigured(),
    canUpgrade: isAgencySelfServeCheckoutConfigured() && agency.plan !== "agency_pro" && agency.plan !== "partnership",
    hasStripeCustomer: Boolean(agency.stripe_customer_id),
    canManageBilling: Boolean(agency.stripe_customer_id && agency.stripe_subscription_id),
  });
}
