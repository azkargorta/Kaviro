import type { NearbyPoi, PlannerDayItem } from "@/lib/trip-ai/itineraryDedup";
import type { RestaurantBudget, PlannerPreferences } from "@/lib/trip-ai/plannerPreferences";

export type DayItemLike = PlannerDayItem;

const RESTAURANT_LIKE =
  /\b(restaurante|sidrer[ií]a|taberna|bistr[oó]|brasserie|trattoria|asador|parrilla|mes[oó]n|marisquer[ií]a|steakhouse|pizzer[ií]a|pizzeria|café-restaurante|cafe-restaurante)\b/i;

const GASTRO_KEEP =
  /\b(mercado|bodega|cata|taller|curso|winery|brewery|vi[ñn]edo|maridaje|tapeo|pintxos|food\s*hall|mercadillo)\b/i;

export function isNamedRestaurantItem(it: DayItemLike): boolean {
  const kind = String(it.activity_kind || "").toLowerCase();
  if (kind !== "gastro_experience") return false;
  const title = String(it.title || "");
  if (GASTRO_KEEP.test(title)) return false;
  return RESTAURANT_LIKE.test(title) || /^restaurante\s/i.test(title) || /^sidrer[ií]a\s/i.test(title);
}

function timeToMinutes(t: string | null | undefined): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || "").trim());
  if (!m) return 12 * 60;
  return parseInt(m[1]!, 10) * 60 + parseInt(m[2]!, 10);
}

export type MealSlot = "lunch" | "dinner";

export function mealSlotFromTime(mins: number): MealSlot | null {
  if (mins >= 11 * 60 + 30 && mins < 17 * 60) return "lunch";
  if (mins >= 19 * 60 && mins < 23 * 60 + 30) return "dinner";
  return null;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  return (
    R *
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin(dLat / 2) ** 2 +
          Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
      )
    )
  );
}

function anchorBeforeSlot(items: PlannerDayItem[], slot: MealSlot): { lat: number; lng: number } | null {
  const lunchEnd = 17 * 60;
  const dinnerStart = 19 * 60;
  const sorted = [...items].sort((a, b) => timeToMinutes(a.activity_time) - timeToMinutes(b.activity_time));
  let last: { lat: number; lng: number } | null = null;
  for (const it of sorted) {
    const mins = timeToMinutes(it.activity_time);
    const isRest = isNamedRestaurantItem(it);
    const pt =
      typeof it.latitude === "number" && typeof it.longitude === "number" && it.latitude !== 0
        ? { lat: it.latitude, lng: it.longitude! }
        : null;
    if (slot === "lunch") {
      if (mins >= lunchEnd) break;
      if (!isRest && pt) last = pt;
    } else {
      if (mins < dinnerStart) {
        if (!isRest && pt) last = pt;
        continue;
      }
      if (mins >= dinnerStart) break;
      if (!isRest && pt) last = pt;
    }
  }
  return last;
}

function scoreRestaurantForBudget(title: string, budget: RestaurantBudget): number {
  const t = title.toLowerCase();
  const fine = /\b(michelin|estrella|gourmet|fine\s*dining|alta\s*cocina|degustaci[oó]n)\b/.test(t);
  const cheap = /\b(bar|taberna|men[uú]|menú|tapas|raciones|sidrer[ií]a|tasca|cafeter[ií]a)\b/.test(t);
  if (budget === "high") return fine ? 3 : cheap ? 0 : 2;
  if (budget === "low") return cheap ? 3 : fine ? 0 : 2;
  return fine ? 1 : cheap ? 1 : 2;
}

function pickBestRestaurant(
  candidates: PlannerDayItem[],
  anchor: { lat: number; lng: number } | null,
  budget: RestaurantBudget
): PlannerDayItem | null {
  if (!candidates.length) return null;
  let best: PlannerDayItem | null = null;
  let bestScore = -1;
  for (const c of candidates) {
    let score = scoreRestaurantForBudget(c.title, budget);
    if (anchor && typeof c.latitude === "number" && typeof c.longitude === "number") {
      const d = haversineKm(anchor, { lat: c.latitude, lng: c.longitude });
      score += Math.max(0, 3 - d / 2);
    }
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function pickFromGastroPool(
  pool: NearbyPoi[],
  anchor: { lat: number; lng: number } | null,
  budget: RestaurantBudget,
  used: Set<string>
): NearbyPoi | null {
  const candidates = pool.filter((p) => {
    const k = p.name.toLowerCase();
    if (used.has(k)) return false;
    return RESTAURANT_LIKE.test(p.name) || /^restaurante/i.test(p.name);
  });
  if (!candidates.length) return null;
  let best: NearbyPoi | null = null;
  let bestScore = -1;
  for (const c of candidates) {
    let score = scoreRestaurantForBudget(c.name, budget);
    if (anchor) score += Math.max(0, 3 - haversineKm(anchor, c) / 2);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function defaultMealTime(slot: MealSlot): string {
  return slot === "lunch" ? "13:30" : "20:30";
}

function buildRestaurantItem(poi: NearbyPoi, city: string, date: string, time: string): PlannerDayItem {
  return {
    title: poi.name,
    description: `Restaurante recomendado en ${city}.`,
    activity_date: date,
    activity_time: time,
    place_name: poi.name,
    address: `${poi.name}, ${city}`,
    latitude: poi.lat,
    longitude: poi.lng,
    activity_kind: "gastro_experience",
    activity_type: "visit",
    source: "ai_planner_restaurant",
  };
}

/**
 * Máximo 1 restaurante por comida y 1 por cena; opcionalmente añade uno cerca de la última visita.
 */
export function consolidateRestaurantsForDay(
  items: PlannerDayItem[],
  opts: {
    prefs: PlannerPreferences;
    city: string;
    date: string;
    gastroPool?: NearbyPoi[];
  }
): PlannerDayItem[] {
  const { prefs, city, date } = opts;
  const gastroPool = opts.gastroPool ?? [];

  if (!prefs.suggestRestaurants) {
    return items.filter((it) => !isNamedRestaurantItem(it));
  }

  const budget = prefs.restaurantBudget;
  const nonRest = items.filter((it) => !isNamedRestaurantItem(it));
  const restaurants = items.filter((it) => isNamedRestaurantItem(it));

  const bySlot: Record<MealSlot, PlannerDayItem[]> = { lunch: [], dinner: [] };
  for (const r of restaurants) {
    const slot = mealSlotFromTime(timeToMinutes(r.activity_time));
    if (slot) bySlot[slot].push(r);
  }

  const usedNames = new Set<string>();
  const added: PlannerDayItem[] = [];

  for (const slot of ["lunch", "dinner"] as MealSlot[]) {
    const anchor = anchorBeforeSlot(items, slot);
    const picked = pickBestRestaurant(bySlot[slot], anchor, budget);
    if (picked) {
      usedNames.add(picked.title.toLowerCase());
      const time = picked.activity_time || defaultMealTime(slot);
      added.push({ ...picked, activity_time: time });
      continue;
    }
    const fromPool = pickFromGastroPool(gastroPool, anchor, budget, usedNames);
    if (fromPool) {
      usedNames.add(fromPool.name.toLowerCase());
      added.push(buildRestaurantItem(fromPool, city, date, defaultMealTime(slot)));
    }
  }

  const merged = [...nonRest, ...added].sort(
    (a, b) => timeToMinutes(a.activity_time) - timeToMinutes(b.activity_time)
  );
  return merged;
}
