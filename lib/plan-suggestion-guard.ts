/** Máximo de clics «Siguiente» por viaje y hora (por usuario). */
export { PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR, PLAN_SUGGESTION_CACHE_TTL_MS, PLAN_SUGGESTION_MAX_OUTPUT_TOKENS } from "@/lib/plan-suggestion-constants";

import { PLAN_SUGGESTION_CACHE_TTL_MS, PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR } from "@/lib/plan-suggestion-constants";

const RATE_WINDOW_MS = 60 * 60 * 1000;

type CacheEntry = { suggestion: string | null; expiresAt: number };
type RateBucket = { count: number; windowStart: number };

const responseCache = new Map<string, CacheEntry>();
const nextRateBuckets = new Map<string, RateBucket>();

export function planSuggestionCacheKey(tripId: string, date: string, exclude: string[]) {
  const ex = exclude.length > 0 ? exclude.join("\n") : "";
  return `${tripId}:${date || "all"}:${ex}`;
}

/** `undefined` = sin entrada; `null` = entrada cacheada «sin sugerencia». */
export function getCachedPlanSuggestion(key: string): string | null | undefined {
  const entry = responseCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return undefined;
  }
  if (entry.suggestion == null || entry.suggestion === "") return undefined;
  return entry.suggestion;
}

export function setCachedPlanSuggestion(key: string, suggestion: string | null) {
  responseCache.set(key, { suggestion, expiresAt: Date.now() + PLAN_SUGGESTION_CACHE_TTL_MS });
}

export function consumePlanSuggestionNextSlot(
  userId: string,
  tripId: string
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const key = `${userId}:${tripId}`;
  const now = Date.now();
  let bucket = nextRateBuckets.get(key);
  if (!bucket || now - bucket.windowStart >= RATE_WINDOW_MS) {
    bucket = { count: 0, windowStart: now };
  }

  const retryAfterMs = Math.max(0, RATE_WINDOW_MS - (now - bucket.windowStart));

  if (bucket.count >= PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR) {
    nextRateBuckets.set(key, bucket);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  bucket.count += 1;
  nextRateBuckets.set(key, bucket);
  return {
    allowed: true,
    remaining: Math.max(0, PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR - bucket.count),
    retryAfterMs: 0,
  };
}

export function peekPlanSuggestionNextRemaining(userId: string, tripId: string): number {
  const key = `${userId}:${tripId}`;
  const now = Date.now();
  const bucket = nextRateBuckets.get(key);
  if (!bucket || now - bucket.windowStart >= RATE_WINDOW_MS) {
    return PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR;
  }
  return Math.max(0, PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR - bucket.count);
}
