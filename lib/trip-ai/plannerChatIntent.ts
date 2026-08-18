/**
 * Intención del chat «Refinar con IA».
 * El LLM no debe interpretarlo a ciegas: primero clasificamos, luego regeneramos.
 */

export type PlannerChatIntentKind =
  | "sleep"
  | "fill_transfers"
  | "add_sights"
  | "remove_place"
  | "general";

export type PlannerChatIntent = {
  kind: PlannerChatIntentKind;
  dayNums: number[];
  place: string | null;
};

function numsFromMessage(message: string): number[] {
  const out: number[] = [];
  const re = /\b(?:d[ií]as?\s*)?(\d{1,2})\b/gi;
  for (const m of message.matchAll(re)) {
    const n = Number(m[1]);
    if (Number.isInteger(n) && n >= 1 && n <= 31 && !out.includes(n)) out.push(n);
  }
  return out.slice(0, 8);
}

export function classifyPlannerChatIntent(message: string): PlannerChatIntent {
  const t = message
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const dayNums = numsFromMessage(message);

  if (/\b(dormir|duermo|duermen|noches?|aloj|quedarme|quedamos|bases?)\b/.test(t)) {
    return { kind: "sleep", dayNums, place: null };
  }

  const remove = t.match(/\b(?:quita|quitar|elimina|eliminar|sin)\s+(?:la\s+base\s+|el\s+destino\s+)?([a-z]{3,}(?:\s+[a-z]{3,})?)/i);
  if (remove?.[1] && !/traslado|museo|excursion/.test(remove[1])) {
    const place = remove[1].trim();
    if (place.length >= 3) {
      return { kind: "remove_place", dayNums, place: place.charAt(0).toUpperCase() + place.slice(1) };
    }
  }

  if (/\b(traslado|por el camino|sitios de camino|en ruta)\b/.test(t)) {
    return { kind: "fill_transfers", dayNums, place: null };
  }

  if (/\b(anade|anadas|pon|pongas|excursi|cosas que ver|visitas?|actividades)\b/.test(t) && dayNums.length) {
    return { kind: "add_sights", dayNums, place: null };
  }

  return { kind: "general", dayNums, place: null };
}

/** Raíl en lenguaje para el generador (prioridad sobre el texto libre). */
export function plannerChatIntentToRule(intent: PlannerChatIntent, original: string): string {
  if (intent.kind === "fill_transfers") {
    const days = intent.dayNums.length ? ` (días ${intent.dayNums.join(", ")})` : "";
    return `Días de traslado${days}: un trayecto de ~3 h NO es un día vacío. Incluye 2-3 visitas reales en origen, paradas de camino o a la llegada. Prohibido dejar solo el item de traslado.`;
  }
  if (intent.kind === "add_sights") {
    return `Añade visitas y/o una excursión en los días ${intent.dayNums.join(", ")}. No sustituyas el resto del viaje.`;
  }
  if (intent.kind === "remove_place" && intent.place) {
    return `Quita ${intent.place} de las bases y redistribuye esas noches en las bases que queden.`;
  }
  if (intent.kind === "sleep") {
    return original.trim();
  }
  return original.trim();
}
