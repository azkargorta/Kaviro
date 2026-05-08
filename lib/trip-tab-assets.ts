export type TripTabKey = "summary" | "plan" | "map" | "expenses" | "participants" | "resources" | "chat";

/** PNG de documentos suele llevar más margen interno: escala para igualar peso visual al resto de pestañas. */
export const tripTabDocsImageClass = "object-contain scale-[1.08] origin-center";

const tabToBaseName: Record<TripTabKey, string> = {
  summary: "summary",
  plan: "plan",
  map: "map",
  expenses: "expenses",
  participants: "participants",
  resources: "documents",
  chat: "ai",
};

export function getTripTabIconSrc(key: TripTabKey, isDark: boolean) {
  const base = tabToBaseName[key];
  return isDark ? `/brand/tabs/${base}_dark.png` : `/brand/tabs/${base}.png`;
}

/**
 * Tiñe un PNG blanco al acento (coral) en dark mode.
 * Útil para iconos raster (tabs) cuando queremos consistencia visual.
 */
export const tripTabIconCoralFilterDark =
  "dark:[filter:brightness(0)_saturate(100%)_invert(73%)_sepia(22%)_saturate(6228%)_hue-rotate(324deg)_brightness(102%)_contrast(98%)]";

/** Compat: callers antiguos que esperaban el src directo de Resumen. */
export const TRIP_TAB_SUMMARY_SRC = "/brand/tabs/summary.png";
