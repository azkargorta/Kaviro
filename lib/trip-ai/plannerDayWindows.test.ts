import { describe, expect, it } from "vitest";
import { parseClockFromNotes, windowForTripDay, itemFitsWindow, clipItemsToDayWindow } from "@/lib/trip-ai/plannerDayWindows";

describe("plannerDayWindows", () => {
  it("llegada a las 20:00: el primer día no admite visitas a las 10:00", () => {
    const w = windowForTripDay({ dayIndex: 1, totalDays: 6, arrivalTime: "20:00" });
    expect(w.minSights).toBe(0);
    expect(w.maxSights).toBeLessThanOrEqual(1);
    expect(itemFitsWindow("10:00", w)).toBe(false);
    expect(itemFitsWindow("20:45", w)).toBe(true);
  });

  it("un día intermedio no se trata como llegada aunque el vuelo sea a las 20:00", () => {
    const w = windowForTripDay({ dayIndex: 3, totalDays: 6, arrivalTime: "20:00", departureTime: "20:00" });
    expect(w.minSights).toBe(3);
    expect(itemFitsWindow("10:00", w)).toBe(true);
  });

  it("conserva el descanso de llegada aunque no haya visitas", () => {
    const w = windowForTripDay({ dayIndex: 1, totalDays: 6, arrivalTime: "20:00" });
    const clipped = clipItemsToDayWindow(
      [
        { activity_kind: "rest", activity_time: "21:00" },
        { activity_kind: "culture", activity_time: "10:00" },
      ],
      w
    );
    expect(clipped).toHaveLength(1);
    expect(clipped[0]?.activity_kind).toBe("rest");
  });

  it("salida a las 20:00: el último día corta por la tarde", () => {
    const w = windowForTripDay({ dayIndex: 6, totalDays: 6, departureTime: "20:00" });
    expect(itemFitsWindow("16:30", w)).toBe(true);
    expect(itemFitsWindow("19:30", w)).toBe(false);
  });

  it("lee la hora de las notas de llegada", () => {
    expect(
      parseClockFromNotes(
        "Llegada a Aeropuerto de Salta (2026-12-06 20:00). El primer día es de llegada.",
        "llegada"
      )
    ).toBe("20:00");
  });

  it("lee una llegada expresada de forma coloquial", () => {
    expect(parseClockFromNotes("Llego al aeropuerto el primer día a las 20:00.", "llegada")).toBe("20:00");
  });
});
