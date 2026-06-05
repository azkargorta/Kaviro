import { describe, expect, it } from "vitest";
import { canSetBookingStatus, summarizeCapacity, suggestBookingStatusForNewTraveler } from "@/lib/agency/capacity";

describe("summarizeCapacity", () => {
  it("counts occupied and waitlist separately", () => {
    const s = summarizeCapacity(
      [
        { status: "active", booking_status: "confirmed" },
        { status: "active", booking_status: "confirmed" },
        { status: "active", booking_status: "waitlist" },
        { status: "active", booking_status: null },
      ],
      14
    );
    expect(s.occupied).toBe(2);
    expect(s.waitlist).toBe(1);
    expect(s.isFull).toBe(false);
    expect(s.available).toBe(12);
  });

  it("marks full when occupied reaches max", () => {
    const s = summarizeCapacity(
      [{ status: "active", booking_status: "reserved" }],
      1
    );
    expect(s.isFull).toBe(true);
    expect(s.available).toBe(0);
  });
});

describe("suggestBookingStatusForNewTraveler", () => {
  it("suggests waitlist when full and enabled", () => {
    expect(
      suggestBookingStatusForNewTraveler(
        { maxCapacity: 2, waitlistEnabled: true },
        { occupied: 2, isFull: true }
      )
    ).toBe("waitlist");
  });
});

describe("canSetBookingStatus", () => {
  it("blocks new occupied slot when full", () => {
    const r = canSetBookingStatus(
      { maxCapacity: 2, waitlistEnabled: true },
      { occupied: 2, interested: 0, waitlist: 0, cancelled: 0, totalTravelers: 2 },
      "confirmed",
      "waitlist"
    );
    expect(r.ok).toBe(false);
  });
});
