import { describe, expect, it } from "vitest";
import {
  allowsNearbyExcursions,
  enrichNotesWithPlannerPrefs,
  parsePlannerPreferences,
} from "./plannerPreferences";

describe("plannerPreferences", () => {
  it("parsea preferencias del body", () => {
    const p = parsePlannerPreferences({
      plannerPreferences: { nearbyExcursions: "no", mixStylesWhenTime: false, tripStyle: "nature" },
    });
    expect(p.nearbyExcursions).toBe("no");
    expect(p.mixStylesWhenTime).toBe(false);
    expect(p.tripStyle).toBe("nature");
    expect(allowsNearbyExcursions(p)).toBe(false);
  });

  it("enriquece notas con estilo y excursiones", () => {
    const notes = enrichNotesWithPlannerPrefs("ritmo tranquilo", {
      nearbyExcursions: "yes",
      mixStylesWhenTime: true,
      tripStyle: "nature",
    });
    expect(notes).toMatch(/naturaleza/i);
    expect(notes).toMatch(/excursiones/i);
    expect(notes).toMatch(/complementarias/i);
  });
});
