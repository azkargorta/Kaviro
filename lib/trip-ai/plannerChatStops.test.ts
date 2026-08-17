import { describe, expect, it } from "vitest";
import { chatWantsNewSleepPlan, extraStopsFromChat, uniquePlaces } from "@/lib/trip-ai/plannerChatStops";

describe("plannerChatStops", () => {
  it("saca ciudades de un plan de noches", () => {
    const msg =
      "quiero dormir el dia 6 y 10 en salta, el dia 7 en cafayate y los dias 8 y 9 en tilcara";
    expect(extraStopsFromChat(msg)).toEqual(["Salta", "Cafayate", "Tilcara"]);
    expect(chatWantsNewSleepPlan(msg)).toBe(true);
  });

  it("no trata el coche como destino", () => {
    expect(extraStopsFromChat("vamos en coche de alquiler")).toEqual([]);
  });

  it("une destinos sin repetir", () => {
    expect(uniquePlaces(["Salta"], ["salta", "Tilcara"], ["Cafayate"])).toEqual([
      "Salta",
      "Tilcara",
      "Cafayate",
    ]);
  });
});
