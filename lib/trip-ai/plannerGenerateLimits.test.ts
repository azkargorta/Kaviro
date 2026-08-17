import { describe, expect, it } from "vitest";
import { PLANNER_MAX_DAYS, daysPerGeminiCall, plannerDaysTooLong } from "@/lib/trip-ai/plannerGenerateLimits";

describe("plannerGenerateLimits", () => {
  it("un mes cabe; 32 días no", () => {
    expect(plannerDaysTooLong(PLANNER_MAX_DAYS)).toBe(false);
    expect(plannerDaysTooLong(32)).toBe(true);
  });

  it("agrupa más días por llamada en viajes largos", () => {
    expect(daysPerGeminiCall(6)).toBe(3);
    expect(daysPerGeminiCall(14)).toBe(4);
    expect(daysPerGeminiCall(31)).toBe(5);
    expect(Math.ceil(31 / daysPerGeminiCall(31))).toBeLessThanOrEqual(7);
  });
});
