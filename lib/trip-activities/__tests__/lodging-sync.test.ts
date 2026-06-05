import { describe, expect, it } from "vitest";
import {
  isLodgingActivityRow,
  lodgingReservationNameFromActivity,
  calculateNights,
} from "@/lib/trip-activities/lodging-sync";

describe("lodging activity helpers", () => {
  it("detecta alojamiento por activity_kind", () => {
    expect(isLodgingActivityRow({ activity_kind: "hotel" })).toBe(true);
    expect(isLodgingActivityRow({ activity_kind: "visit" })).toBe(false);
  });

  it("prefiere place_name para la reserva", () => {
    expect(
      lodgingReservationNameFromActivity({ title: "Check-in · Hotel X", place_name: "Hotel Real" })
    ).toBe("Hotel Real");
  });

  it("calcula noches entre fechas", () => {
    expect(calculateNights("2026-06-01", "2026-06-04")).toBe(3);
    expect(calculateNights("2026-06-04", "2026-06-01")).toBeNull();
  });
});
