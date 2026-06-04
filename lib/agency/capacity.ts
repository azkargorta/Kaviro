import { countsTowardCapacity, type BookingStatus } from "@/lib/agency/booking-status";

export type TripCapacitySettings = {
  maxCapacity: number | null;
  waitlistEnabled: boolean;
};

export type CapacityCounts = {
  occupied: number;
  interested: number;
  waitlist: number;
  cancelled: number;
  totalTravelers: number;
};

export type ParticipantBookingRow = {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  booking_status: string | null;
};

export function summarizeCapacity(
  participants: Array<{ booking_status?: string | null; status?: string }>,
  maxCapacity: number | null
): CapacityCounts & { available: number | null; isFull: boolean } {
  const active = participants.filter((p) => p.status !== "removed");
  const travelers = active.filter((p) => p.booking_status != null && p.booking_status !== "");

  let occupied = 0;
  let interested = 0;
  let waitlist = 0;
  let cancelled = 0;

  for (const p of travelers) {
    const bs = p.booking_status;
    if (countsTowardCapacity(bs)) occupied += 1;
    else if (bs === "interested") interested += 1;
    else if (bs === "waitlist") waitlist += 1;
    else if (bs === "cancelled") cancelled += 1;
  }

  const available =
    maxCapacity != null && maxCapacity > 0 ? Math.max(0, maxCapacity - occupied) : null;
  const isFull = maxCapacity != null && maxCapacity > 0 && occupied >= maxCapacity;

  return {
    occupied,
    interested,
    waitlist,
    cancelled,
    totalTravelers: travelers.length,
    available,
    isFull,
  };
}

/** Estado recomendado al dar de alta un viajero si el viaje está lleno. */
export function suggestBookingStatusForNewTraveler(
  settings: TripCapacitySettings,
  counts: Pick<CapacityCounts, "occupied"> & { isFull: boolean }
): BookingStatus {
  if (!settings.maxCapacity || settings.maxCapacity <= 0) return "interested";
  if (counts.isFull && settings.waitlistEnabled) return "waitlist";
  if (counts.isFull) return "interested";
  return "reserved";
}

export function canSetBookingStatus(
  settings: TripCapacitySettings,
  counts: CapacityCounts,
  nextStatus: BookingStatus,
  currentStatus: string | null | undefined
): { ok: true } | { ok: false; reason: string } {
  if (!countsTowardCapacity(nextStatus)) return { ok: true };
  if (!settings.maxCapacity || settings.maxCapacity <= 0) return { ok: true };
  if (!countsTowardCapacity(currentStatus) && counts.occupied >= settings.maxCapacity) {
    return {
      ok: false,
      reason: `El viaje está completo (${counts.occupied}/${settings.maxCapacity} plazas). Libera una plaza o usa lista de espera.`,
    };
  }
  return { ok: true };
}
