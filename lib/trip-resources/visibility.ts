export type ResourceVisibility = "trip" | "private" | "selected";

export type ResourceVisibilityFields = {
  visibility?: string | null;
  created_by_user_id?: string | null;
  visible_to_user_ids?: string[] | null;
};

export function normalizeResourceVisibility(value: unknown): ResourceVisibility {
  if (value === "private" || value === "selected") return value;
  return "trip";
}

export function parseVisibleUserIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && id.trim().length > 0))];
}

export function canViewTripResource(
  resource: ResourceVisibilityFields,
  viewerUserId: string,
  options?: { tripOwnerUserId?: string | null }
): boolean {
  const visibility = normalizeResourceVisibility(resource.visibility);
  const creatorId = resource.created_by_user_id || null;

  if (options?.tripOwnerUserId && options.tripOwnerUserId === viewerUserId) return true;
  if (creatorId && creatorId === viewerUserId) return true;

  if (visibility === "trip") return true;
  if (visibility === "private") return false;
  if (visibility === "selected") {
    const allowed = parseVisibleUserIds(resource.visible_to_user_ids);
    return allowed.includes(viewerUserId);
  }
  return true;
}

export function resourceVisibilityLabel(visibility: unknown): string {
  const v = normalizeResourceVisibility(visibility);
  if (v === "private") return "Solo yo";
  if (v === "selected") return "Viajeros seleccionados";
  return "Todos los viajeros";
}
