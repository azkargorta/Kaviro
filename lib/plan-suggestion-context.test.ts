import { describe, expect, it } from "vitest";
import { cleanPlanSuggestion, analyzePlanDayGaps, fallbackPlanSuggestionFromGaps } from "./plan-suggestion-context";

describe("cleanPlanSuggestion", () => {
  it("acepta frases imperativas completas", () => {
    expect(cleanPlanSuggestion("Añadir comida entre museo y parque")).toBe("Añadir comida entre museo y parque");
  });

  it("rechaza null y frases incompletas", () => {
    expect(cleanPlanSuggestion("null")).toBeNull();
    expect(cleanPlanSuggestion("Considera añadir")).toBeNull();
    expect(cleanPlanSuggestion("Considera añadir un almuerzo")).toBeNull();
  });
});

describe("analyzePlanDayGaps", () => {
  it("detecta desayuno faltante si la primera actividad es tarde", () => {
    const gaps = analyzePlanDayGaps([
      { title: "Templo Senso-ji", activity_time: "09:30:00", activity_kind: "visit" },
      { title: "Museo Nacional", activity_time: "13:00:00", activity_kind: "museum" },
    ]);
    expect(gaps.some((g) => /desayuno/i.test(g))).toBe(true);
  });

  it("genera fallback de desayuno", () => {
    const suggestion = fallbackPlanSuggestionFromGaps([
      { title: "Templo Senso-ji", activity_time: "09:30:00", activity_kind: "visit" },
      { title: "Museo Nacional", activity_time: "13:00:00", activity_kind: "museum" },
    ]);
    expect(suggestion).toMatch(/desayuno/i);
  });
});
