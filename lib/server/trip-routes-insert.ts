import type { SupabaseClient } from "@supabase/supabase-js";

function isMissingColumnError(message: string, column: string): boolean {
  const m = message.toLowerCase();
  const col = column.toLowerCase();
  return m.includes(col) && (m.includes("schema cache") || m.includes("could not find"));
}

/**
 * Inserta en trip_routes omitiendo columnas opcionales que no existan en el esquema del proyecto.
 */
export async function insertTripRouteRow(
  supabase: SupabaseClient,
  payload: Record<string, unknown>
): Promise<{ ok: true; id: string; error: null } | { ok: false; id: null; error: string }> {
  let current: Record<string, unknown> = { ...payload };

  const optionalColumns = ["created_by_user_id", "color", "notes", "route_order"] as const;

  for (let attempt = 0; attempt <= optionalColumns.length; attempt++) {
    const response = await supabase.from("trip_routes").insert(current).select("id").single();
    if (!response.error) {
      const id = typeof response.data?.id === "string" ? response.data.id : "";
      return { ok: true, id, error: null };
    }

    const msg = response.error.message;
    const missing = optionalColumns.find((col) => isMissingColumnError(msg, col));
    if (!missing) return { ok: false, id: null, error: msg };

    const { [missing]: _omit, ...next } = current;
    current = next;
  }

  return { ok: false, id: null, error: "No se pudo guardar la ruta." };
}
