import { describe, expect, it } from "vitest";
import { buildSkeletonFromNightOverrides, extractNightOverrides } from "./architect";
import type { TripBrief } from "./types";

const brief: TripBrief = {
  destinations: ["Salta"],
  sleepBases: ["Salta", "Cafayate", "Tilcara"],
  startDate: "2026-12-06",
  endDate: "2026-12-11",
  arrival: { place: "Salta", date: "2026-12-06", time: "20:00" },
  departure: { place: "Salta", date: "2026-12-11", time: null },
  transport: "driving",
  pace: "balanced",
  travelersType: "couple",
  travelerCount: 2,
  interests: [],
  avoid: [],
  mustDo: [],
  constraints: [],
  freeText: "Ritmo equilibrado: 2-4 anclas al día, con margen para comer y traslados.",
};

describe("extractNightOverrides", () => {
  it("solo lee mensajes del chat y no confunde texto de entrevista", () => {
    const overrides = extractNightOverrides(brief, brief.sleepBases, [
      "6/12 - Salta",
      "7/12 - Cafayate",
      "8/12 - Tilcara",
      "9/12 - Tilcara",
      "10/12 - Salta",
    ].join("\n"));

    expect(overrides).toHaveLength(5);
    expect(overrides.find((o) => o.date === "2026-12-07")?.base).toBe("Cafayate");
  });

  it("ignora ciudades que no están en las bases permitidas", () => {
    const overrides = extractNightOverrides(brief, brief.sleepBases, "8/12 - Purmamarca");
    expect(overrides).toHaveLength(0);
  });
});

describe("buildSkeletonFromNightOverrides", () => {
  it("respeta el reparto de noches del chat y rellena el último día", () => {
    const overrides = extractNightOverrides(brief, brief.sleepBases, [
      "6/12 - Salta",
      "7/12 - Cafayate",
      "8/12 - Tilcara",
      "9/12 - Tilcara",
      "10/12 - Salta",
    ].join("\n"));

    const skeleton = buildSkeletonFromNightOverrides(brief, overrides, brief.sleepBases);
    expect(skeleton.days.map((d) => d.base)).toEqual([
      "Salta",
      "Cafayate",
      "Tilcara",
      "Tilcara",
      "Salta",
      "Salta",
    ]);
  });
});
