import { describe, expect, it } from "vitest";
import { buildPlanFullTripAnalysisChatPrompt } from "./trip-assistant-events";

describe("buildPlanFullTripAnalysisChatPrompt", () => {
  it("pide análisis de todos los días con diff único", () => {
    const prompt = buildPlanFullTripAnalysisChatPrompt({
      tripName: "Tokio 2026",
      focusDate: "2026-05-26",
    });
    expect(prompt).toMatch(/todos/i);
    expect(prompt).toMatch(/Aplicar cambios/i);
    expect(prompt).not.toMatch(/TRIPBOARD_DIFF/i);
    expect(prompt).toMatch(/2026-05-26/);
    expect(prompt).toMatch(/Tokio 2026/);
  });
});
