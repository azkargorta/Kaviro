const STOPWORDS = new Set(
  [
    "coche",
    "avion",
    "avión",
    "bus",
    "tren",
    "hotel",
    "aeropuerto",
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "mi",
    "tu",
    "su",
    "este",
    "esta",
    "grupo",
    "pareja",
    "familia",
    "coche de",
  ].map((s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())
);

function titleCasePlace(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function normWord(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Ciudades mencionadas tras «en …» en un mensaje de chat. */
export function extraStopsFromChat(message: string): string[] {
  const out: string[] = [];
  const re = /\ben\s+([a-záéíóúüñ]{3,}(?:\s+[a-záéíóúüñ]{3,})?)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(message))) {
    const raw = (m[1] || "").trim();
    if (!raw || STOPWORDS.has(normWord(raw))) continue;
    if (/^(el|la|los|las|un|una)\b/i.test(raw)) continue;
    out.push(titleCasePlace(raw));
  }
  return [...new Set(out)];
}

export function chatWantsNewSleepPlan(message: string): boolean {
  return /\b(dormir|duermo|duermen|noches?|aloj|quedarme|quedamos|bases?)\b/i.test(message);
}

export function uniquePlaces(...lists: Array<string[] | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const raw of list || []) {
      const t = String(raw || "").trim();
      if (!t) continue;
      const k = normWord(t);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
  }
  return out;
}
