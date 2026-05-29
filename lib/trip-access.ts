import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { normalizePermissions, normalizeRole } from "@/lib/permissions";

type ParticipantRow = {
  id: string;
  trip_id: string;
  user_id: string;
  role: string | null;
  can_manage_trip: boolean | null;
  can_manage_participants: boolean | null;
  can_manage_expenses: boolean | null;
  can_manage_plan: boolean | null;
  can_manage_map: boolean | null;
  can_manage_resources: boolean | null;
};

export type TripAccessResult = {
  userId: string;
  participantId: string;
  tripId: string;
  role: "owner" | "editor" | "viewer";
  can_manage_trip: boolean;
  can_manage_participants: boolean;
  can_manage_expenses: boolean;
  can_manage_plan: boolean;
  can_manage_map: boolean;
  can_manage_resources: boolean;
};

export async function requireTripAccess(
  tripId: string
): Promise<TripAccessResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/trip/${tripId}`);
  }

  const { data: participant, error } = await supabase
    .from("trip_participants")
    .select(
      "id, trip_id, user_id, role, can_manage_trip, can_manage_participants, can_manage_expenses, can_manage_plan, can_manage_map, can_manage_resources"
    )
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .neq("status", "removed")
    .maybeSingle();

  if (error) {
    console.error("Error comprobando acceso al viaje:", error);
    redirect("/dashboard");
  }

  if (!participant) {
    redirect("/dashboard");
  }

  const row = participant as unknown as ParticipantRow;
  const role = normalizeRole(row.role);
  const perms = normalizePermissions(role, {
    can_manage_trip: row.can_manage_trip ?? undefined,
    can_manage_participants: row.can_manage_participants ?? undefined,
    can_manage_expenses: row.can_manage_expenses ?? undefined,
    can_manage_plan: row.can_manage_plan ?? undefined,
    can_manage_map: row.can_manage_map ?? undefined,
    can_manage_resources: row.can_manage_resources ?? undefined,
  });

  return {
    userId: user.id,
    participantId: row.id,
    tripId: row.trip_id,
    role,
    ...perms,
  };
}

/** Una sola comprobación de acceso por petición (layout + página comparten resultado). */
export const getCachedTripAccess = cache((tripId: string) => requireTripAccess(tripId));

export type GetTripAccessApiResult =
  | { ok: true; access: TripAccessResult }
  | { ok: false; status: 401 | 403 | 500; error: string };

/**
 * Misma comprobación que `requireTripAccess`, pero para Route Handlers:
 * no usa `redirect()` (evita respuestas 307/HTML que rompen `fetch` + JSON).
 */
export async function getTripAccessForApi(
  supabase: SupabaseClient,
  tripId: string
): Promise<GetTripAccessApiResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: "No hay sesión activa." };
  }

  const { data: participant, error } = await supabase
    .from("trip_participants")
    .select(
      "id, trip_id, user_id, role, can_manage_trip, can_manage_participants, can_manage_expenses, can_manage_plan, can_manage_map, can_manage_resources"
    )
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .neq("status", "removed")
    .maybeSingle();

  if (error) {
    console.error("Error comprobando acceso al viaje (API):", error);
    return { ok: false, status: 500, error: "No se pudo verificar el acceso al viaje." };
  }

  if (!participant) {
    return { ok: false, status: 403, error: "No tienes acceso a este viaje." };
  }

  const row = participant as unknown as ParticipantRow;
  const role = normalizeRole(row.role);
  const perms = normalizePermissions(role, {
    can_manage_trip: row.can_manage_trip ?? undefined,
    can_manage_participants: row.can_manage_participants ?? undefined,
    can_manage_expenses: row.can_manage_expenses ?? undefined,
    can_manage_plan: row.can_manage_plan ?? undefined,
    can_manage_map: row.can_manage_map ?? undefined,
    can_manage_resources: row.can_manage_resources ?? undefined,
  });

  return {
    ok: true,
    access: {
      userId: user.id,
      participantId: row.id,
      tripId: row.trip_id,
      role,
      ...perms,
    },
  };
}