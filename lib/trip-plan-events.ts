export const KAVIRO_TRIP_PLAN_REFRESH_EVENT = "kaviro:trip-plan-refresh";

export type TripPlanRefreshDetail = {
  tripId: string;
  /** Cierra el drawer del asistente en la misma pestaña (p. ej. tras «Añadir todo»). */
  closeAssistant?: boolean;
};

/** Pide a las vistas de Plan que recarguen actividades (p. ej. tras ejecutar itinerario en IA). */
export function dispatchTripPlanRefresh(
  tripId: string,
  options?: { closeAssistant?: boolean }
): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent<TripPlanRefreshDetail>(KAVIRO_TRIP_PLAN_REFRESH_EVENT, {
        detail: { tripId, closeAssistant: options?.closeAssistant },
      })
    );
  } catch {
    /* */
  }
}
