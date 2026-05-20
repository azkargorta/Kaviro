/**
 * lib/tier.ts — fuente única de verdad para límites de plan y utilidades de tier.
 *
 * Uso server-side:
 *   import { PLAN_LIMITS, checkLimit } from "@/lib/tier";
 *   const ok = await checkLimit("trips", supabase, userId);
 *
 * Uso client-side (solo constantes):
 *   import { PLAN_LIMITS } from "@/lib/tier";
 *   PLAN_LIMITS.free.trips // 3
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Constantes de plan
// ---------------------------------------------------------------------------

export const PLAN_LIMITS = {
  free: {
    trips: 3,
    participantsPerTrip: 5,
    activitiesPerTrip: 30,
    resourcesPerTrip: 10,
    aiMessagesPerDay: 5,
    label: "Gratuito",
  },
  premium: {
    trips: Infinity,
    participantsPerTrip: Infinity,
    activitiesPerTrip: Infinity,
    resourcesPerTrip: Infinity,
    aiMessagesPerDay: Infinity,
    label: "Premium",
  },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;
export type LimitKey = keyof (typeof PLAN_LIMITS)["free"];

// Código de error estándar para respuestas API 402
export const PREMIUM_REQUIRED = "PREMIUM_REQUIRED" as const;

// ---------------------------------------------------------------------------
// Helpers server-only (requieren SupabaseClient)
// ---------------------------------------------------------------------------

/** Lee el tier del usuario desde la tabla profiles. */
export async function getUserTier(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanTier> {
  const { data } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", userId)
    .maybeSingle();
  return (data as { is_premium?: boolean } | null)?.is_premium ? "premium" : "free";
}

/** Devuelve true si el usuario es premium (por sí mismo o por participante en el viaje). */
export async function isPremiumEnabled(
  supabase: SupabaseClient,
  userId: string,
  tripId?: string
): Promise<boolean> {
  const tier = await getUserTier(supabase, userId);
  if (tier === "premium") return true;
  if (!tripId) return false;

  const { data: participants } = await supabase
    .from("trip_participants")
    .select("user_id")
    .eq("trip_id", tripId)
    .neq("status", "removed");

  const ids = ((participants ?? []) as { user_id: string }[])
    .map((r) => r.user_id)
    .filter(Boolean);
  if (!ids.length) return false;

  const { data: anyPremium } = await supabase
    .from("profiles")
    .select("id")
    .in("id", ids)
    .eq("is_premium", true)
    .limit(1);

  return Array.isArray(anyPremium) && anyPremium.length > 0;
}

/** Lanza un error estándar 402 si el usuario no es premium. */
export async function requirePremium(
  supabase: SupabaseClient,
  userId: string,
  tripId?: string
): Promise<void> {
  const ok = await isPremiumEnabled(supabase, userId, tripId);
  if (!ok) {
    const err = new Error("Necesitas Premium para usar esta función.");
    (err as Error & { code: string; httpStatus: number }).code = PREMIUM_REQUIRED;
    (err as Error & { code: string; httpStatus: number }).httpStatus = 402;
    throw err;
  }
}

/** Devuelve el límite numérico de un recurso para el tier del usuario. */
export async function getLimit(
  supabase: SupabaseClient,
  userId: string,
  key: LimitKey
): Promise<number> {
  const tier = await getUserTier(supabase, userId);
  return PLAN_LIMITS[tier][key] as number;
}

/**
 * Comprueba si el usuario ha alcanzado el límite de viajes gratuitos.
 * Equivalente a `ensureUserCanCreateTrip` de lib/trips/tripCreationLimits.ts.
 */
export async function checkTripLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: true; tier: PlanTier } | { ok: false; error: string; code: typeof PREMIUM_REQUIRED }> {
  const tier = await getUserTier(supabase, userId);
  if (tier === "premium") return { ok: true, tier };

  const limit = PLAN_LIMITS.free.trips;

  // Excluir demo trip del conteo
  const { data: profile } = await supabase
    .from("profiles")
    .select("demo_trip_id")
    .eq("id", userId)
    .maybeSingle();
  const demoId = (profile as { demo_trip_id?: string } | null)?.demo_trip_id ?? null;

  const { data: existing, error: countErr } = await supabase
    .from("trip_participants")
    .select("trip_id")
    .eq("user_id", userId)
    .neq("status", "removed");

  if (countErr) {
    return { ok: false, error: countErr.message, code: PREMIUM_REQUIRED };
  }

  const tripIds = ((existing ?? []) as { trip_id: string }[])
    .map((r) => r.trip_id)
    .filter(Boolean);

  if (!tripIds.length) return { ok: true, tier };

  const { data: trips } = await supabase
    .from("trips")
    .select("id, is_demo")
    .in("id", tripIds);

  const nonDemoCount = (
    (trips as { id: string; is_demo?: boolean }[] | null) ?? []
  ).filter((t) => !t.is_demo && t.id !== demoId).length;

  if (nonDemoCount >= limit) {
    return {
      ok: false,
      error: `El plan gratuito permite hasta ${limit} viajes. Hazte Premium para crear más.`,
      code: PREMIUM_REQUIRED,
    };
  }

  return { ok: true, tier };
}
