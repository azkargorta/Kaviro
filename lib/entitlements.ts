import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Entitlements = {
  isPremium: boolean;
};

export type BillingSubscriptionSnapshot = {
  status?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
} | null;

export type ProfilePremiumSnapshot = {
  is_premium?: boolean | null;
  premium_until?: string | null;
} | null;

/** Premium temporal (referidos, promos) mientras `premium_until` no haya caducado. */
export function isPremiumUntilActive(premiumUntil: string | null | undefined): boolean {
  if (!premiumUntil) return false;
  const t = Date.parse(premiumUntil);
  return Number.isFinite(t) && t > Date.now();
}

/** Suscripción Stripe aún vigente (active / trialing / past_due). */
export function isActiveBillingSubscription(sub: BillingSubscriptionSnapshot): boolean {
  if (!sub?.status) return false;
  const status = String(sub.status).toLowerCase();
  if (!["active", "trialing", "past_due"].includes(status)) return false;
  if (sub.current_period_end) {
    const end = Date.parse(sub.current_period_end);
    if (Number.isFinite(end) && end <= Date.now()) return false;
  }
  return true;
}

/**
 * Premium de cuenta para pantallas de perfil / facturación:
 * flag en profiles, premium_until o suscripción activa en billing_subscriptions.
 */
export function resolveAccountPremium(
  profile: ProfilePremiumSnapshot,
  subscription: BillingSubscriptionSnapshot
): boolean {
  if (Boolean(profile?.is_premium)) return true;
  if (isPremiumUntilActive(profile?.premium_until ?? null)) return true;
  return isActiveBillingSubscription(subscription);
}

async function getUserPremiumFlag(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", userId)
    .maybeSingle();
  if (error) return false;
  return Boolean((data as { is_premium?: boolean } | null)?.is_premium);
}

/**
 * Premium "efectivo" por viaje:
 * - Si el usuario es premium => true
 * - Si no, pero hay AL MENOS 1 participante premium en el viaje => true
 * - Si no => false
 *
 * Requisito: el usuario debe tener acceso al viaje (ser participante),
 * o esta función devolverá false por no poder ver participantes (RLS).
 */
export async function isPremiumEnabledForTrip(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  tripId: string;
}): Promise<boolean> {
  const { supabase, userId, tripId } = params;

  const mine = await getUserPremiumFlag(supabase, userId);
  if (mine) return true;

  const { data: participants, error: pErr } = await supabase
    .from("trip_participants")
    .select("user_id")
    .eq("trip_id", tripId)
    .neq("status", "removed");
  if (pErr) return false;

  const ids = ((participants || []) as { user_id: string }[])
    .map((r) => r.user_id)
    .filter((x): x is string => typeof x === "string" && x.length > 0);
  if (!ids.length) return false;

  const { data: anyPremium, error: prErr } = await supabase
    .from("profiles")
    .select("id")
    .in("id", ids)
    .eq("is_premium", true)
    .limit(1);
  if (prErr) return false;

  return Array.isArray(anyPremium) && anyPremium.length > 0;
}

/** Una sola consulta premium por viaje y petición (layout + página comparten resultado). */
export const getCachedTripPremium = cache(async (tripId: string, userId: string) => {
  const supabase = await createClient();
  return isPremiumEnabledForTrip({ supabase, userId, tripId });
});

export async function getMyEntitlements(): Promise<Entitlements> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { isPremium: false };

  return { isPremium: await getUserPremiumFlag(supabase, user.id) };
}

export async function requirePremiumOrThrow() {
  const ent = await getMyEntitlements();
  if (!ent.isPremium) {
    const err = Object.assign(new Error("Necesitas Premium para usar esta función."), {
      code: "PREMIUM_REQUIRED" as const,
      httpStatus: 402,
    });
    throw err;
  }
  return ent;
}

