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

function daysBetween(a: string, b: string) {
  return Math.round(
    (new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000
  );
}

/** Etiqueta «Día X de Y» para viajes en curso; null si faltan fechas o aún no ha empezado. */
export function tripDayLabel(startDate: string | null, endDate: string | null): string | null {
  if (!startDate || !endDate) return null;
  const today = new Intl.DateTimeFormat("en-CA").format(new Date());
  if (today < startDate) return null;
  const total = daysBetween(startDate, endDate) + 1;
  const elapsed = Math.min(total, Math.max(1, daysBetween(startDate, today) + 1));
  return `Día ${elapsed} de ${total}`;
}
