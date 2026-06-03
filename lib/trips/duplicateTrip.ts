import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAgencyForUser } from "@/lib/agency";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  friendlyAgencyPortalSlugError,
  resolveUniqueAgencyClientPortalSlug,
} from "@/lib/agency-portal-slug";
import {
  DEFAULT_TRIP_TEMPLATE_INCLUDES,
  type TripTemplateIncludes,
} from "@/lib/trips/template-includes";

export type DuplicateTripOptions = {
  customName?: string;
  resetDates?: boolean;
  agencyId?: string | null;
  clientPortalSlug?: string | null;
  /** Si se omite, se copian plan, rutas y listas (comportamiento histórico). */
  includes?: TripTemplateIncludes | null;
};

export type DuplicateTripResult =
  | { ok: true; tripId: string; clientPortalSlug?: string | null }
  | { ok: false; error: string; status: number };

function resolveIncludes(input?: TripTemplateIncludes | null): TripTemplateIncludes {
  if (!input) return { ...DEFAULT_TRIP_TEMPLATE_INCLUDES };
  return input;
}

/** Duplica bloques seleccionados de un viaje al que el usuario tiene acceso. */
export async function duplicateTripForUser(
  supabase: SupabaseClient,
  user: User,
  sourceTripId: string,
  options: DuplicateTripOptions = {}
): Promise<DuplicateTripResult> {
  const includes = resolveIncludes(options.includes);

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
  const sourceDescription = (trip as { description?: string | null }).description ?? null;

  /** Copia con service role: el staff de agencia suele no ser participante del viaje origen (RLS). */
  const db = createSupabaseAdmin();

  let clientPortalSlug =
    typeof options.clientPortalSlug === "string" && options.clientPortalSlug.trim()
      ? options.clientPortalSlug.trim()
      : null;
  if (clientPortalSlug && targetAgencyId) {
    clientPortalSlug = await resolveUniqueAgencyClientPortalSlug(db, targetAgencyId, clientPortalSlug);
  }

  const { data: newTrip, error: newTripError } = await db
    .from("trips")
    .insert({
      name: newName,
      destination: trip.destination,
      start_date: options.resetDates === false ? trip.start_date : null,
      end_date: options.resetDates === false ? trip.end_date : null,
      base_currency: trip.base_currency,
      budget_target: trip.budget_target ?? null,
      description: includes.notes ? sourceDescription : null,
      ...(targetAgencyId ? { agency_id: targetAgencyId } : {}),
      ...(clientPortalSlug ? { client_portal_slug: clientPortalSlug } : {}),
    })
    .select("id")
    .single();

  if (newTripError || !newTrip) {
    const raw = newTripError?.message ?? "No se pudo crear el viaje.";
    return {
      ok: false,
      error: friendlyAgencyPortalSlugError(raw),
      status: 500,
    };
  }

  const newTripId = newTrip.id as string;

  await db.from("trip_participants").insert({
    trip_id: newTripId,
    user_id: user.id,
    role: "owner",
    status: "active",
    display_name: user.user_metadata?.full_name ?? user.email ?? "Yo",
    email: user.email ?? null,
    joined_via: "owner",
  });

  if (includes.activityKinds) {
    const { data: kinds } = await db
      .from("trip_activity_kinds")
      .select("*")
      .eq("trip_id", sourceTripId);

    if (kinds?.length) {
      const kindInserts = kinds.map(({ id: _id, trip_id: _tid, created_at: _ca, updated_at: _ua, ...k }) => ({
        ...k,
        trip_id: newTripId,
      }));
      const { error: kindsErr } = await db.from("trip_activity_kinds").insert(kindInserts);
      if (kindsErr) {
        return { ok: false, error: "No se pudieron copiar los tipos de actividad.", status: 500 };
      }
    }
  }

  const activityMap = new Map<string, string>();

  if (includes.plan) {
    const { data: activities, error: actReadErr } = await db
      .from("trip_activities")
      .select("*")
      .eq("trip_id", sourceTripId)
      .order("activity_date", { ascending: true })
      .order("sort_order", { ascending: true });

    if (actReadErr) {
      return { ok: false, error: "No se pudo leer el plan del viaje origen.", status: 500 };
    }

    if (activities?.length) {
      for (const act of activities) {
        const { id: _id, trip_id: _tid, created_at: _ca, updated_at: _ua, ...fields } = act;
        const { data: newAct, error: actInsErr } = await db
          .from("trip_activities")
          .insert({ ...fields, trip_id: newTripId })
          .select("id")
          .single();
        if (actInsErr) {
          return { ok: false, error: "No se pudo copiar el plan del viaje.", status: 500 };
        }
        if (newAct) activityMap.set(act.id, newAct.id);
      }
    }
  }

  if (includes.routes) {
    const { data: routes, error: routeReadErr } = await db
      .from("trip_routes")
      .select("*")
      .eq("trip_id", sourceTripId);

    if (routeReadErr) {
      return { ok: false, error: "No se pudieron leer las rutas del viaje origen.", status: 500 };
    }

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
      const { error: routesErr } = await db.from("trip_routes").insert(routeInserts);
      if (routesErr) {
        return { ok: false, error: "No se pudieron copiar las rutas del viaje.", status: 500 };
      }
    }
  }

  if (includes.lists) {
    const { data: lists } = await db.from("trip_lists").select("*").eq("trip_id", sourceTripId);

    if (lists?.length) {
      for (const list of lists) {
        const { id: _id, trip_id: _tid, created_at: _ca, updated_at: _ua, ...listFields } = list;
        const { data: newList, error: listErr } = await db
          .from("trip_lists")
          .insert({ ...listFields, trip_id: newTripId })
          .select("id")
          .single();

        if (listErr || !newList) {
          return { ok: false, error: "No se pudieron copiar las listas del viaje.", status: 500 };
        }

        const { data: items } = await db
          .from("trip_list_items")
          .select("*")
          .eq("list_id", list.id);

        if (items?.length) {
          const itemInserts = items.map(({ id: _id, list_id: _lid, created_at: _ca, ...item }) => ({
            ...item,
            list_id: newList.id,
            is_done: false,
          }));
          const { error: itemsErr } = await db.from("trip_list_items").insert(itemInserts);
          if (itemsErr) {
            return { ok: false, error: "No se pudieron copiar los ítems de las listas.", status: 500 };
          }
        }
      }
    }
  }

  if (includes.docs) {
    const resourceMap = new Map<string, string>();
    const { data: resources } = await db
      .from("trip_resources")
      .select("*")
      .eq("trip_id", sourceTripId);

    if (resources?.length) {
      for (const res of resources) {
        const { id: oldId, trip_id: _tid, created_at: _ca, updated_at: _ua, ...fields } = res;
        const { data: newRes, error: resErr } = await db
          .from("trip_resources")
          .insert({
            ...fields,
            trip_id: newTripId,
            created_by_user_id: user.id,
          })
          .select("id")
          .single();
        if (resErr) {
          return { ok: false, error: "No se pudieron copiar los documentos del viaje.", status: 500 };
        }
        if (newRes) resourceMap.set(oldId, newRes.id);
      }
    }

    const { data: reservations } = await db
      .from("trip_reservations")
      .select("*")
      .eq("trip_id", sourceTripId);

    if (reservations?.length) {
      const resvInserts = reservations.map(
        ({ id: _id, trip_id: _tid, created_at: _ca, updated_at: _ua, resource_id, ...r }) => ({
          ...r,
          trip_id: newTripId,
          resource_id: resource_id ? (resourceMap.get(resource_id) ?? null) : null,
          created_by_user_id: user.id,
        })
      );
      const { error: resvErr } = await db.from("trip_reservations").insert(resvInserts);
      if (resvErr) {
        return { ok: false, error: "No se pudieron copiar las reservas del viaje.", status: 500 };
      }
    }
  }

  if (includes.announcements && tripAgencyId) {
    const { data: announcements } = await db
      .from("agency_trip_announcements")
      .select("title, body, agency_id")
      .eq("trip_id", sourceTripId);

    if (announcements?.length) {
      const { error: annErr } = await db.from("agency_trip_announcements").insert(
        announcements.map((a) => ({
          trip_id: newTripId,
          agency_id: a.agency_id,
          title: a.title,
          body: a.body,
          created_by: user.id,
        }))
      );
      if (annErr) {
        return { ok: false, error: "No se pudieron copiar los avisos del viaje.", status: 500 };
      }
    }
  }

  return { ok: true, tripId: newTripId, clientPortalSlug };
}
