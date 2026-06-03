import type { DayPlanTravelMode } from "@/lib/route-travel-mode";

export type DayPlanItemLike = {
  title: string;
  kind: "visit" | "museum" | "activity" | "restaurant";
};

export type DayPlanPayloadLike = {
  date: string;
  travelMode: DayPlanTravelMode;
  items: DayPlanItemLike[];
};

/** Petición acotada: solo comer/cenar cerca de lo que ya visitan (no reorganizar el día entero). */
export function detectMealsOnlyDayPlannerRequest(hintText: string): boolean {
  const t = String(hintText || "").toLowerCase();
  const wantsMeal =
    /\b(comer|cenar|almuerzo|comida|cena|restaurante|brunch|tapas|donde comer|sitio para comer|lugares? para (comer|cenar)|recomienda(?:r)?\s+(?:un\s+)?restaurante)\b/.test(
      t
    );
  const wantsFullDay =
    /\b(organiza(?:r)?\s+(?:el\s+)?d[ií]a|plan completo|todo el d[ií]a|itinerario completo|programa(?:r)?\s+el\s+d[ií]a|horario completo|desde las?\s*\d{1,2})\b/.test(
      t
    );
  const scoped =
    /\b(solo|únicamente|unicamente|nada más|no (?:hagas|añadas|crees)|sin)\b.{0,40}\b(comer|cenar|comida|restaurant)/.test(
      t
    ) || /\b(sitio|lugares?)\s+para\s+(comer|cenar)\b/.test(t);
  const nearVisits = /\bcerca\b/.test(t) && wantsMeal;
  return wantsMeal && (scoped || nearVisits || !wantsFullDay);
}

export function inferMealKindFromTitle(title: string): DayPlanItemLike["kind"] {
  const t = title.toLowerCase();
  if (/almuerzo|cena|comida|restaurant|brunch|tapas|bar\b|café|cafe/.test(t)) return "restaurant";
  return "visit";
}

export function applyMealsOnlyPlanFilter<T extends DayPlanPayloadLike>(plan: T): T {
  const items = plan.items
    .filter((it) => {
      const title = it.title.toLowerCase();
      if (/desplazamiento|traslado\b|desayuno en el hotel|visita a\b/.test(title)) return false;
      const kind = it.kind === "restaurant" ? "restaurant" : inferMealKindFromTitle(it.title);
      return kind === "restaurant";
    })
    .map((it) => ({ ...it, kind: "restaurant" as const }))
    .slice(0, 3);
  return { ...plan, items };
}
