import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await context.params;
    if (!tripId) return NextResponse.json({ error: "Falta id" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    // Verify user has access to original trip
    const { data: participant } = await supabase
      .from("trip_participants")
      .select("role")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .neq("status", "removed")
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ error: "Sin acceso al viaje." }, { status: 403 });
    }

    // Fetch original trip
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .maybeSingle();

    if (tripError || !trip) {
      return NextResponse.json({ error: "Viaje no encontrado." }, { status: 404 });
    }

    // Create new trip (copy)
    const { data: newTrip, error: newTripError } = await supabase
      .from("trips")
      .insert({
        name: `${trip.name} (copia)`,
        destination: trip.destination,
        start_date: null,   // User sets new dates
        end_date: null,
        base_currency: trip.base_currency,
        budget_target: trip.budget_target ?? null,
        description: trip.description ?? null,
      })
      .select("id")
      .single();

    if (newTripError || !newTrip) {
      throw new Error(newTripError?.message ?? "No se pudo crear el viaje.");
    }

    const newTripId = newTrip.id;

    // Add current user as owner of new trip
    await supabase.from("trip_participants").insert({
      trip_id: newTripId,
      user_id: user.id,
      role: "owner",
      status: "active",
      display_name: user.user_metadata?.full_name ?? user.email ?? "Yo",
      email: user.email ?? null,
    });

    // Copy activities (plan)
    const { data: activities } = await supabase
      .from("trip_activities")
      .select("*")
      .eq("trip_id", tripId)
      .order("activity_date", { ascending: true })
      .order("sort_order", { ascending: true });

    if (activities?.length) {
      const activityMap = new Map<string, string>(); // old id → new id

      for (const act of activities) {
        const { id: _id, trip_id: _tid, created_at: _ca, updated_at: _ua, ...fields } = act;
        const { data: newAct } = await supabase
          .from("trip_activities")
          .insert({ ...fields, trip_id: newTripId })
          .select("id")
          .single();
        if (newAct) activityMap.set(act.id, newAct.id);
      }

      // Copy routes (with remapped activity ids)
      const { data: routes } = await supabase
        .from("trip_routes")
        .select("*")
        .eq("trip_id", tripId);

      if (routes?.length) {
        const routeInserts = routes.map(({ id: _id, trip_id: _tid, created_at: _ca, ...r }) => ({
          ...r,
          trip_id: newTripId,
          origin_activity_id: r.origin_activity_id ? (activityMap.get(r.origin_activity_id) ?? null) : null,
          destination_activity_id: r.destination_activity_id ? (activityMap.get(r.destination_activity_id) ?? null) : null,
        }));
        await supabase.from("trip_routes").insert(routeInserts);
      }
    }

    // Copy lists (without items — user starts fresh)
    const { data: lists } = await supabase
      .from("trip_lists")
      .select("*")
      .eq("trip_id", tripId);

    if (lists?.length) {
      for (const list of lists) {
        const { id: _id, trip_id: _tid, created_at: _ca, updated_at: _ua, ...listFields } = list;
        const { data: newList } = await supabase
          .from("trip_lists")
          .insert({ ...listFields, trip_id: newTripId })
          .select("id")
          .single();

        if (newList) {
          // Copy list items
          const { data: items } = await supabase
            .from("trip_list_items")
            .select("*")
            .eq("list_id", list.id);

          if (items?.length) {
            const itemInserts = items.map(({ id: _id, list_id: _lid, created_at: _ca, ...item }) => ({
              ...item,
              list_id: newList.id,
              is_done: false, // Reset checked state
            }));
            await supabase.from("trip_list_items").insert(itemInserts);
          }
        }
      }
    }

    return NextResponse.json({ ok: true, tripId: newTripId });
  } catch (err) {
    console.error("Duplicate trip error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo duplicar el viaje." },
      { status: 500 }
    );
  }
}
