/** Reglas compartidas para importación profesional de dossiers / agendas de agencia. */

export const IMPORT_ITINERARY_JSON_SCHEMA = [
  '{ "version": 1, "title": "string", "days": [{ "day": 1, "date": null, "items": [{',
  '  "title": "string",',
  '  "activity_kind": "visit|museum|restaurant|transport|activity|lodging|excursion|tour|culture|nature|night|shopping|sport|gastro_experience",',
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
    "Rol: asistente experto en análisis de documentos de viaje. El documento puede ser: dossier de agencia, calendario turístico, tabla de actividades, programa de viaje, captura de pantalla, imagen de horarios o cualquier otro formato. Extrae con precisión máxima; no resumas ni omitas bloques.",
    "Devuelve UN SOLO objeto JSON válido (sin markdown, sin marcadores KAVIRO_*).",
    "Esquema:",
    IMPORT_ITINERARY_JSON_SCHEMA,
    "",
    "Extracción exhaustiva:",
    "- Cada elemento con hora visible → un item con start_time en formato HH:MM.",
    "- Formatos de hora aceptados: 12.00h→12:00, 19:05h→19:05, 07:30→07:30, 8h→08:00, 8am→08:00, 3:25pm→15:25, medianoche→00:00.",
    "- Si una actividad NO tiene hora especificada: start_time=\"00:00\". NUNCA devuelvas null en start_time.",
    "- Si el documento es una TABLA (columnas Hora/Actividad/Lugar): cada fila de la tabla es un item independiente.",
    "- Si el documento está en inglés: usa los títulos en inglés tal como aparecen; activity_kind en inglés igualmente.",
    "- Si la línea nombra hotel, aeropuerto, ciudad o «en X» → place_name con ese sitio; address si hay dirección completa.",
    "- Vuelos: activity_kind transport, transport_mode flight; en title/notes: aerolínea, nº vuelo, ruta IATA, terminal, «cena a bordo».",
    "- Hoteles / alojamiento: activity_kind lodging; visit_type check_in o check_out; nombre hotel + ciudad + país en place_name/address.",
    "- Excursiones fuera de la ciudad: activity_kind \"excursion\" (p.ej. día a Green Bay, tour en barco).",
    "- Tours guiados, city tours, tours en bus panorámico, cruceros: activity_kind \"tour\".",
    "- Partidos deportivos (NBA, NFL, MLB, fútbol): activity_kind \"sport\"; requires_ticket true.",
    "- Museos y galerías: activity_kind \"museum\"; requires_ticket true.",
    "- Teatros, conciertos, espectáculos: activity_kind \"culture\"; requires_ticket true.",
    "- Bares nocturnos, jazz, blues, vida nocturna: activity_kind \"night\".",
    "- Compras, outlets, mercados: activity_kind \"shopping\".",
    "- Restaurantes, cenas, comidas incluidas: activity_kind \"restaurant\".",
    "- Traslados, quedadas en hall, facturación aeropuerto: transport o activity según contexto.",
    "- Desayunos/comidas en hotel: restaurant o activity con visit_type meal.",
    "- Tiempo libre / tarde libre: activity con visit_type free_time.",
    "- Códigos PNR, localizador, nº reserva → ticket_notes o notes (no pierdas dígitos).",
    "- Encabezados «DÍA N», «VIERNES 27», «LUNES 30» → un bloque days[] por cada día del dossier (nunca mezcles dos días en uno); date null (la app asigna fechas).",
    "- Si el contexto indica N días, days[] debe tener exactamente N entradas en orden.",
    "- place_name: nombre del lugar exacto (estadio, restaurante, hotel, teatro). Si no hay nombre específico: null.",
    "- address: dirección completa si aparece en el texto, si no: null. NUNCA inventes una dirección.",
    "- Para actividades sin ubicación conocida: place_name=null, address=null (no null como string, sino JSON null).",
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
