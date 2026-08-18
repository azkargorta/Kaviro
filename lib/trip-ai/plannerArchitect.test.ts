import { describe, expect, it } from "vitest";
import {
  architectureFromStays,
  buildArchitectPrompt,
  formatTripArchitectureForChat,
  omittedSleepBases,
  parseTripArchitecture,
  remapArchitectureToKnownStops,
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
    expect(prompt).toMatch(/Cafayate/);
    expect(prompt).toMatch(/4\.5 h/);
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
    expect(parsed.stays).toEqual([
      { stop: "Salta", nights: 1 },
      { stop: "Tilcara", nights: 1 },
    ]);
    expect(parsed.reasoning).toBe("respuesta parcial");
  });

  it("ignora un stays que aplasta todo a Salta y lee las noches de los días", () => {
    const fallback: TripArchitecture = {
      days: [
        {
          dayNum: 1,
          date: "2026-12-06",
          dayType: "arrival",
          base: "Salta",
          summary: "Llegada.",
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
          summary: "Ruta a Cafayate.",
          transferFrom: "Salta",
          transferTo: "Cafayate",
          mainActivities: ["Quebrada de las Conchas"],
          availableHours: 8,
          notes: null,
        },
      ],
      stays: [
        { stop: "Salta", nights: 1 },
        { stop: "Cafayate", nights: 1 },
      ],
      reasoning: "fallback",
    };

    const parsed = parseTripArchitecture(
      {
        days: fallback.days,
        stays: [{ stop: "Salta", nights: 6 }],
        reasoning: "Valle y Quebrada.",
      },
      fallback
    );

    expect(parsed.stays.map((s) => s.stop)).toEqual(["Salta", "Cafayate"]);
    expect(parsed.days[1]?.base).toBe("Cafayate");
  });

  it("no pega el resumen de Cafayate sobre una noche que pasó a Salta", () => {
    const previous: TripArchitecture = {
      reasoning: "Valle primero.",
      stays: [
        { stop: "Salta", nights: 1 },
        { stop: "Cafayate", nights: 1 },
      ],
      days: [
        {
          dayNum: 1,
          date: "2026-12-06",
          dayType: "arrival",
          base: "Salta",
          summary: "Llegada 20:00 y descanso.",
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
          summary: "Ruta Salta → Cafayate. El trayecto forma parte del viaje y admite paradas.",
          transferFrom: "Salta",
          transferTo: "Cafayate",
          mainActivities: ["Quebrada de las Conchas"],
          availableHours: 8,
          notes: null,
        },
      ],
    };

    const next = architectureFromStays({
      stays: [{ stop: "Salta", nights: 2 }],
      startDate: "2026-12-06",
      totalDays: 2,
      previous,
    });

    expect(next.days.every((d) => d.base === "Salta")).toBe(true);
    expect(next.days[1]?.summary).not.toMatch(/Cafayate/);
    expect(next.days[1]?.mainActivities).toEqual([]);
  });

  it("escribe el esqueleto del viaje para el chat, con anclas y noches", () => {
    const arch: TripArchitecture = {
      reasoning: "Valle Calchaquí primero, Quebrada después.",
      stays: [
        { stop: "Salta", nights: 1 },
        { stop: "Cafayate", nights: 2 },
      ],
      days: [
        {
          dayNum: 1,
          date: "2026-12-06",
          dayType: "arrival",
          base: "Salta",
          summary: "Llegada 20:00 y descanso.",
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
          summary: "Ruta panorámica hacia el valle.",
          transferFrom: "Salta",
          transferTo: "Cafayate",
          mainActivities: ["Quebrada de las Conchas"],
          availableHours: 8,
          notes: null,
        },
      ],
    };

    const text = formatTripArchitectureForChat(arch);
    expect(text).toMatch(/Así organizaría el viaje/);
    expect(text).toMatch(/Valle Calchaquí primero/);
    expect(text).toMatch(/Día 1 · 2026-12-06 · Llegada · duermes en Salta/);
    expect(text).toMatch(/Día 2 · 2026-12-07 · Traslado con paradas · duermes en Cafayate · Salta → Cafayate/);
    expect(text).toMatch(/Ancla: Quebrada de las Conchas/);
    expect(text).toMatch(/itinerario detallado/);
  });

  it("reconstruye el esqueleto tras cambiar noches y conserva anclas si la base sigue igual", () => {
    const previous: TripArchitecture = {
      reasoning: "Cafayate antes que la Quebrada.",
      stays: [{ stop: "Cafayate", nights: 2 }],
      days: [
        {
          dayNum: 1,
          date: "2026-12-06",
          dayType: "arrival",
          base: "Cafayate",
          summary: "Llegada.",
          transferFrom: null,
          transferTo: null,
          mainActivities: ["Bodega El Esteco"],
          availableHours: 1,
          notes: null,
        },
        {
          dayNum: 2,
          date: "2026-12-07",
          dayType: "full",
          base: "Cafayate",
          summary: "Vino y pueblos.",
          transferFrom: null,
          transferTo: null,
          mainActivities: ["Molinos"],
          availableHours: 9,
          notes: null,
        },
      ],
    };

    const next = architectureFromStays({
      stays: [
        { stop: "Cafayate", nights: 1 },
        { stop: "Salta", nights: 1 },
      ],
      startDate: "2026-12-06",
      totalDays: 2,
      previous,
    });

    expect(next.days[0]?.base).toBe("Cafayate");
    expect(next.days[0]?.mainActivities).toEqual(["Bodega El Esteco"]);
    expect(next.days[1]?.base).toBe("Salta");
    expect(next.days[1]?.dayType).toBe("departure");
    expect(next.days[1]?.summary).not.toMatch(/Vino y pueblos/);
    expect(next.days[1]?.mainActivities).toEqual([]);
    expect(next.stays.map((s) => s.stop)).toEqual(["Cafayate", "Salta"]);
  });

  it("remapea Cafayate, Salta a Cafayate y detecta bases pedidas que no tienen noche", () => {
    const arch: TripArchitecture = {
      reasoning: null,
      stays: [{ stop: "Salta", nights: 2 }],
      days: [
        {
          dayNum: 1,
          date: "2026-12-06",
          dayType: "arrival",
          base: "Salta",
          summary: "Llegada.",
          transferFrom: null,
          transferTo: null,
          mainActivities: [],
          availableHours: 1,
          notes: null,
        },
        {
          dayNum: 2,
          date: "2026-12-07",
          dayType: "full",
          base: "Cafayate, Salta",
          summary: "Valle.",
          transferFrom: "Salta",
          transferTo: "Cafayate, Salta",
          mainActivities: ["Quebrada de las Conchas"],
          availableHours: 8,
          notes: null,
        },
      ],
    };

    const remapped = remapArchitectureToKnownStops(arch, ["Salta", "Cafayate", "Tilcara"]);
    expect(remapped.days[1]?.base).toBe("Cafayate");
    expect(remapped.days[1]?.transferTo).toBe("Cafayate");
    expect(remapped.stays.map((s) => s.stop)).toEqual(["Salta", "Cafayate"]);
    expect(omittedSleepBases(remapped.days, ["Salta", "Cafayate", "Tilcara"], ["Salta", "Cafayate", "Tilcara"])).toEqual([
      "Tilcara",
    ]);
  });
});
