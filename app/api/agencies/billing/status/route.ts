import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";
import { agencyPlanLabel, isAgencyPlanActive } from "@/lib/agency-plan";
import {
  agencyHasCheckoutPrice,
  formatAgencyQuoteLabel,
} from "@/lib/server/agency-custom-pricing";

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
      canCheckout: false,
    });
  }

  const { agency } = ctx;
  const active = isAgencyPlanActive(agency);

  const quoteLabel = formatAgencyQuoteLabel(
    agency.billing_monthly_amount_cents,
    agency.billing_currency || "eur"
  );
  const canCheckout = agencyHasCheckoutPrice(agency);

  return NextResponse.json({
    hasAgency: true,
    plan: agency.plan,
    planLabel: agencyPlanLabel(agency.plan),
    active,
    trialEndsAt: agency.plan_active_until,
    maxMembers: agency.max_members,
    canCheckout,
    hasCustomQuote: Boolean(quoteLabel),
    quoteLabel,
    quoteNotes: agency.billing_quote_notes ?? null,
    canUpgrade: canCheckout && agency.plan !== "agency_pro" && agency.plan !== "partnership",
    hasStripeCustomer: Boolean(agency.stripe_customer_id),
    canManageBilling: Boolean(agency.stripe_customer_id && agency.stripe_subscription_id),
  });
}
