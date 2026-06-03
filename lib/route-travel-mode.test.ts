import { describe, expect, it } from "vitest";
import {
  applyTravelModeToOsrmMetrics,
  inferDayPlanTravelModeFromHint,
  normalizeDayPlanTravelMode,
} from "@/lib/route-travel-mode";

describe("applyTravelModeToOsrmMetrics", () => {
  it("corrige duración de coche cuando el modo es a pie", () => {
    const adjusted = applyTravelModeToOsrmMetrics("WALKING", {
      distanceMeters: 23_000,
      durationSeconds: 30 * 60,
    });
    expect(adjusted.durationAdjusted).toBe(true);
    expect(adjusted.durationSeconds).toBeGreaterThan(2 * 3600);
  });

  it("acepta transporte público en el plan del día", () => {
    expect(normalizeDayPlanTravelMode("transit")).toBe("transit");
    expect(inferDayPlanTravelModeFromHint("vamos en metro y bus")).toBe("transit");
  });

  it("mantiene duración coherente en coche", () => {
    const adjusted = applyTravelModeToOsrmMetrics("DRIVING", {
      distanceMeters: 23_000,
      durationSeconds: 30 * 60,
    });
    expect(adjusted.durationAdjusted).toBeFalsy();
    expect(adjusted.durationSeconds).toBe(30 * 60);
  });
});
