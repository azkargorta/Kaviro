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
  const done = steps.filter((s) => isOnboardingStepDone(s.id, counts)).length;
  return { done, total };
}

export function isOnboardingComplete(counts: TripOnboardingCounts, steps: OnboardingStep[]): boolean {
  return steps.length > 0 && steps.every((s) => isOnboardingStepDone(s.id, counts));
}

export function shouldShowTripOnboarding(
  tripId: string,
  counts: TripOnboardingCounts,
  steps: OnboardingStep[]
): boolean {
  if (isTripOnboardingDismissed(tripId)) return false;
  return !isOnboardingComplete(counts, steps);
}

export function buildOnboardingSteps(tripId: string, isPremium: boolean): OnboardingStep[] {
  const id = encodeURIComponent(tripId);
  const participants: OnboardingStep = {
    id: "participants",
    icon: "👥",
    title: "Invita a tu grupo",
    description: "Añade familia o amigos y define quién puede editar qué.",
    href: `/trip/${id}/participants`,
  };
  const plan: OnboardingStep = {
    id: "plan",
    icon: "📅",
    title: "Crea el plan",
    description: "Actividades por día, visibilidad del grupo e IA sugiere.",
    href: `/trip/${id}/plan`,
  };
  const expenses: OnboardingStep = {
    id: "expenses",
    icon: "💶",
    title: "Anota los gastos",
    description: "Splits y balances para que nadie lleve la cuenta en Excel.",
    href: `/trip/${id}/expenses`,
  };
  const map: OnboardingStep = {
    id: "map",
    icon: "🗺️",
    title: "Monta las rutas",
    description: "Trayectos y paradas sobre el mapa.",
    href: `/trip/${id}/map`,
  };
  const resources: OnboardingStep = {
    id: "resources",
    icon: "📎",
    title: "Guarda reservas y documentos",
    description: "Billetes, alojamiento y archivos del viaje.",
    href: `/trip/${id}/resources`,
  };
  const ai: OnboardingStep = {
    id: "ai",
    icon: "✨",
    title: "Prueba el asistente IA",
    description: isPremium
      ? "Pide un itinerario o reorganiza el plan con contexto del viaje."
      : "Disponible con Premium (o si un compañero tiene Premium en el viaje).",
    href: `/trip/${id}/ai-chat`,
  };

  if (isPremium) {
    return [participants, plan, expenses, map, resources, ai];
  }
  return [participants, plan, expenses, map, resources];
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
    supabase.from("trip_participants").select("id", { count: "exact", head: true }).eq("trip_id", tripId).neq("status", "removed"),
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
