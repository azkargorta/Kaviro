import type Stripe from "stripe";

/** Fin de periodo (unix s). Stripe API 2025+ lo expone en SubscriptionItem, no en Subscription. */
export function subscriptionPeriodEndUnix(
  sub: Pick<Stripe.Subscription, "items"> & { current_period_end?: number | null }
): number | null {
  const itemEnd = sub.items?.data?.[0]?.current_period_end;
  if (typeof itemEnd === "number") return itemEnd;
  if (typeof sub.current_period_end === "number") return sub.current_period_end;
  return null;
}

export function subscriptionPeriodEndIso(
  sub: Pick<Stripe.Subscription, "items"> & { current_period_end?: number | null }
): string | null {
  const unix = subscriptionPeriodEndUnix(sub);
  return unix ? new Date(unix * 1000).toISOString() : null;
}
