/** Cookie: valor = tripId mientras el staff de agencia previsualiza Kaviro viajero. */
export const TRAVELER_PREVIEW_COOKIE = "kaviro-traveler-preview";

export function isTravelerPreviewActive(
  cookieValue: string | undefined,
  tripId: string
): boolean {
  return Boolean(cookieValue && cookieValue === tripId);
}

export function travelerPreviewEntryHref(tripId: string) {
  return `/trip/${tripId}/summary?asTraveler=1`;
}

export function exitTravelerPreviewHref(tripId: string) {
  return `/trip/${tripId}/plan?exitTravelerPreview=1`;
}
