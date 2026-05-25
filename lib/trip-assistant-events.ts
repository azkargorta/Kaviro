import type { TripAiMode } from "@/lib/trip-ai/buildPrompt";

export const TRIP_ASSISTANT_OPEN_EVENT = "kaviro:trip-assistant-open";

export type TripAssistantOpenDetail = {
  tripId: string;
  initialMessage: string;
  /** Modo del asistente al abrir (p. ej. `actions` para parches del plan). */
  mode?: TripAiMode;
};

export function dispatchTripAssistantOpen(detail: TripAssistantOpenDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<TripAssistantOpenDetail>(TRIP_ASSISTANT_OPEN_EVENT, { detail }));
}

/** Prompt estándar al pulsar «Abrir asistente» desde el badge «IA sugiere» en Plan. */
export function buildPlanSuggestionChatPrompt(suggestion: string, selectedDate?: string | null) {
  const dayPart = selectedDate ? ` para el día ${selectedDate}` : "";
  return (
    `He recibido esta sugerencia sobre el plan${dayPart}: «${suggestion}»\n\n` +
    `Ayúdame a llevarla a cabo: proponme los cambios concretos en el plan (añadir, modificar o eliminar actividades).\n` +
    `Si es comida o cafetería, incluye un local concreto (nombre + zona + ciudad) cerca de las actividades de ese día, no solo «Desayuno» genérico.\n` +
    `Explícamelo en texto claro y prepara los cambios para el botón «Aplicar cambios».`
  );
}
