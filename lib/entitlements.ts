import { createClient } from "@/lib/supabase/server";

export type Entitlements = {
  isPremium: boolean;
};

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

