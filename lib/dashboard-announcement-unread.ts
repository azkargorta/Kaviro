/** Cuenta notificaciones in-app no leídas de avisos por viaje (URL /trip/{id}/announcements). */
export function countUnreadAnnouncementsByTrip(
  rows: Array<{ url?: string | null }> | null | undefined
): Record<string, number> {
  const byTripId: Record<string, number> = {};
  for (const row of rows ?? []) {
    const url = String(row.url ?? "");
    const match = url.match(/\/trip\/([^/]+)\/announcements/);
    if (!match) continue;
    const tripId = match[1]!;
    byTripId[tripId] = (byTripId[tripId] ?? 0) + 1;
  }
  return byTripId;
}
