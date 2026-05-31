/** Reglas compartidas para importación profesional de dossiers / agendas de agencia. */

export const IMPORT_ITINERARY_JSON_SCHEMA = [
  '{ "version": 1, "title": "string", "days": [{ "day": 1, "date": null, "items": [{',
  '  "title": "string",',
  '  "activity_kind": "visit|museum|restaurant|transport|activity|lodging",',
  '  "place_name": "string|null",',
  '  "address": "string|null",',
  '  "start_time": "HH:MM|null",',
  '  "duration_min": number|null,',
  '  "requires_ticket": true|false|null,',
  '  "ticket_notes": "string|null",',
  '  "transport_mode": "flight|train|bus|car|ferry|walking|metro|null",',
  '  "visit_type": "guided_tour|free_time|check_in|check_out|meal|null",',
  '  "notes": "string|null"',
  " }] }] }",
].join("\n");

export function buildImportExtractionRules(extra?: string): string[] {
  return [
    "Rol: analista senior de operaciones de viajes. Extrae el dossier con precisión; no resumas ni omitas bloques.",
    "Devuelve UN SOLO objeto JSON válido (sin markdown, sin marcadores KAVIRO_*).",
    "Esquema:",
    IMPORT_ITINERARY_JSON_SCHEMA,
    "",
    "Extracción exhaustiva:",
    "- Cada línea con hora (12.00h, 19:05h, 07:30h) → un item con start_time en HH:MM.",
    "- Vuelos: activity_kind transport, transport_mode flight; en title/notes: aerolínea, nº vuelo, ruta IATA, terminal, «cena a bordo».",
    "- Hoteles / alojamiento: activity_kind lodging; visit_type check_in o check_out; nombre hotel + ciudad + país en place_name/address.",
    "- Excursiones / museos / partidos: activity_kind acorde; requires_ticket true si lleva entrada.",
    "- Traslados, quedadas en hall, facturación aeropuerto: transport o activity según contexto.",
    "- Desayunos/comidas en hotel: restaurant o activity con visit_type meal.",
    "- Tiempo libre / tarde libre: activity con visit_type free_time.",
    "- Códigos PNR, localizador, nº reserva → ticket_notes o notes (no pierdas dígitos).",
    "- Encabezados «DÍA N», «VIERNES 27», «LUNES 30» → un bloque days por día; date siempre null (la app calcula fechas).",
    "- place_name y address: sitio + ciudad + país (ej. «NH Florida, Buenos Aires, Argentina»).",
    "- requires_ticket: true en museos, parques nacionales, partidos, cruceros; false en traslados/paseos libres.",
    "- No inventes actividades que no estén en el texto.",
    extra ? `- ${extra}` : "",
  ].filter(Boolean);
}

export function buildDocumentHintBlock(hint: string, maxLen = 4000): string {
  const trimmed = hint.trim();
  if (!trimmed) return "";
  return `\nMETADATOS DEL DOCUMENTO (referencia; el TEXTO manda):\n${trimmed.slice(0, maxLen)}`;
}
