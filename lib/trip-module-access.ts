import type { TripAccessResult } from "@/lib/trip-access";

/** Permisos por módulo (misma forma que `TripAccessResult`, para props de UI). */
export type TripModuleAccessProps = {
  role: TripAccessResult["role"];
  canManageTrip: boolean;
  canManageParticipants: boolean;
  canManageExpenses: boolean;
  canManagePlan: boolean;
  canManageMap: boolean;
  canManageResources: boolean;
};

export function tripModuleAccessPropsFrom(access: TripAccessResult): TripModuleAccessProps {
  return {
    role: access.role,
    canManageTrip: access.can_manage_trip,
    canManageParticipants: access.can_manage_participants,
    canManageExpenses: access.can_manage_expenses,
    canManagePlan: access.can_manage_plan,
    canManageMap: access.can_manage_map,
    canManageResources: access.can_manage_resources,
  };
}

/** Notas del viaje: configuración general o plan. */
export function canEditTripNotesFromAccess(access: TripAccessResult): boolean {
  return access.can_manage_trip || access.can_manage_plan;
}
