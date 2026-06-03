import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureAgencyPortalRow } from "@/lib/agency-portal";

/** Tipos de actividad por defecto para programas de agencia (listos para el viajero en Kaviro). */
const DEFAULT_TRIP_ACTIVITY_KINDS: Array<{
  kind_key: string;
  label: string;
  emoji: string;
  color: string;
}> = [
  { kind_key: "visit", label: "Visita", emoji: "📍", color: "#64748b" },
  { kind_key: "transport", label: "Transporte", emoji: "✈️", color: "#0ea5e9" },
  { kind_key: "lodging", label: "Alojamiento", emoji: "🏨", color: "#8b5cf6" },
  { kind_key: "restaurant", label: "Comida", emoji: "🍴", color: "#f97316" },
  { kind_key: "activity", label: "Actividad", emoji: "🎟️", color: "#10b981" },
  { kind_key: "museum", label: "Museo", emoji: "🏛️", color: "#f59e0b" },
  { kind_key: "excursion", label: "Excursión", emoji: "🚌", color: "#2563eb" },
];

/**
 * Deja un viaje de agencia listo para operar en Kaviro Trips y para invitar viajeros al modo Kaviro (B2C).
 */
export async function bootstrapAgencyTripForTravelers(
  supabase: SupabaseClient,
  tripId: string,
  agencyId: string,
  clientPortalSlug: string
): Promise<void> {
  await ensureAgencyPortalRow(supabase, tripId, agencyId, clientPortalSlug);

  const { count } = await supabase
    .from("trip_activity_kinds")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId);

  if ((count ?? 0) === 0) {
    await supabase.from("trip_activity_kinds").insert(
      DEFAULT_TRIP_ACTIVITY_KINDS.map((k) => ({
        trip_id: tripId,
        kind_key: k.kind_key,
        label: k.label,
        emoji: k.emoji,
        color: k.color,
      }))
    );
  }

  const updates: Record<string, unknown> = {
    is_demo: false,
    updated_at: new Date().toISOString(),
  };

  await supabase.from("trips").update(updates).eq("id", tripId);
}
