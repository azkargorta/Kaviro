import { describe, expect, it } from "vitest";
import { DEFAULT_TRIP_AUTO_CONFIG, normalizeTripAutoConfig } from "@/lib/trip-ai/tripAutoConfig";

describe("normalizeTripAutoConfig", () => {
  it("devuelve defaults con input vacío", () => {
    expect(normalizeTripAutoConfig(null)).toEqual(DEFAULT_TRIP_AUTO_CONFIG);
  });

  it("normaliza pace y lodging", () => {
    const cfg = normalizeTripAutoConfig({
      pace: { itemsPerDayMin: 2, itemsPerDayMax: 8 },
      lodging: { mode: "manual", baseCityMode: "single", baseCity: "Madrid" },
      routes: { enabled: false },
    });
    expect(cfg.pace.itemsPerDayMin).toBe(2);
    expect(cfg.pace.itemsPerDayMax).toBe(8);
    expect(cfg.lodging.mode).toBe("manual");
    expect(cfg.lodging.baseCity).toBe("Madrid");
    expect(cfg.routes.enabled).toBe(false);
  });
});
