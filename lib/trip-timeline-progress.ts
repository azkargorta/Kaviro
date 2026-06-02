/** Progreso temporal del viaje (0–100) cuando hay inicio y fin; null si faltan fechas. */
export function tripTimelineProgress(
  startDate: string | null,
  endDate: string | null
): number | null {
  if (!startDate || !endDate) return null;

  const startMs = new Date(`${startDate}T00:00:00`).getTime();
  const endMs = new Date(`${endDate}T00:00:00`).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return null;
  }

  const now = Date.now();
  if (now <= startMs) return 0;
  if (now >= endMs) return 100;

  return Math.round(((now - startMs) / (endMs - startMs)) * 100);
}
