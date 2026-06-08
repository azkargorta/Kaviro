import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EXPENSES_GROUP_MIGRATION_FILE,
  isMissingColumnError,
} from "@/lib/expenses-group-rollout";
import { defaultWeatherStaysFromTrip } from "@/lib/trip-weather-stays";

export type ConvertExpenseGroupInput = {
  destination: string;
  start_date?: string | null;
  end_date?: string | null;
};

export async function convertExpenseGroupToTravel(
  supabase: SupabaseClient,
  tripId: string,
  input: ConvertExpenseGroupInput
): Promise<{ ok: true } | { error: string }> {
  const destination = input.destination.trim();
  const start_date = input.start_date?.trim() || null;
  const end_date = input.end_date?.trim() || null;

  if (!destination) {
    return { error: "Indica un destino para convertir el grupo en viaje." };
  }
  if (start_date && end_date && start_date > end_date) {
    return { error: "La fecha de inicio no puede ser posterior a la fecha de fin." };
  }

  const { data: trip, error: loadError } = await supabase
    .from("trips")
    .select("id, trip_mode, destination, start_date, end_date")
    .eq("id", tripId)
    .maybeSingle();

  if (loadError) {
    if (isMissingColumnError(loadError.message, "trip_mode")) {
      return {
        error: `Falta la columna trip_mode. Ejecuta ${EXPENSES_GROUP_MIGRATION_FILE} en Supabase.`,
      };
    }
    return { error: loadError.message };
  }

  if (!trip) return { error: "Grupo no encontrado." };

  const mode = (trip as { trip_mode?: string | null }).trip_mode;
  if (mode !== "expenses") {
    return { error: "Este proyecto ya es un viaje completo." };
  }

  const weather_stays = defaultWeatherStaysFromTrip({
    destination,
    start_date,
    end_date,
  });

  const patch: Record<string, unknown> = {
    trip_mode: "travel",
    destination,
    start_date,
    end_date,
    weather_stays,
  };

  let { error: updateError } = await supabase.from("trips").update(patch).eq("id", tripId);

  if (updateError && isMissingColumnError(updateError.message, "weather_stays")) {
    const { weather_stays: _ws, ...rest } = patch;
    ({ error: updateError } = await supabase.from("trips").update(rest).eq("id", tripId));
  }

  if (updateError) {
    if (isMissingColumnError(updateError.message, "trip_mode")) {
      return {
        error: `No se pudo cambiar el modo. Ejecuta ${EXPENSES_GROUP_MIGRATION_FILE} en Supabase.`,
      };
    }
    return { error: updateError.message };
  }

  return { ok: true };
}
