export type TripTabKey = "summary" | "plan" | "map" | "expenses" | "participants" | "resources" | "chat" | "recap";

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
  recap: "recap",
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

/** Tiñe assets raster azules al coral de marca (#F87171) — logos lockup, etc. */
export const kaviroCoralImageFilter =
  "[filter:brightness(0)_saturate(100%)_invert(54%)_sepia(93%)_saturate(4590%)_hue-rotate(346deg)_brightness(101%)_contrast(97%)]";

/** Compat: callers antiguos que esperaban el src directo de Resumen. */
export const TRIP_TAB_SUMMARY_SRC = "/brand/tabs/summary.png";
