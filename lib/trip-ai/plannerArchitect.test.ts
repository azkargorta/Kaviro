import { describe, expect, it } from "vitest";
import {
  buildArchitectPrompt,
  parseTripArchitecture,
  type TripArchitecture,
} from "@/lib/trip-ai/plannerArchitect";
import { emptyPlannerBrief } from "@/lib/trip-ai/plannerBrief";

describe("plannerArchitect", () => {
  it("incluye en el prompt las noches forzadas y las horas de llegada/salida", () => {
    const brief = emptyPlannerBrief();
    brief.sleepBases = ["Salta", "Tilcara", "Cafayate"];
    const prompt = buildArchitectPrompt({
      brief,
      notes: "Viaje en coche con rutas panorámicas.",
      stops: [
        { label: "Salta", center: { lat: -24.78, lng: -65.41 } },
        { label: "Tilcara", center: { lat: -23.57, lng: -65.39 } },
        { label: "Cafayate", center: { lat: -26.07, lng: -65.97 } },
      ],
      totalDays: 6,
      startDate: "2026-12-06",
      endDate: "2026-12-11",
      arrivalTime: "20:00",
      departureTime: "20:00",
      forcedStays: [
        { stop: "Salta", nights: 1 },
        { stop: "Tilcara", nights: 2 },
        { stop: "Salta", nights: 1 },
        { stop: "Cafayate", nights: 1 },
      ],
    });
    expect(prompt).toMatch(/20:00/);
    expect(prompt).toMatch(/Salta \(1 noches\), Tilcara \(2 noches\)/);
    expect(prompt).toMatch(/Travel Architect/i);
  });

  it("parsea el JSON del arquitecto y cae al fallback si faltan días", () => {
    const fallback: TripArchitecture = {
      days: [
        {
          dayNum: 1,
          date: "2026-12-06",
          dayType: "arrival",
          base: "Salta",
          summary: "Llegada y descanso.",
          transferFrom: null,
          transferTo: null,
          mainActivities: [],
          availableHours: 1,
          notes: "No meter visitas",
        },
        {
          dayNum: 2,
          date: "2026-12-07",
          dayType: "transfer_scenic",
          base: "Tilcara",
          summary: "Ruta panorámica.",
          transferFrom: "Salta",
          transferTo: "Tilcara",
          mainActivities: ["Purmamarca"],
          availableHours: 8,
          notes: null,
        },
      ],
      stays: [
        { stop: "Salta", nights: 1 },
        { stop: "Tilcara", nights: 1 },
      ],
      reasoning: "fallback",
    };

    const parsed = parseTripArchitecture(
      {
        days: [
          {
            dayNum: 1,
            date: "2026-12-06",
            dayType: "arrival",
            base: "Salta",
            summary: "Llegada 20:00.",
            mainActivities: [],
            availableHours: 1,
          },
        ],
        stays: [{ stop: "Salta", nights: 1 }],
        reasoning: "respuesta parcial",
      },
      fallback
    );

    expect(parsed.days).toEqual(fallback.days);
    expect(parsed.stays).toEqual([{ stop: "Salta", nights: 1, reason: undefined }]);
    expect(parsed.reasoning).toBe("respuesta parcial");
  });
});
