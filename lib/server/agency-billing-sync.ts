import type Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { AGENCY_PRO_MAX_MEMBERS } from "@/lib/agency-plan";
import { logger } from "@/lib/logger";

type Admin = ReturnType<typeof createSupabaseAdmin>;

function isActiveSubscriptionStatus(status: string) {
  return status === "active" || status === "trialing";
}

export async function syncAgencyPlanFromSubscription(
  admin: Admin,
  sub: Stripe.Subscription,
  agencyIdHint?: string | null
) {
  const agencyId =
    (sub.metadata?.agency_id as string | undefined) ||
    agencyIdHint ||
    (sub.metadata?.type === "agency_pro" ? null : null);

  if (!agencyId) return false;

  const active = isActiveSubscriptionStatus(sub.status);
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;

  const { error } = await admin
    .from("agencies")
    .update({
      plan: active ? "agency_pro" : "suspended",
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : null,
      stripe_subscription_id: sub.id,
      plan_active_until: periodEnd,
      max_members: active ? AGENCY_PRO_MAX_MEMBERS : 2,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agencyId);

  if (error) {
    logger.error("syncAgencyPlanFromSubscription:", error.message);
    throw error;
  }
  return true;
}

export function isAgencyProSubscriptionMetadata(metadata: Record<string, string> | null | undefined) {
  return metadata?.type === "agency_pro" && Boolean(metadata.agency_id);
}
