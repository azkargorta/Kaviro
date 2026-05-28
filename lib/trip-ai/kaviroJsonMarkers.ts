/**
 * Protocolo de marcadores IA (marca Kaviro).
 * Los prompts emiten KAVIRO_*; al leer respuestas se aceptan alias TRIPBOARD_* (historial).
 */

function findEarliestMarker(
  text: string,
  markers: readonly string[],
  fromIndex = 0
): { marker: string; index: number } | null {
  let best: { marker: string; index: number } | null = null;
  for (const marker of markers) {
    const index = text.indexOf(marker, fromIndex);
    if (index === -1) continue;
    if (!best || index < best.index) best = { marker, index };
  }
  return best;
}

/** Extrae el JSON entre el primer par de marcadores (KAVIRO o TRIPBOARD). */
export function extractJsonBetweenMarkers(
  answer: string,
  startAliases: readonly string[],
  endAliases: readonly string[]
): string | null {
  const start = findEarliestMarker(answer, startAliases);
  if (!start) return null;
  const end = findEarliestMarker(answer, endAliases, start.index + start.marker.length);
  if (!end || end.index <= start.index) return null;
  return answer.slice(start.index + start.marker.length, end.index).trim();
}

// --- Itinerario ---
export const KAVIRO_ITINERARY_JSON_START = "KAVIRO_ITINERARY_JSON_START";
export const KAVIRO_ITINERARY_JSON_END = "KAVIRO_ITINERARY_JSON_END";
export const TRIPBOARD_ITINERARY_JSON_START = "TRIPBOARD_ITINERARY_JSON_START";
export const TRIPBOARD_ITINERARY_JSON_END = "TRIPBOARD_ITINERARY_JSON_END";
export const ITINERARY_JSON_START_ALIASES = [KAVIRO_ITINERARY_JSON_START, TRIPBOARD_ITINERARY_JSON_START] as const;
export const ITINERARY_JSON_END_ALIASES = [KAVIRO_ITINERARY_JSON_END, TRIPBOARD_ITINERARY_JSON_END] as const;

export function findItineraryJsonStart(text: string) {
  return findEarliestMarker(text, ITINERARY_JSON_START_ALIASES);
}
export function findItineraryJsonEnd(text: string, fromIndex: number) {
  return findEarliestMarker(text, ITINERARY_JSON_END_ALIASES, fromIndex);
}

// --- Diff (optimizador / acciones) ---
export const KAVIRO_DIFF_JSON_START = "KAVIRO_DIFF_JSON_START";
export const KAVIRO_DIFF_JSON_END = "KAVIRO_DIFF_JSON_END";
export const TRIPBOARD_DIFF_JSON_START = "TRIPBOARD_DIFF_JSON_START";
export const TRIPBOARD_DIFF_JSON_END = "TRIPBOARD_DIFF_JSON_END";
export const DIFF_JSON_START_ALIASES = [KAVIRO_DIFF_JSON_START, TRIPBOARD_DIFF_JSON_START] as const;
export const DIFF_JSON_END_ALIASES = [KAVIRO_DIFF_JSON_END, TRIPBOARD_DIFF_JSON_END] as const;

// --- Búsqueda (hotel, vuelo, etc.) ---
export const KAVIRO_SEARCH_JSON_START = "KAVIRO_SEARCH_JSON_START";
export const KAVIRO_SEARCH_JSON_END = "KAVIRO_SEARCH_JSON_END";
export const TRIPBOARD_SEARCH_JSON_START = "TRIPBOARD_SEARCH_JSON_START";
export const TRIPBOARD_SEARCH_JSON_END = "TRIPBOARD_SEARCH_JSON_END";
export const SEARCH_JSON_START_ALIASES = [KAVIRO_SEARCH_JSON_START, TRIPBOARD_SEARCH_JSON_START] as const;
export const SEARCH_JSON_END_ALIASES = [KAVIRO_SEARCH_JSON_END, TRIPBOARD_SEARCH_JSON_END] as const;

// --- Documentos de viaje ---
export const KAVIRO_TRAVEL_DOCS_JSON_START = "KAVIRO_TRAVEL_DOCS_JSON_START";
export const KAVIRO_TRAVEL_DOCS_JSON_END = "KAVIRO_TRAVEL_DOCS_JSON_END";
export const TRIPBOARD_TRAVEL_DOCS_JSON_START = "TRIPBOARD_TRAVEL_DOCS_JSON_START";
export const TRIPBOARD_TRAVEL_DOCS_JSON_END = "TRIPBOARD_TRAVEL_DOCS_JSON_END";
export const TRAVEL_DOCS_JSON_START_ALIASES = [
  KAVIRO_TRAVEL_DOCS_JSON_START,
  TRIPBOARD_TRAVEL_DOCS_JSON_START,
] as const;
export const TRAVEL_DOCS_JSON_END_ALIASES = [
  KAVIRO_TRAVEL_DOCS_JSON_END,
  TRIPBOARD_TRAVEL_DOCS_JSON_END,
] as const;

