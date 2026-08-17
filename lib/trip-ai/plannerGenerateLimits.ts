/** Tope del planificador: un mes cabe; más días disparan timeout en serverless. */
export const PLANNER_MAX_DAYS = 31;

/** Tandas de Gemini en paralelo dentro de la misma ciudad. */
export const PLANNER_CHUNK_CONCURRENCY = 2;

/**
 * Días por llamada a Gemini. Más noches → tandas más gordas para no encadenar 15 llamadas.
 * 6 días → 3 tandas; 14 → 4; 31 → 5 (unas 7 tandas, ~4 oleadas en paralelo).
 */
export function daysPerGeminiCall(nights: number): number {
  const n = Math.max(1, Math.round(nights));
  if (n <= 4) return 2;
  if (n <= 10) return 3;
  if (n <= 16) return 4;
  return 5;
}

export function plannerDaysTooLong(totalDays: number): boolean {
  return totalDays > PLANNER_MAX_DAYS;
}

export const PLANNER_MAX_DAYS_MESSAGE =
  `El planificador genera como máximo ${PLANNER_MAX_DAYS} días (un mes). Acorta las fechas o parte el viaje en dos.`;
