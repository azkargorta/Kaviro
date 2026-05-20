import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getTripAccessForApi, type TripAccessResult } from "@/lib/trip-access";

export type TripModulePermission =
  | "can_manage_trip"
  | "can_manage_participants"
  | "can_manage_expenses"
  | "can_manage_plan"
  | "can_manage_map"
  | "can_manage_resources";

export type TripAccessApiOk = {
  ok: true;
  access: TripAccessResult;
  supabase: SupabaseClient;
};

export type TripAccessApiDenied = {
  ok: false;
  response: NextResponse;
};

export async function requireTripAccessApi(tripId: string): Promise<TripAccessApiOk | TripAccessApiDenied> {
  const supabase = await createClient();
  const result = await getTripAccessForApi(supabase, tripId);

  if (!result.ok) {
    const code = result.status === 401 ? "UNAUTHORIZED" : result.status === 403 ? "FORBIDDEN" : "ACCESS_ERROR";
    return {
      ok: false,
      response: NextResponse.json({ error: result.error, code }, { status: result.status }),
    };
  }

  return { ok: true, access: result.access, supabase };
}

export function forbidUnlessCan(
  access: TripAccessResult,
  permission: TripModulePermission,
  message: string
): NextResponse | null {
  if (access[permission]) return null;
  return NextResponse.json({ error: message, code: "FORBIDDEN" }, { status: 403 });
}

/** Owner o permiso explícito de participantes (invitar, editar roles). */
export function forbidUnlessCanManageParticipants(
  access: TripAccessResult,
  message = "No tienes permisos para gestionar participantes."
): NextResponse | null {
  if (access.role === "owner" || access.can_manage_participants) return null;
  return NextResponse.json({ error: message, code: "FORBIDDEN" }, { status: 403 });
}

export function forbidUnlessCanManagePlan(
  access: TripAccessResult,
  message = "No tienes permisos para gestionar el plan."
): NextResponse | null {
  return forbidUnlessCan(access, "can_manage_plan", message);
}

export function forbidUnlessCanManageExpenses(
  access: TripAccessResult,
  message = "No tienes permisos para gestionar gastos."
): NextResponse | null {
  return forbidUnlessCan(access, "can_manage_expenses", message);
}

export function forbidUnlessCanManageMap(
  access: TripAccessResult,
  message = "No tienes permisos para gestionar el mapa y las rutas."
): NextResponse | null {
  return forbidUnlessCan(access, "can_manage_map", message);
}

export function forbidUnlessCanManageResources(
  access: TripAccessResult,
  message = "No tienes permisos para gestionar recursos y documentos."
): NextResponse | null {
  return forbidUnlessCan(access, "can_manage_resources", message);
}

export function forbidUnlessCanManageTrip(
  access: TripAccessResult,
  message = "No tienes permisos para gestionar la configuración del viaje."
): NextResponse | null {
  return forbidUnlessCan(access, "can_manage_trip", message);
}
