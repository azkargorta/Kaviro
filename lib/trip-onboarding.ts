import type { SupabaseClient } from "@supabase/supabase-js";

export type TripOnboardingCounts = {
  participants: number;
  activities: number;
  routes: number;
  expenses: number;
  resources: number;
  aiConversations: number;
};

const DISMISSED_PREFIX = "kaviro_trip_first_run_v1:";
/** @deprecated compat — lectura de clave antigua */
const LEGACY_DISMISSED_PREFIX = "tripboard_trip_first_run_v1:";

export function tripOnboardingStorageKey(tripId: string) {
  return `${DISMISSED_PREFIX}${tripId}`;
}

export function tripOnboardingCollapsedKey(tripId: string) {
  return `kaviro_trip_checklist_collapsed:${tripId}`;
}

export function isTripOnboardingDismissed(tripId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = tripOnboardingStorageKey(tripId);
    if (window.localStorage.getItem(key) === "1") return true;
    return window.localStorage.getItem(`${LEGACY_DISMISSED_PREFIX}${tripId}`) === "1";
  } catch {
    return false;
  }
}

export function dismissTripOnboarding(tripId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(tripOnboardingStorageKey(tripId), "1");
  } catch {
    /* */
  }
}

/** @deprecated Usar shouldShowTripOnboarding con steps */
export function looksLikeNewTrip(counts: TripOnboardingCounts): boolean {
  return (
    counts.participants <= 1 &&
    counts.activities === 0 &&
    counts.routes === 0 &&
    counts.expenses === 0 &&
    counts.resources === 0
  );
}

export const KAVIRO_FIRST_RUN_DISMISSED_EVENT = "kaviro:first-run-dismissed";
export const KAVIRO_TRIP_ONBOARDING_REFRESH_EVENT = "kaviro:trip-onboarding-refresh";

export function dispatchFirstRunDismissed(tripId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(KAVIRO_FIRST_RUN_DISMISSED_EVENT, { detail: { tripId } }));
  } catch {
    /* */
  }
}

/** Pide al checklist que vuelva a cargar conteos (p. ej. tras crear actividad o gasto). */
export function dispatchTripOnboardingRefresh(tripId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent(KAVIRO_TRIP_ONBOARDING_REFRESH_EVENT, { detail: { tripId } })
    );
  } catch {
    /* */
  }
}

export type OnboardingStepId = "participants" | "plan" | "expenses" | "map" | "resources" | "ai";

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  href: string;
  icon: string;
};

export function isOnboardingStepDone(id: OnboardingStepId, counts: TripOnboardingCounts): boolean {
  switch (id) {
    case "participants":
      return counts.participants > 1;
    case "plan":
      return counts.activities > 0;
    case "map":
      return counts.routes > 0;
    case "resources":
      return counts.resources > 0;
    case "expenses":
      return counts.expenses > 0;
    case "ai":
      return counts.aiConversations > 0;
    default:
      return false;
  }
}

export function onboardingProgress(counts: TripOnboardingCounts, steps: OnboardingStep[]): {
  done: number;
  total: number;
} {
  const total = steps.length;
  const done = steps.filter((step) => isOnboardingStepDone(step.id, counts)).length;
  return { done, total };
}

export function isOnboardingComplete(counts: TripOnboardingCounts, steps: OnboardingStep[]): boolean {
  return steps.length > 0 && steps.every((step) => isOnboardingStepDone(step.id, counts));
}

export function shouldShowTripOnboarding(
  tripId: string,
  counts: TripOnboardingCounts,
  steps: OnboardingStep[]
): boolean {
  if (isTripOnboardingDismissed(tripId)) return false;
  return !isOnboardingComplete(counts, steps);
}

export function buildOnboardingSteps(
  tripId: string,
  _isPremium: boolean,
  tripMode: "travel" | "expenses" = "travel"
): OnboardingStep[] {
  const id = encodeURIComponent(tripId);

  const participants: OnboardingStep = {
    id: "participants",
    icon: "👥",
    title: tripMode === "expenses" ? "Añade a tu grupo" : "Invita a quien viaja contigo",
    description:
      tripMode === "expenses"
        ? "Añade a las personas que comparten gastos contigo."
        : "Compartid el mismo plan y mantened el viaje actualizado entre todos.",
    href: `/trip/${id}/participants`,
  };

  const expenses: OnboardingStep = {
    id: "expenses",
    icon: "💶",
    title: "Añade el primer gasto",
    description: "Registra un pago para empezar a calcular balances del grupo.",
    href: `/trip/${id}/expenses`,
  };

  if (tripMode === "expenses") {
    return [participants, expenses];
  }

  const plan: OnboardingStep = {
    id: "plan",
    icon: "📅",
    title: "Añade tu primer plan",
    description: "Empieza por algo que ya sepas: un vuelo, una reserva o una actividad.",
    href: `/trip/${id}/plan`,
  };

  const resources: OnboardingStep = {
    id: "resources",
    icon: "📎",
    title: "Guarda una reserva o documento",
    description: "Ten billetes, alojamientos y reservas junto al resto del viaje.",
    href: `/trip/${id}/resources`,
  };

  // El primer uso debe ser corto y evidente. Mapa, gastos e IA se descubren
  // después, de forma contextual, cuando ya existe contenido real en el viaje.
  return [plan, participants, resources];
}

/** Cuenta módulos del viaje en servidor (layout / resumen). */
export async function fetchTripOnboardingCounts(
  supabase: SupabaseClient,
  tripId: string
): Promise<TripOnboardingCounts> {
  const [
    { count: participants },
    { count: activities },
    { count: routes },
    { count: expenses },
    { count: resources },
    { count: aiConversations },
  ] = await Promise.all([
    supabase
      .from("trip_participants")
      .select("id", { count: "exact", head: true })
      .eq("trip_id", tripId)
      .neq("status", "removed"),
    supabase.from("trip_activities").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
    supabase.from("trip_routes").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
    supabase.from("trip_expenses").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
    supabase.from("trip_resources").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
    supabase.from("trip_ai_conversations").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
  ]);

  return {
    participants: participants ?? 0,
    activities: activities ?? 0,
    routes: routes ?? 0,
    expenses: expenses ?? 0,
    resources: resources ?? 0,
    aiConversations: aiConversations ?? 0,
  };
}
