/** Paleta compartida para colorear rutas en mapa (manual e IA). */
export const ROUTE_COLOR_PALETTE = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
] as const;

export function pickRouteColorByIndex(index: number): string {
  const palette = ROUTE_COLOR_PALETTE;
  return palette[((index % palette.length) + palette.length) % palette.length]!;
}

/** Siguiente color no usado (por hex en minúsculas); si todos están usados, rota por índice. */
export function pickNextRouteColor(usedLowercase: Set<string>, indexFallback = 0): string {
  const free = ROUTE_COLOR_PALETTE.find((c) => !usedLowercase.has(c.toLowerCase()));
  if (free) return free;
  return pickRouteColorByIndex(indexFallback);
}
