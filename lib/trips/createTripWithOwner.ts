import type { SupabaseClient, User } from "@supabase/supabase-js";
import { friendlyAgencyPortalSlugError } from "@/lib/agency-portal-slug";
import { EXPENSES_GROUP_MIGRATION_FILE, isMissingColumnError } from "@/lib/expenses-group-rollout";

export type CreateTripInput = {
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string;
  trip_mode?: "travel" | "expenses";
  agency_id?: string | null;
  client_portal_slug?: string | null;
  agency_client_id?: string | null;
};

/**
 * Inserta `trips` + participante owner. Misma lógica que POST /api/trips.
 */
export async function createTripWithOwner(
  supabase: SupabaseClient,
  user: User,
  input: CreateTripInput
): Promise<{ tripId: string } | { error: string }> {
  const name = input.name.trim();
  const destination = typeof input.destination === "string" ? input.destination.trim() : "";
  const start_date = input.start_date;
  const end_date = input.end_date;
  const base_currency = /^[A-Z]{3}$/.test(input.base_currency) ? input.base_currency : "EUR";

  if (!name) return { error: "El nombre del viaje es obligatorio." };
  if (start_date && end_date && start_date > end_date) {
    return { error: "La fecha de inicio no puede ser posterior a la fecha de fin." };
  }

  const trip_mode = input.trip_mode === "expenses" ? "expenses" : "travel";

  const baseRow = {
    name,
    destination: trip_mode === "expenses" ? null : destination || null,
    start_date: trip_mode === "expenses" ? null : start_date,
    end_date: trip_mode === "expenses" ? null : end_date,
    base_currency,
    ...(input.agency_id ? { agency_id: input.agency_id } : {}),
    ...(input.client_portal_slug ? { client_portal_slug: input.client_portal_slug } : {}),
    ...(input.agency_client_id ? { agency_client_id: input.agency_client_id } : {}),
  };

  let tripInsert = await supabase
    .from("trips")
    .insert({ ...baseRow, trip_mode })
    .select("id")
    .single();

  if (
    tripInsert.error &&
    trip_mode === "expenses" &&
    isMissingColumnError(tripInsert.error.message, "trip_mode")
  ) {
    return {
      error: `El modo grupo de gastos aún no está activo en la base de datos. Ejecuta ${EXPENSES_GROUP_MIGRATION_FILE} en Supabase.`,
    };
  }

  if (tripInsert.error && isMissingColumnError(tripInsert.error.message, "trip_mode")) {
    tripInsert = await supabase.from("trips").insert(baseRow).select("id").single();
  }

  if (tripInsert.error || !tripInsert.data) {
    const raw = tripInsert.error?.message || "No se pudo crear el viaje.";
    return { error: friendlyAgencyPortalSlugError(raw) };
  }

  const tripId = String((tripInsert.data as { id: string }).id);

  const participantInsert = await supabase.from("trip_participants").insert({
    trip_id: tripId,
    display_name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.username ||
      user.email ||
      "Usuario",
    username: user.user_metadata?.username || user.email?.split("@")[0] || null,
    joined_via: "owner",
    user_id: user.id,
    role: "owner",
  });

  if (participantInsert.error) {
    await supabase.from("trips").delete().eq("id", tripId);
    return { error: participantInsert.error.message };
  }

  return { tripId };
}
