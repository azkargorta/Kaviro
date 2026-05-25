import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  consumePlanSuggestionNextSlot,
  getCachedPlanSuggestion,
  peekPlanSuggestionNextRemaining,
  planSuggestionCacheKey,
  setCachedPlanSuggestion,
} from "./plan-suggestion-guard";
import { PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR } from "./plan-suggestion-constants";

describe("planSuggestionCacheKey", () => {
  it("diferencia exclusiones", () => {
    const a = planSuggestionCacheKey("t1", "2026-06-01", ["A"]);
    const b = planSuggestionCacheKey("t1", "2026-06-01", ["B"]);
    expect(a).not.toBe(b);
  });
});

describe("plan suggestion cache", () => {
  it("guarda y recupera sugerencias", () => {
    const key = planSuggestionCacheKey("trip", "2026-01-01", []);
    expect(getCachedPlanSuggestion(key)).toBeUndefined();
    setCachedPlanSuggestion(key, "Añadir comida");
    expect(getCachedPlanSuggestion(key)).toBe("Añadir comida");
  });
});

describe("plan suggestion rate limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));
  });

  it("limita clics Siguiente por hora", () => {
    const userId = "u1";
    const tripId = "t1";
    expect(peekPlanSuggestionNextRemaining(userId, tripId)).toBe(PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR);

    for (let i = 0; i < PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR; i += 1) {
      const slot = consumePlanSuggestionNextSlot(userId, tripId);
      expect(slot.allowed).toBe(true);
    }

    const blocked = consumePlanSuggestionNextSlot(userId, tripId);
    expect(blocked.allowed).toBe(false);
    expect(peekPlanSuggestionNextRemaining(userId, tripId)).toBe(0);
  });
});
