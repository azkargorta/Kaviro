import { describe, expect, it } from "vitest";
import { cleanPlanSuggestion } from "./plan-suggestion-context";

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
