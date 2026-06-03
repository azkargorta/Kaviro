/**
 * Rate limiting en memoria (Edge middleware).
 * En despliegues multi-instancia cada nodo tiene su propio contador; suficiente como primera línea de defensa.
 */

export type RateLimitPreset = {
  maxCalls: number;
  windowMs: number;
  message: string;
};

export const RATE_LIMIT_PRESETS = {
  ai: {
    maxCalls: 12,
    windowMs: 60_000,
    message: "Demasiadas peticiones al asistente. Espera un momento antes de continuar.",
  },
  ocr: {
    maxCalls: 6,
    windowMs: 60_000,
    message: "Demasiados análisis de documentos. Espera un minuto e inténtalo de nuevo.",
  },
  share: {
    maxCalls: 40,
    windowMs: 60_000,
    message: "Demasiadas consultas a este enlace compartido. Espera un momento.",
  },
  geocode: {
    maxCalls: 45,
    windowMs: 60_000,
    message: "Demasiadas búsquedas de lugares. Espera un momento.",
  },
  contact: {
    maxCalls: 5,
    windowMs: 3_600_000,
    message: "Has enviado demasiadas solicitudes. Inténtalo más tarde.",
  },
} as const satisfies Record<string, RateLimitPreset>;

export type RateLimitPresetId = keyof typeof RATE_LIMIT_PRESETS;

type Entry = { count: number; resetAt: number };

const stores = new Map<RateLimitPresetId, Map<string, Entry>>();

let lastCleanup = Date.now();

function getStore(presetId: RateLimitPresetId): Map<string, Entry> {
  let store = stores.get(presetId);
  if (!store) {
    store = new Map();
    stores.set(presetId, store);
  }
  return store;
}

export function maybeCleanupRateLimitStores(): void {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;
  for (const store of stores.values()) {
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  }
}

export function checkRateLimit(
  presetId: RateLimitPresetId,
  key: string
): { allowed: boolean; remaining: number; resetIn: number; preset: RateLimitPreset } {
  const preset = RATE_LIMIT_PRESETS[presetId];
  const store = getStore(presetId);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + preset.windowMs });
    return { allowed: true, remaining: preset.maxCalls - 1, resetIn: preset.windowMs, preset };
  }

  if (entry.count >= preset.maxCalls) {
    return { allowed: false, remaining: 0, resetIn: Math.max(0, entry.resetAt - now), preset };
  }

  entry.count += 1;
  return { allowed: true, remaining: preset.maxCalls - entry.count, resetIn: entry.resetAt - now, preset };
}

export function rateLimit429Headers(remaining: number, resetIn: number, preset: RateLimitPreset) {
  return {
    "Retry-After": String(Math.ceil(resetIn / 1000)),
    "X-RateLimit-Limit": String(preset.maxCalls),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "X-RateLimit-Reset": String(Math.ceil((Date.now() + resetIn) / 1000)),
  };
}
