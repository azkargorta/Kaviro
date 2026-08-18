/** Ventana horaria de un día del plan (llegada/salida). */

export function hhmmToMinutes(t: string | null | undefined): number | null {
  const s = String(t || "").trim();
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function minutesToHhmm(total: number): string {
  const n = Math.max(0, Math.min(23 * 60 + 59, Math.round(total)));
  const h = Math.floor(n / 60);
  const min = n % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export type DayTimeWindow = {
  earliestMin: number;
  latestMin: number;
  minSights: number;
  maxSights: number;
};

const DAY_START = 8 * 60;
const DAY_END = 21 * 60 + 30;

export function windowForTripDay(opts: {
  dayIndex: number;
  totalDays: number;
  arrivalTime?: string | null;
  departureTime?: string | null;
}): DayTimeWindow {
  const full: DayTimeWindow = { earliestMin: DAY_START, latestMin: DAY_END, minSights: 3, maxSights: 5 };
  if (opts.dayIndex === 1 && opts.arrivalTime) {
    const arr = hhmmToMinutes(opts.arrivalTime);
    if (arr != null) {
      const earliest = arr + 45;
      if (earliest >= 21 * 60) {
        return { earliestMin: earliest, latestMin: 23 * 60, minSights: 0, maxSights: 0 };
      }
      if (earliest >= 18 * 60) {
        return { earliestMin: earliest, latestMin: 22 * 60, minSights: 0, maxSights: 1 };
      }
      return {
        earliestMin: Math.max(DAY_START, earliest),
        latestMin: DAY_END,
        minSights: 1,
        maxSights: 3,
      };
    }
  }
  if (opts.dayIndex === opts.totalDays && opts.departureTime) {
    const dep = hhmmToMinutes(opts.departureTime);
    if (dep != null) {
      const latest = dep - 180;
      if (latest <= 10 * 60) {
        return { earliestMin: DAY_START, latestMin: Math.max(DAY_START, latest), minSights: 0, maxSights: 1 };
      }
      return { earliestMin: DAY_START, latestMin: latest, minSights: 2, maxSights: 3 };
    }
  }
  return full;
}

export function itemFitsWindow(time: string | null | undefined, w: DayTimeWindow): boolean {
  const m = hhmmToMinutes(time);
  if (m == null) return w.maxSights > 0;
  return m >= w.earliestMin && m <= w.latestMin;
}

export function slotsAfter(earliestMin: number, slots: string[]): string[] {
  return slots.filter((s) => {
    const m = hhmmToMinutes(s);
    return m != null && m >= earliestMin;
  });
}

function normalizeClock(raw: string | undefined): string | null {
  if (!raw || hhmmToMinutes(raw) == null) return null;
  const [h, min] = raw.split(":");
  return `${String(Number(h)).padStart(2, "0")}:${min}`;
}

export function parseClockFromNotes(notes: string, kind: "llegada" | "salida"): string | null {
  const patterns =
    kind === "llegada"
      ? [
          /llegada[\s\S]{0,180}?(\d{1,2}:\d{2})/i,
          /lleg(?:o|amos|a)[\s\S]{0,180}?(?:a\s+las?\s+)?(\d{1,2}:\d{2})/i,
          /aterriz[\s\S]{0,80}?(?:a\s+las?\s+)?(\d{1,2}:\d{2})/i,
          /aeropuerto[\s\S]{0,80}?(?:a\s+las?\s+)?(\d{1,2}:\d{2})/i,
          /primer\s+d[ií]a[\s\S]{0,80}?(?:a\s+las?\s+)?(\d{1,2}:\d{2})/i,
        ]
      : [
          /salida[\s\S]{0,180}?(\d{1,2}:\d{2})/i,
          /sal(?:go|imos|e)[\s\S]{0,180}?(?:a\s+las?\s+)?(\d{1,2}:\d{2})/i,
          /vuelo\s+de\s+vuelta[\s\S]{0,80}?(?:a\s+las?\s+)?(\d{1,2}:\d{2})/i,
          /último\s+d[ií]a[\s\S]{0,80}?(?:a\s+las?\s+)?(\d{1,2}:\d{2})/i,
        ];
  for (const re of patterns) {
    const t = normalizeClock(notes.match(re)?.[1]);
    if (t) return t;
  }
  return null;
}

export function clipItemsToDayWindow<T extends { activity_time?: string | null; activity_kind?: string }>(
  items: T[],
  w: DayTimeWindow
): T[] {
  const transport: T[] = [];
  const rest: T[] = [];
  for (const it of items || []) {
    if (String(it.activity_kind || "").toLowerCase() === "transport") {
      transport.push(it);
      continue;
    }
    if (w.maxSights <= 0) continue;
    if (!itemFitsWindow(it.activity_time, w)) continue;
    if (rest.length >= w.maxSights) continue;
    rest.push(it);
  }
  return [...transport, ...rest];
}
