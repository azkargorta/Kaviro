export const KAVIRO_TRIP_PLAN_REFRESH_EVENT = "kaviro:trip-plan-refresh";

export type TripPlanRefreshDetail = {
  tripId: string;
  /** Cierra el drawer del asistente en la misma pestaña (p. ej. tras «Añadir todo»). */
  closeAssistant?: boolean;
  /** Actividades creadas en la última ejecución (muestra aviso en Plan). */
  plansAdded?: number;
  /** Mensaje opcional para la pestaña Plan. */
  message?: string;
  /** Selecciona este día en la vista Plan tras recargar. */
  focusDate?: string;
  /** Rutas / mapa deben recargar planes (p. ej. coordenadas actualizadas). */
  mapPlansChanged?: boolean;
};

/** Pide a las vistas de Plan que recarguen actividades (p. ej. tras ejecutar itinerario en IA). */
export function dispatchTripPlanRefresh(
  tripId: string,
  options?: {
    closeAssistant?: boolean;
    plansAdded?: number;
    message?: string;
    focusDate?: string;
    mapPlansChanged?: boolean;
  }
): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent<TripPlanRefreshDetail>(KAVIRO_TRIP_PLAN_REFRESH_EVENT, {
        detail: {
          tripId,
          closeAssistant: options?.closeAssistant,
          plansAdded: options?.plansAdded,
          message: options?.message,
          focusDate: options?.focusDate,
          mapPlansChanged: options?.mapPlansChanged,
        },
      })
    );
  } catch {
    /* */
  }
}
