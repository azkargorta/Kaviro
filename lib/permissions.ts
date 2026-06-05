export type TripRole = "owner" | "editor" | "viewer";

export type ParticipantPermissions = {
  can_manage_trip: boolean;
  can_manage_participants: boolean;
  can_manage_expenses: boolean;
  can_manage_plan: boolean;
  can_manage_map: boolean;
  can_manage_resources: boolean;
};

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<TripRole, ParticipantPermissions> = {
  owner: {
    can_manage_trip: true,
    can_manage_participants: true,
    can_manage_expenses: true,
    can_manage_plan: true,
    can_manage_map: true,
    can_manage_resources: true,
  },
  editor: {
    can_manage_trip: false,
    can_manage_participants: false,
    can_manage_expenses: true,
    can_manage_plan: true,
    can_manage_map: true,
    can_manage_resources: true,
  },
  viewer: {
    can_manage_trip: false,
    can_manage_participants: false,
    can_manage_expenses: false,
    can_manage_plan: false,
    can_manage_map: false,
    can_manage_resources: false,
  },
};

export function normalizeRole(role?: string | null): TripRole {
  if (role === "owner" || role === "editor" || role === "viewer") return role;
  return "viewer";
}

export function normalizePermissions(
  role?: string | null,
  overrides?: Partial<ParticipantPermissions> | null
): ParticipantPermissions {
  const normalizedRole = normalizeRole(role);
  const base = DEFAULT_PERMISSIONS_BY_ROLE[normalizedRole];

  // En BD, `can_manage_*` puede ser `false` por defectos de migraciones antiguas.
  // `false ?? defaultPorRol` sigue siendo `false`, así que un owner quedaba sin plan.
  // El propietario del viaje debe tener siempre control completo (coherente con
  // docs/tripboard_permissions_modules.sql).
  if (normalizedRole === "owner") {
    return { ...DEFAULT_PERMISSIONS_BY_ROLE.owner };
  }

  const resolve = (key: keyof ParticipantPermissions) => {
    const value = overrides?.[key];
    return value !== undefined ? value : base[key];
  };

  return {
    can_manage_trip: resolve("can_manage_trip"),
    can_manage_participants: resolve("can_manage_participants"),
    can_manage_expenses: resolve("can_manage_expenses"),
    can_manage_plan: resolve("can_manage_plan"),
    can_manage_map: resolve("can_manage_map"),
    can_manage_resources: resolve("can_manage_resources"),
  };
}
