/**
 * Destinos «amplios» (país, comunidad autónoma, provincia, isla…) que requieren
 * concretar ciudades o pueblos antes de generar el plan.
 */

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

/** Claves normalizadas → etiqueta legible para la UI */
export const BROAD_DESTINATION_ALIASES: Record<string, string> = {
  asturias: "Asturias",
  "principado de asturias": "Asturias",
  galicia: "Galicia",
  cantabria: "Cantabria",
  "pais vasco": "País Vasco",
  euskadi: "País Vasco",
  navarra: "Navarra",
  aragon: "Aragón",
  cataluna: "Cataluña",
  catalunya: "Cataluña",
  cataluña: "Cataluña",
  andalucia: "Andalucía",
  andalucía: "Andalucía",
  "castilla y leon": "Castilla y León",
  "castilla y león": "Castilla y León",
  "castilla la mancha": "Castilla-La Mancha",
  extremadura: "Extremadura",
  murcia: "Región de Murcia",
  valencia: "Comunidad Valenciana",
  "comunidad valenciana": "Comunidad Valenciana",
  baleares: "Islas Baleares",
  "islas baleares": "Islas Baleares",
  canarias: "Islas Canarias",
  "islas canarias": "Islas Canarias",
  sicilia: "Sicilia",
  toscana: "Toscana",
  provenza: "Provenza",
  bretaña: "Bretaña",
  bretana: "Bretaña",
  normandia: "Normandía",
  normandía: "Normandía",
  argentina: "Argentina",
  españa: "España",
  spain: "España",
  italia: "Italia",
  italy: "Italia",
  francia: "Francia",
  france: "Francia",
  portugal: "Portugal",
  japon: "Japón",
  japan: "Japón",
  mexico: "México",
  méxico: "México",
  peru: "Perú",
  perú: "Perú",
  marruecos: "Marruecos",
  morocco: "Marruecos",
  tailandia: "Tailandia",
  thailand: "Tailandia",
  grecia: "Grecia",
  greece: "Grecia",
};

const BROAD_KEYS = new Set(Object.keys(BROAD_DESTINATION_ALIASES));

/** Heurística: nombre corto sin comas (puede ser país o región). */
function looksLikeShortPlaceName(place: string): boolean {
  const q = place.trim();
  if (q.length < 3 || /[0-9]/.test(q) || /[,\-–—/·]/.test(q)) return false;
  return q.split(/\s+/).length <= 3;
}

export function isBroadDestination(place: string): boolean {
  const n = norm(place);
  if (!n) return false;
  if (BROAD_KEYS.has(n)) return true;
  return looksLikeShortPlaceName(place);
}

export function broadDestinationLabel(place: string): string {
  const n = norm(place);
  return BROAD_DESTINATION_ALIASES[n] ?? place.trim();
}

/** true si falta elegir al menos una ciudad/pueblo para ese destino amplio */
export function broadDestinationMissingCities(
  place: string,
  subDestinations: Record<string, string[]>
): boolean {
  if (!isBroadDestination(place)) return false;
  const key = place.trim();
  return !(subDestinations[key]?.length > 0);
}

export function allBroadDestinationsHaveCities(
  places: string[],
  subDestinations: Record<string, string[]>
): boolean {
  return places.every((p) => !broadDestinationMissingCities(p, subDestinations));
}
