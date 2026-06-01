import { describe, expect, it } from "vitest";
import { enrichItemFromScheduleSlot, parsePlaceFromScheduleLabel } from "@/lib/trip-ai/scheduleSlotEnrich";

describe("parsePlaceFromScheduleLabel", () => {
  it("extrae hotel tras «en»", () => {
    const out = parsePlaceFromScheduleLabel("Desayuno en Hotel NH Florida");
    expect(out.place_name).toMatch(/NH Florida/i);
    expect(out.title).toMatch(/Desayuno/i);
  });
});

describe("enrichItemFromScheduleSlot", () => {
  it("fuerza hora del dossier y rellena lugar", () => {
    const out = enrichItemFromScheduleSlot(
      { title: "Actividad", start_time: null, place_name: null },
      { time: "07:30", label: "EXCURSION GUIADA BUENOS AIRES SUR", line: "- 07.30h EXCURSION" }
    );
    expect(out.start_time).toBe("07:30");
    expect(out.place_name).toMatch(/BUENOS AIRES/i);
  });
});
