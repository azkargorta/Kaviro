import { NextResponse } from "next/server";
import { requireTripAccessApi } from "@/lib/trip-access-api";
import { loadTripSettingsRow } from "@/lib/load-trip-settings-row";
import { normalizeWeatherStays } from "@/lib/trip-weather-stays";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: tripId } = await context.params;
    if (!tripId) return NextResponse.json({ error: "Falta id" }, { status: 400 });

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;

    const loaded = await loadTripSettingsRow(gate.supabase, tripId);
    const trip = loaded.data as Record<string, unknown> | null;

    const { access } = gate;
    const weather_stays = normalizeWeatherStays(trip?.weather_stays);

    return NextResponse.json({
      missingColumns: loaded.missingColumns,
      access: {
        role: access.role,
        can_manage_trip: access.can_manage_trip,
        can_manage_participants: access.can_manage_participants,
        can_manage_expenses: access.can_manage_expenses,
        can_manage_plan: access.can_manage_plan,
        can_manage_map: access.can_manage_map,
        can_manage_resources: access.can_manage_resources,
      },
      trip: trip
        ? {
            id: trip.id,
            name: trip.name,
            destination: trip.destination,
            start_date: trip.start_date,
            end_date: trip.end_date,
            base_currency: trip.base_currency,
            budget_target: trip.budget_target,
            weather_stays,
          }
        : null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo cargar el acceso al viaje." },
      { status: 500 }
    );
  }
}
