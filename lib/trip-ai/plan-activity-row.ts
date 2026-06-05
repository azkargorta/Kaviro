/** Actividad mínima para generar rutas OSRM entre paradas del plan. */
export type PlanActivityForRoutes = {
  id?: string;
  title?: string | null;
  place_name?: string | null;
  activity_date?: string | null;
  activity_time?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  activity_type?: string | null;
  activity_kind?: string | null;
};

export function asPlanActivities(value: unknown): PlanActivityForRoutes[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is PlanActivityForRoutes => !!row && typeof row === "object");
}
