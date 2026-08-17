import { describe, expect, it } from "vitest";
import {
  analyzeDayLoad,
  buildTripDayPlanningHintsBlock,
  estimateActivityDurationMinutes,
  isLikelyFullDayBlock,
  userAskedToAddActivities,
  userAskedToReplacePlan,
} from "@/lib/trip-ai/tripDayPlanningHints";

describe("tripDayPlanningHints", () => {
  it("detecta bloque de día completo (Disneyland)", () => {
    const a = { title: "Disneyland Paris", activity_date: "2026-07-01", activity_time: "09:00" };
    expect(isLikelyFullDayBlock(a)).toBe(true);
    expect(estimateActivityDurationMinutes(a)).toBeGreaterThanOrEqual(420);
  });

  it("detecta visita corta (mercado)", () => {
    const a = { title: "Mercado de antigüedades", activity_date: "2026-07-02", activity_time: "10:00", activity_kind: "visit" };
    expect(isLikelyFullDayBlock(a)).toBe(false);
    expect(estimateActivityDurationMinutes(a)).toBe(120);
  });

  it("encuentra hueco entre actividades con hora", () => {
    const acts = [
      { title: "Louvre", activity_date: "2026-07-03", activity_time: "10:00", activity_kind: "museum" },
      { title: "Cena", activity_date: "2026-07-03", activity_time: "20:00", activity_kind: "restaurant" },
    ];
    const load = analyzeDayLoad(acts, "2026-07-03");
    expect(load.deadGaps.length).toBeGreaterThan(0);
  });

  it("userAskedToAddActivities detecta petición de rellenar", () => {
    expect(userAskedToAddActivities("¿Puedes añadir más actividades el jueves?")).toBe(true);
    expect(userAskedToAddActivities("¿Qué tiempo hace?")).toBe(false);
  });

  it("userAskedToReplacePlan detecta reemplazo", () => {
    expect(userAskedToReplacePlan("Rehaz todo el plan")).toBe(true);
  });

  it("buildTripDayPlanningHintsBlock pide diff si hay actividades", () => {
    const block = buildTripDayPlanningHintsBlock({
      activities: [{ title: "Museo", activity_date: "2026-07-01", activity_time: "11:00" }],
      userQuestion: "Organiza el viaje",
    });
    expect(block).toContain("KAVIRO_DIFF");
    expect(block).toContain("NO emitas KAVIRO_ITINERARY");
  });
});
