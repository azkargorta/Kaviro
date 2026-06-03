import type { SupabaseClient } from "@supabase/supabase-js";
import { getAgencyForUser } from "@/lib/agency";
import { normalizeRole } from "@/lib/permissions";

type ParticipantGuardRow = {
  role: string | null;
  can_manage_trip: boolean | null;
  status?: string | null;
};

function canManageTripRow(row: ParticipantGuardRow) {
  const role = normalizeRole(row.role);
  return role === "owner" || Boolean(row.can_manage_trip);
}

function pickParticipantRow(rows: ParticipantGuardRow[], options?: { allowRemovedOwner?: boolean }) {
  const active = rows.filter((r) => String(r.status || "active").toLowerCase() !== "removed");
  const pool = active.length ? active : options?.allowRemovedOwner ? rows : [];
  if (!pool.length) return null;
  return pool.find((r) => normalizeRole(r.role) === "owner") ?? pool[0]!;
}

export type CanDeleteTripResult =
  | { ok: true; supabase: SupabaseClient }
  | { ok: false; status: number; error: string };

/** Owner del viaje o miembro de la agencia (viajes Kaviro Trips). */
export async function canUserDeleteTrip(
  supabase: SupabaseClient,
  userId: string,
  tripId: string
): Promise<CanDeleteTripResult> {
  const { data: trip, error: tripErr } = await supabase
    .from("trips")
    .select("id, agency_id")
    .eq("id", tripId)
    .maybeSingle();

  if (tripErr) return { ok: false, status: 500, error: tripErr.message };
  if (!trip) return { ok: false, status: 404, error: "Viaje no encontrado." };

  const agencyId = (trip as { agency_id?: string | null }).agency_id ?? null;

  if (agencyId) {
    const ctx = await getAgencyForUser(supabase, userId);
    if (ctx && ctx.agency.id === agencyId) {
      return { ok: true, supabase };
    }
  }

  const { data: rows, error: partErr } = await supabase
    .from("trip_participants")
    .select("role, can_manage_trip, status")
    .eq("trip_id", tripId)
    .eq("user_id", userId);

  if (partErr) return { ok: false, status: 500, error: partErr.message };

  const participant =
    pickParticipantRow((rows ?? []) as ParticipantGuardRow[]) ??
    pickParticipantRow((rows ?? []) as ParticipantGuardRow[], { allowRemovedOwner: true });

  if (!participant) {
    return { ok: false, status: 403, error: "Sin acceso al viaje." };
  }

  if (!canManageTripRow(participant)) {
    return { ok: false, status: 403, error: "No tienes permisos para eliminar el viaje." };
  }

  return { ok: true, supabase };
}
