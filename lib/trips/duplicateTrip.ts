import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAgencyForUser } from "@/lib/agency";

export type DuplicateTripOptions = {
  customName?: string;
  resetDates?: boolean;
  agencyId?: string | null;
  clientPortalSlug?: string | null;
};

export type DuplicateTripResult =
  | { ok: true; tripId: string }
  | { ok: false; error: string; status: number };

/** Duplica plan, rutas y listas de un viaje al que el usuario tiene acceso. */
export async function duplicateTripForUser(
  supabase: SupabaseClient,
  user: User,
  sourceTripId: string,
  options: DuplicateTripOptions = {}
): Promise<DuplicateTripResult> {
  const { data: participant } = await supabase
    .from("trip_participants")
    .select("role")
    .eq("trip_id", sourceTripId)
    .eq("user_id", user.id)
    .neq("status", "removed")
    .maybeSingle();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", sourceTripId)
    .maybeSingle();

  if (tripError || !trip) {
    return { ok: false, error: "Viaje no encontrado.", status: 404 };
  }

  const tripAgencyId = (trip as { agency_id?: string | null }).agency_id ?? null;

  if (!participant) {
    if (!tripAgencyId) {
      return { ok: false, error: "Sin acceso al viaje.", status: 403 };
    }
    const ctx = await getAgencyForUser(supabase, user.id);
    if (!ctx || ctx.agency.id !== tripAgencyId) {
      return { ok: false, error: "Sin acceso al viaje.", status: 403 };
    }
  }

  const newName = options.customName?.trim() || `${trip.name} (copia)`;
  const targetAgencyId = options.agencyId ?? tripAgencyId;

  const { data: newTrip, error: newTripError } = await supabase
    .from("trips")
    .insert({
      name: newName,
      destination: trip.destination,
      start_date: options.resetDates === false ? trip.start_date : null,
      end_date: options.resetDates === false ? trip.end_date : null,
      base_currency: trip.base_currency,
      budget_target: trip.budget_target ?? null,
      description: (trip as { description?: string | null }).description ?? null,
      ...(targetAgencyId ? { agency_id: targetAgencyId } : {}),
      ...(options.clientPortalSlug ? { client_portal_slug: options.clientPortalSlug } : {}),
    })
    .select("id")
    .single();

  if (newTripError || !newTrip) {
    return {
      ok: false,
      error: newTripError?.message ?? "No se pudo crear el viaje.",
      status: 500,
    };
  }

  const newTripId = newTrip.id as string;

  await supabase.from("trip_participants").insert({
    trip_id: newTripId,
    user_id: user.id,
    role: "owner",
    status: "active",
    display_name: user.user_metadata?.full_name ?? user.email ?? "Yo",
    email: user.email ?? null,
    joined_via: "owner",
  });

  const { data: activities } = await supabase
    .from("trip_activities")
    .select("*")
    .eq("trip_id", sourceTripId)
    .order("activity_date", { ascending: true })
    .order("sort_order", { ascending: true });

  if (activities?.length) {
    const activityMap = new Map<string, string>();

    for (const act of activities) {
      const { id: _id, trip_id: _tid, created_at: _ca, updated_at: _ua, ...fields } = act;
      const { data: newAct } = await supabase
        .from("trip_activities")
        .insert({ ...fields, trip_id: newTripId })
        .select("id")
        .single();
      if (newAct) activityMap.set(act.id, newAct.id);
    }

    const { data: routes } = await supabase
      .from("trip_routes")
      .select("*")
      .eq("trip_id", sourceTripId);

    if (routes?.length) {
      const routeInserts = routes.map(({ id: _id, trip_id: _tid, created_at: _ca, ...r }) => ({
        ...r,
        trip_id: newTripId,
        origin_activity_id: r.origin_activity_id
          ? (activityMap.get(r.origin_activity_id) ?? null)
          : null,
        destination_activity_id: r.destination_activity_id
          ? (activityMap.get(r.destination_activity_id) ?? null)
          : null,
      }));
      await supabase.from("trip_routes").insert(routeInserts);
    }
  }

  const { data: lists } = await supabase.from("trip_lists").select("*").eq("trip_id", sourceTripId);

  if (lists?.length) {
    for (const list of lists) {
      const { id: _id, trip_id: _tid, created_at: _ca, updated_at: _ua, ...listFields } = list;
      const { data: newList } = await supabase
        .from("trip_lists")
        .insert({ ...listFields, trip_id: newTripId })
        .select("id")
        .single();

      if (newList) {
        const { data: items } = await supabase
          .from("trip_list_items")
          .select("*")
          .eq("list_id", list.id);

        if (items?.length) {
          const itemInserts = items.map(({ id: _id, list_id: _lid, created_at: _ca, ...item }) => ({
            ...item,
            list_id: newList.id,
            is_done: false,
          }));
          await supabase.from("trip_list_items").insert(itemInserts);
        }
      }
    }
  }

  return { ok: true, tripId: newTripId };
}