// --- Plan de un día ---
export const KAVIRO_DAYPLAN_JSON_START = "KAVIRO_DAYPLAN_JSON_START";
export const KAVIRO_DAYPLAN_JSON_END = "KAVIRO_DAYPLAN_JSON_END";
export const TRIPBOARD_DAYPLAN_JSON_START = "TRIPBOARD_DAYPLAN_JSON_START";
export const TRIPBOARD_DAYPLAN_JSON_END = "TRIPBOARD_DAYPLAN_JSON_END";
export const DAYPLAN_JSON_START_ALIASES = [KAVIRO_DAYPLAN_JSON_START, TRIPBOARD_DAYPLAN_JSON_START] as const;
export const DAYPLAN_JSON_END_ALIASES = [KAVIRO_DAYPLAN_JSON_END, TRIPBOARD_DAYPLAN_JSON_END] as const;

// --- Listas (maleta, compras) ---
export const KAVIRO_LIST_JSON_START = "KAVIRO_LIST_JSON_START";
export const KAVIRO_LIST_JSON_END = "KAVIRO_LIST_JSON_END";
export const TRIPBOARD_LIST_JSON_START = "TRIPBOARD_LIST_JSON_START";
export const TRIPBOARD_LIST_JSON_END = "TRIPBOARD_LIST_JSON_END";
export const LIST_JSON_START_ALIASES = [KAVIRO_LIST_JSON_START, TRIPBOARD_LIST_JSON_START] as const;
export const LIST_JSON_END_ALIASES = [KAVIRO_LIST_JSON_END, TRIPBOARD_LIST_JSON_END] as const;

/** Bloques a ocultar en burbujas de chat (texto sustituto). */
export const CHAT_DISPLAY_JSON_BLOCKS = [
  {
    startAliases: DIFF_JSON_START_ALIASES,
    endAliases: DIFF_JSON_END_ALIASES,
    label: "Cambios propuestos (panel «Aplicar cambios» arriba)",
  },
  {
    startAliases: TRAVEL_DOCS_JSON_START_ALIASES,
    endAliases: TRAVEL_DOCS_JSON_END_ALIASES,
    label: "Checklist de documentos (tarjeta debajo del mensaje)",
  },
  {
    startAliases: SEARCH_JSON_START_ALIASES,
    endAliases: SEARCH_JSON_END_ALIASES,
    label: "Opciones de búsqueda (tarjeta debajo del mensaje)",
  },
] as const;

export function stripMarkerBlocksForDisplay(
  content: string,
  blocks: ReadonlyArray<{
    startAliases: readonly string[];
    endAliases: readonly string[];
    label: string;
  }> = CHAT_DISPLAY_JSON_BLOCKS
): string {
  let out = content;
  for (const block of blocks) {
    for (;;) {
      const start = findEarliestMarker(out, block.startAliases);
      if (!start) break;
      const end = findEarliestMarker(out, block.endAliases, start.index + start.marker.length);
      if (!end || end.index <= start.index) break;
      out =
        out.slice(0, start.index) +
        `\n\n— ${block.label} —\n\n` +
        out.slice(end.index + end.marker.length);
    }
  }
  return out;
}

export function stripItineraryJsonBlocksForDisplay(content: string): string {
  let out = content;
  for (;;) {
    const start = findItineraryJsonStart(out);
    if (!start) break;
    const end = findItineraryJsonEnd(out, start.index + start.marker.length);
    if (end) {
      out =
        out.slice(0, start.index) +
        "\n\n— Itinerario generado (revisa las tarjetas arriba) —\n\n" +
        out.slice(end.index + end.marker.length);
    } else {
      out =
        out.slice(0, start.index) +
        "\n\n— Itinerario en proceso (usa «Generar tarjetas» si no aparecen arriba) —\n\n";
    }
  }
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

/** Oculta itinerario + diff + docs + búsqueda en el chat. */
export function stripAllKaviroJsonBlocksForDisplay(content: string | null | undefined): string {
  let out = typeof content === "string" ? content : content == null ? "" : String(content);
  out = stripMarkerBlocksForDisplay(out);
  out = out.replace(/```(?:json)?\s*[\s\S]*?```/gi, "\n\n— Detalle técnico (revisa el panel de acción arriba) —\n\n");
  out = stripItineraryJsonBlocksForDisplay(out);
  return out.replace(/\n{3,}/g, "\n\n").trim();
}
