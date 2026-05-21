import { describe, expect, it } from "vitest";
import {
  allowsNearbyExcursions,
  enrichNotesWithPlannerPrefs,
  parsePlannerPreferences,
} from "./plannerPreferences";

describe("plannerPreferences", () => {
  it("parsea preferencias del body", () => {
    const p = parsePlannerPreferences({
      plannerPreferences: {
        nearbyExcursions: "no",
        mixStylesWhenTime: false,
        tripStyle: "nature",
        suggestRestaurants: true,
        restaurantBudget: "high",
      },
    });
    expect(p.nearbyExcursions).toBe("no");
    expect(p.mixStylesWhenTime).toBe(false);
    expect(p.tripStyle).toBe("nature");
    expect(p.suggestRestaurants).toBe(true);
    expect(p.restaurantBudget).toBe("high");
    expect(allowsNearbyExcursions(p)).toBe(false);
  });

  it("enriquece notas con estilo y excursiones", () => {
    const notes = enrichNotesWithPlannerPrefs("ritmo tranquilo", {
      nearbyExcursions: "yes",
      mixStylesWhenTime: true,
      tripStyle: "nature",
      suggestRestaurants: true,
      restaurantBudget: "medium",
    });
    expect(notes).toMatch(/naturaleza/i);
    expect(notes).toMatch(/excursiones/i);
    expect(notes).toMatch(/complementarias/i);
  });
});
