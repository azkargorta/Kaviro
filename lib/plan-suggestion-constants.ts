/** Máximo de clics «Siguiente» por viaje y hora (por usuario). */
export const PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR = 5;

/** TTL de caché en servidor para la misma petición (viaje + día + exclusiones). */
export const PLAN_SUGGESTION_CACHE_TTL_MS = 30 * 60 * 1000;

/** Tokens máximos de salida en la API de sugerencia del plan. */
export const PLAN_SUGGESTION_MAX_OUTPUT_TOKENS = 64;
