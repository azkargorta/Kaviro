export const BOOKING_STATUSES = [
  "interested",
  "reserved",
  "deposit_paid",
  "confirmed",
  "waitlist",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  interested: "Interesado",
  reserved: "Reservado",
  deposit_paid: "Señal pagada",
  confirmed: "Confirmado",
  waitlist: "Lista de espera",
  cancelled: "Cancelado",
};

/** Estados que ocupan una plaza del cupo. */
export function countsTowardCapacity(status: string | null | undefined): boolean {
  return status === "reserved" || status === "deposit_paid" || status === "confirmed";
}

export function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && (BOOKING_STATUSES as readonly string[]).includes(value);
}

/** Viajero de agencia: tiene estado de reserva (no es solo staff). */
export function isTravelerBooking(status: string | null | undefined): boolean {
  return status != null && status !== "";
}
