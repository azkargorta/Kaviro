import type { TripAiMode } from "@/lib/trip-ai/buildPrompt";

export const TRIP_ASSISTANT_OPEN_EVENT = "kaviro:trip-assistant-open";

export type TripAssistantOpenDetail = {
  tripId: string;
  initialMessage: string;
  /** Modo del asistente al abrir (p. ej. `optimizer` para revisar el plan). */
  mode?: TripAiMode;
};

export function dispatchTripAssistantOpen(detail: TripAssistantOpenDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<TripAssistantOpenDetail>(TRIP_ASSISTANT_OPEN_EVENT, { detail }));
}

/** Prompt al pulsar «IA sugiere» en Plan: análisis completo del viaje con diff aplicable. */
export function buildPlanFullTripAnalysisChatPrompt(options?: {
  tripName?: string | null;
  focusDate?: string | null;
}) {
  const namePart =
    options?.tripName && options.tripName.trim() ? ` («${options.tripName.trim()}»)` : "";
  const focusPart = options?.focusDate
    ? `\nPrioriza lo que veas en el día ${options.focusDate}, pero revisa todos los días del calendario del viaje en la misma pasada.`
    : "\nRevisa todos los días del calendario del viaje en una sola pasada.";

  return (
    `Analiza el plan completo de este viaje${namePart}.${focusPart}\n\n` +
    `Para cada día detecta problemas y mejoras: huecos largos sin actividades, comidas faltantes (desayuno, comida/almuerzo, cena), traslados si cambia de ciudad, días muy ligeros, solapes de horario y falta de margen.\n\n` +
    `Primero explícame en texto claro, agrupado por día, qué falta o conviene mejorar.\n` +
    `Después prepara todos los cambios concretos del plan (añadir, modificar o quitar actividades) en una sola propuesta para que yo elija cuáles aplicar con «Aplicar cambios».\n` +
    `En comidas incluye local concreto (nombre + zona + ciudad). En traslados sé explícito (tren, metro, ferry, etc.).`
  );
}

/** @deprecated Usar buildPlanFullTripAnalysisChatPrompt. */
export function buildPlanSuggestionChatPrompt(suggestion: string, selectedDate?: string | null) {
  const dayPart = selectedDate ? ` para el día ${selectedDate}` : "";
  return (
    `He recibido esta sugerencia sobre el plan${dayPart}: «${suggestion}»\n\n` +
    `Ayúdame a llevarla a cabo: proponme los cambios concretos en el plan (añadir, modificar o eliminar actividades).\n` +
    `Si es comida o cafetería, incluye un local concreto (nombre + zona + ciudad) cerca de las actividades de ese día, no solo «Desayuno» genérico.\n` +
    `Explícamelo en texto claro y prepara los cambios para el botón «Aplicar cambios».`
  );
}
