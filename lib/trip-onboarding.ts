export type TripOnboardingCounts = {
  participants: number;
  activities: number;
  routes: number;
  expenses: number;
  resources: number;
};

const DISMISSED_PREFIX = "kaviro_trip_first_run_v1:";
/** @deprecated compat — lectura de clave antigua */
const LEGACY_DISMISSED_PREFIX = "tripboard_trip_first_run_v1:";

export function tripOnboardingStorageKey(tripId: string) {
  return `${DISMISSED_PREFIX}${tripId}`;
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

export function looksLikeNewTrip(counts: TripOnboardingCounts): boolean {
  return (
    counts.participants <= 1 &&
    counts.activities === 0 &&
    counts.routes === 0 &&
    counts.expenses === 0 &&
    counts.resources === 0
  );
}

export function shouldShowTripOnboarding(tripId: string, counts: TripOnboardingCounts): boolean {
  return !isTripOnboardingDismissed(tripId) && looksLikeNewTrip(counts);
}

export const KAVIRO_FIRST_RUN_DISMISSED_EVENT = "kaviro:first-run-dismissed";

export function dispatchFirstRunDismissed(tripId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(KAVIRO_FIRST_RUN_DISMISSED_EVENT, { detail: { tripId } }));
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
      return false;
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

export function buildOnboardingSteps(tripId: string, isPremium: boolean): OnboardingStep[] {
  const id = encodeURIComponent(tripId);
  const participants: OnboardingStep = {
    id: "participants",
    title: "Invita a tu grupo",
    description: "Añade familia o amigos y define quién puede editar qué.",
    href: `/trip/${id}/participants`,
  };
  const plan: OnboardingStep = {
    id: "plan",
    title: "Crea el plan",
    description: "Actividades, horarios y lugares por día.",
    href: `/trip/${id}/plan`,
  };
  const expenses: OnboardingStep = {
    id: "expenses",
    title: "Anota los gastos",
    description: "Splits y balances para que nadie lleve la cuenta en Excel.",
    href: `/trip/${id}/expenses`,
  };
  const map: OnboardingStep = {
    id: "map",
    title: "Monta las rutas",
    description: "Trayectos y paradas sobre el mapa.",
    href: `/trip/${id}/map`,
  };
  const resources: OnboardingStep = {
    id: "resources",
    title: "Guarda reservas y documentos",
    description: "Billetes, alojamiento y archivos del viaje.",
    href: `/trip/${id}/resources`,
  };
  const ai: OnboardingStep = {
    id: "ai",
    title: "Asistente personal (Premium)",
    description: "Itinerarios y dudas con el contexto de este viaje.",
    href: `/trip/${id}/ai-chat`,
  };

  if (isPremium) {
    return [participants, plan, expenses, map, resources, ai];
  }
  return [participants, plan, expenses, map, resources];
}
