import { describe, expect, it } from "vitest";
import {
  minSightsForDriveKm,
  notesWantSightsOnTransferDays,
  pointIsAlongRoute,
  scheduleAlongTransfer,
  shouldKeepPoiOnTransferDay,
} from "@/lib/trip-ai/plannerTransferSights";

const SALTA = { lat: -24.7859, lng: -65.4117 };
const CAFAYATE = { lat: -26.0731, lng: -65.9761 };
const TILCARA = { lat: -23.5767, lng: -65.3934 };
const ANFITEATRO = { lat: -25.85, lng: -65.88 };

describe("plannerTransferSights", () => {
  it("un traslado de 3-4 h pide 2 visitas en ruta, no un día lleno en destino", () => {
    expect(minSightsForDriveKm(150)).toBe(2);
    expect(minSightsForDriveKm(350)).toBe(1);
    expect(minSightsForDriveKm(600)).toBe(1);
  });

  it("detecta que el viajero pide visitas en días de traslado", () => {
    expect(
      notesWantSightsOnTransferDays("los dias de traslado tambien quiero visitar sitios de camino")
    ).toBe(true);
    expect(notesWantSightsOnTransferDays("el dia 3 y el dia 6 quiero que añadas cosas que ver")).toBe(true);
    expect(notesWantSightsOnTransferDays("menos museos, más vida local")).toBe(false);
  });

  it("mantiene paradas de la quebrada en Cafayate → Salta", () => {
    expect(pointIsAlongRoute(ANFITEATRO, CAFAYATE, SALTA)).toBe(true);
    expect(
      shouldKeepPoiOnTransferDay(ANFITEATRO, SALTA, CAFAYATE, [{ label: "Tilcara", center: TILCARA }], "Cafayate")
    ).toBe(true);
  });

  it("en un cruce de 7 h solo deja 1 parada en ruta, no un día lleno en destino", () => {
    const scheduled = scheduleAlongTransfer(
      [
        { activity_kind: "transport", title: "Traslado", activity_time: "08:30" },
        { activity_kind: "nature", title: "Garganta del Diablo", latitude: -25.85, longitude: -65.88, activity_time: "09:30" },
        { activity_kind: "culture", title: "Pucará de Tilcara", latitude: -23.58, longitude: -65.39, activity_time: "17:30" },
        { activity_kind: "culture", title: "Purmamarca", latitude: -23.75, longitude: -65.48, activity_time: "16:00" },
      ],
      CAFAYATE,
      TILCARA,
      7
    );
    const sights = scheduled.filter((it) => it.activity_kind !== "transport");
    expect(sights.length).toBe(1);
    expect(sights[0]?.title).toMatch(/Garganta|Parada en ruta/i);
  });

  it("no cuela Tilcara en un traslado Cafayate → Salta", () => {
    expect(pointIsAlongRoute(TILCARA, CAFAYATE, SALTA, 55)).toBe(false);
    expect(
      shouldKeepPoiOnTransferDay(TILCARA, SALTA, CAFAYATE, [{ label: "Tilcara", center: TILCARA }], "Cafayate")
    ).toBe(false);
  });
});