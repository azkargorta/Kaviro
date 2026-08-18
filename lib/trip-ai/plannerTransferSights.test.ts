import { describe, expect, it } from "vitest";
import {
  minSightsForDriveKm,
  notesWantSightsOnTransferDays,
  pointIsAlongRoute,
  shouldKeepPoiOnTransferDay,
} from "@/lib/trip-ai/plannerTransferSights";

const SALTA = { lat: -24.7859, lng: -65.4117 };
const CAFAYATE = { lat: -26.0731, lng: -65.9761 };
const TILCARA = { lat: -23.5767, lng: -65.3934 };
const ANFITEATRO = { lat: -25.85, lng: -65.88 };

describe("plannerTransferSights", () => {
  it("un traslado de ~3 h pide 3 visitas, no un día vacío", () => {
    expect(minSightsForDriveKm(180)).toBe(3);
    expect(minSightsForDriveKm(350)).toBe(2);
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

  it("no cuela Tilcara en un traslado Cafayate → Salta", () => {
    expect(pointIsAlongRoute(TILCARA, CAFAYATE, SALTA, 55)).toBe(false);
    expect(
      shouldKeepPoiOnTransferDay(TILCARA, SALTA, CAFAYATE, [{ label: "Tilcara", center: TILCARA }], "Cafayate")
    ).toBe(false);
  });
});
