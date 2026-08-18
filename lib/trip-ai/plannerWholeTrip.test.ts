import { describe, expect, it } from "vitest";
import { emptyPlannerBrief } from "@/lib/trip-ai/plannerBrief";
import type { TripArchitecture } from "@/lib/trip-ai/plannerArchitect";
import { buildWholeTripPrompt, parseWholeTripDays } from "@/lib/trip-ai/plannerWholeTrip";

const architecture: TripArchitecture = {
  days: [
    {
      dayNum: 1,
      date: "2026-12-06",
      dayType: "arrival",
      base: "Salta",
      summary: "Llegada",
      transferFrom: null,
      transferTo: null,
      mainActivities: [],
      availableHours: 1,
      notes: null,
    },
    {
      dayNum: 2,
      date: "2026-12-07",
      dayType: "transfer_scenic",
      base: "Cafayate",
      summary: "Ruta sur",
      transferFrom: "Salta",
      transferTo: "Cafayate",
      mainActivities: ["Quebrada de las Conchas"],
      availableHours: 6,
      notes: null,
    },
  ],
  stays: [
    { stop: "Salta", nights: 1 },
    { stop: "Cafayate", nights: 1 },
  ],
  reasoning: "test",
};

describe("plannerWholeTrip", () => {
  it("pide un viaje entero, no un bloque de ciudad, y mete horas de coche", () => {
    const brief = emptyPlannerBrief();
    brief.interests = ["naturaleza", "pueblos"];
    brief.pace = "intense";
    const prompt = buildWholeTripPrompt({
      brief,
      notes: "Coche, llegada 20:00",
      stops: [
        { label: "Salta", center: { lat: -24.78, lng: -65.41 } },
        { label: "Cafayate", center: { lat: -26.07, lng: -65.97 } },
      ],
      architecture,
      totalDays: 2,
      startDate: "2026-12-06",
      endDate: "2026-12-07",
      arrivalTime: "20:00",
      departureTime: "20:00",
    });
    expect(prompt).toMatch(/viaje ENTERO/i);
    expect(prompt).toMatch(/NO rellenes con museos municipales/);
    expect(prompt).toMatch(/Salta ↔ Cafayate/);
    expect(prompt).toMatch(/naturaleza/);
    expect(prompt).not.toMatch(/Guía local experto de/);
  });

  it("parsea días compactos y rellena los que faltan desde el esqueleto", () => {
    const days = parseWholeTripDays(
      {
        days: [
          {
            day: 2,
            date: "2026-12-07",
            base: "Cafayate",
            items: [{ t: "Quebrada de las Conchas", d: "Parada en ruta", h: "11:00", k: "nature", lt: -25.9, lg: -65.9 }],
          },
        ],
      },
      { startDate: "2026-12-06", totalDays: 2, architecture }
    );
    expect(days).toHaveLength(2);
    expect(days[0]?.base).toBe("Salta");
    expect(days[1]?.items[0]?.title).toBe("Quebrada de las Conchas");
  });
});
