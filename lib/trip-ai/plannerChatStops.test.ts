import { describe, expect, it } from "vitest";
import {
  chatWantsNewSleepPlan,
  extraStopsFromChat,
  parseSleepAssignmentsFromChat,
  resolveChatDayNumber,
  uniquePlaces,
} from "@/lib/trip-ai/plannerChatStops";

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

describe("parseSleepAssignmentsFromChat", () => {
  const trip = {
    startDate: "2026-12-06",
    endDate: "2026-12-11",
    knownPlaces: ["Salta", "Cafayate", "Tilcara"],
    hubPlace: "Aeropuerto de Salta",
  };

  it("usa el día del calendario, no el índice del itinerario", () => {
    expect(resolveChatDayNumber(6, trip.startDate, trip.endDate)).toBe(1);
    expect(resolveChatDayNumber(11, trip.startDate, trip.endDate)).toBe(6);
    expect(resolveChatDayNumber(1, trip.startDate, trip.endDate)).toBe(1);
  });

  it("respeta noches sueltas y '6y 10' sin espacio", () => {
    const parsed = parseSleepAssignmentsFromChat(
      "voy a dormir el 6y 10 en salta, el 7 en cafayate y el 8 y 9 en tilcara",
      trip
    );
    expect(parsed?.stays.map((s) => ({ stop: s.stop, nights: s.nights }))).toEqual([
      { stop: "Salta", nights: 1 },
      { stop: "Cafayate", nights: 1 },
      { stop: "Tilcara", nights: 2 },
      { stop: "Salta", nights: 2 },
    ]);
  });

  it("rellena el día de salida con el hub si no se menciona", () => {
    const parsed = parseSleepAssignmentsFromChat(
      "dormir el 6 y 10 en salta, el 7 en cafayate y los dias 8 y 9 en tilcara",
      trip
    );
    expect(parsed?.stays.at(-1)).toMatchObject({ stop: "Salta", nights: 2 });
  });

  it("sin fechas explícitas deja que el servidor elija la ruta", () => {
    expect(
      parseSleepAssignmentsFromChat("quiero dormir en cafayate y tilcara", trip)
    ).toBeNull();
  });
});
