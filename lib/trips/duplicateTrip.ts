import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isMissingInviteScopeColumn } from "@/lib/activity-invitees-api";
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

export type TemplateCopyStats = {
  activityKinds: number;
  routes: number;
  activities: number;
  lists: number;
  resources: number;
  reservations: number;
  announcements: number;
};

export type CopyTemplateIntoTripResult =
  | { ok: true; stats: TemplateCopyStats }
  | { ok: false; error: string };

export type DuplicateTripResult =
  | { ok: true; tripId: string; clientPortalSlug?: string | null; stats?: TemplateCopyStats }
  | { ok: false; error: string; status: number };

function resolveIncludes(input?: TripTemplateIncludes | null): TripTemplateIncludes {
  if (!input) return { ...DEFAULT_TRIP_TEMPLATE_INCLUDES };
  return input;
}

/** Orden estable sin depender de `sort_order` (columna opcional en algunos proyectos). */
async function loadTripActivitiesForCopy(db: SupabaseClient, sourceTripId: string) {
  const ordered = await db
    .from("trip_activities")
    .select("*")
    .eq("trip_id", sourceTripId)
    .order("activity_date", { ascending: true })
    .order("activity_time", { ascending: true })
    .order("created_at", { ascending: true });

  if (!ordered.error) return ordered;

  console.warn("[duplicateTrip] activities ordered read failed:", ordered.error.message);
  return db.from("trip_activities").select("*").eq("trip_id", sourceTripId);
}

const ACTIVITY_COPY_KEYS = [
  "title",
  "description",
  "rating",
  "comment",
  "activity_date",
  "activity_time",
  "place_name",
  "address",
  "latitude",
  "longitude",
  "activity_type",
  "activity_kind",
  "visit_type",
  "requires_ticket",
  "ticket_notes",
  "source",
  "invite_scope",
  "created_by_user_id",
] as const;

function pickActivityFieldsForCopy(
  act: Record<string, unknown>,
  newTripId: string,
  userId: string
): Record<string, unknown> {
  const row: Record<string, unknown> = { trip_id: newTripId };
  for (const k of ACTIVITY_COPY_KEYS) {
    if (act[k] !== undefined && act[k] !== null) row[k] = act[k];
  }
  if (!row.created_by_user_id) row.created_by_user_id = userId;
  if (!row.source) row.source = "template";
  return row;
}

function stripActivityPayloadKeys(
  payload: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  const next = { ...payload };
  for (const k of keys) delete next[k];
  return next;
}

async function insertCopiedActivities(
  db: SupabaseClient,
  activities: Record<string, unknown>[],
  newTripId: string,
  userId: string
): Promise<{ activityMap: Map<string, string>; error: string | null }> {
  const activityMap = new Map<string, string>();
  if (!activities.length) return { activityMap, error: null };

  const sourceIds = activities.map((act) =>
    typeof act.id === "string" ? act.id : String(act.id)
  );
  let payloads = activities.map((act) => pickActivityFieldsForCopy(act, newTripId, userId));

  const tryInsert = async (rows: Record<string, unknown>[]) => {
    return db.from("trip_activities").insert(rows).select("id");
  };

  let { data: inserted, error } = await tryInsert(payloads);

  if (error && isMissingInviteScopeColumn(error.message)) {
    payloads = payloads.map((p) => stripActivityPayloadKeys(p, ["invite_scope"]));
    ({ data: inserted, error } = await tryInsert(payloads));
  }

  if (
    error &&
    error.message.toLowerCase().includes("column") &&
    (error.message.toLowerCase().includes("rating") ||
      error.message.toLowerCase().includes("comment"))
  ) {
    payloads = payloads.map((p) => stripActivityPayloadKeys(p, ["rating", "comment"]));
    ({ data: inserted, error } = await tryInsert(payloads));
  }

  if (
    error &&
    error.message.toLowerCase().includes("column") &&
    (error.message.toLowerCase().includes("visit_type") ||
      error.message.toLowerCase().includes("requires_ticket") ||
      error.message.toLowerCase().includes("ticket_notes"))
  ) {
    payloads = payloads.map((p) =>
      stripActivityPayloadKeys(p, ["visit_type", "requires_ticket", "ticket_notes"])
    );
    ({ data: inserted, error } = await tryInsert(payloads));
  }

  if (error) {
    console.error("[duplicateTrip] batch activity insert failed, fallback one-by-one:", error.message);
    for (const act of activities) {
      const sourceId = typeof act.id === "string" ? act.id : String(act.id);
      let payload = pickActivityFieldsForCopy(act, newTripId, userId);
      let one = await db.from("trip_activities").insert(payload).select("id").single();
      if (one.error && isMissingInviteScopeColumn(one.error.message)) {
        payload = stripActivityPayloadKeys(payload, ["invite_scope"]);
        one = await db.from("trip_activities").insert(payload).select("id").single();
      }
      if (one.error) return { activityMap, error: one.error.message };
      if (one.data?.id) activityMap.set(sourceId, String(one.data.id));
    }
    return { activityMap, error: null };
  }

  const rows = inserted ?? [];
  for (let i = 0; i < sourceIds.length; i++) {
    const newId = rows[i]?.id;
    if (newId) activityMap.set(sourceIds[i]!, String(newId));
  }
  return { activityMap, error: null };
}

type SourceListBundle = { list: Record<string, unknown>; items: Record<string, unknown>[] };

type SourceCopyBundle = {
  kinds: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  routes: Record<string, unknown>[];
  lists: SourceListBundle[];
  resources: Record<string, unknown>[];
  reservations: Record<string, unknown>[];
  announcements: Array<{ title: string; body: string; agency_id: string }>;
};

async function preloadSourceTripData(
  db: SupabaseClient,
  sourceTripId: string,
  includes: TripTemplateIncludes,
  tripAgencyId: string | null
): Promise<{ ok: true; data: SourceCopyBundle } | { ok: false; error: string }> {
  const empty: SourceCopyBundle = {
    kinds: [],
    activities: [],
    routes: [],
    lists: [],
    resources: [],
    reservations: [],
    announcements: [],
  };

  if (includes.activityKinds) {
    const { data: kinds, error } = await db
      .from("trip_activity_kinds")
      .select("*")
      .eq("trip_id", sourceTripId);
    if (error) {
      console.error("[duplicateTrip] preload kinds:", error.message);
      return { ok: false, error: "No se pudieron leer los tipos de actividad del viaje origen." };
    }
    empty.kinds = (kinds ?? []) as Record<string, unknown>[];
  }

  if (includes.plan) {
    const { data: activities, error: actReadErr } = await loadTripActivitiesForCopy(db, sourceTripId);
    if (actReadErr) {
      console.error("[duplicateTrip] preload activities:", actReadErr.message);
      return { ok: false, error: "No se pudo leer el plan del viaje origen." };
    }
    empty.activities = (activities ?? []) as Record<string, unknown>[];
  }

  if (includes.routes) {
    const { data: routes, error: routeReadErr } = await db
      .from("trip_routes")
      .select("*")
      .eq("trip_id", sourceTripId);
    if (routeReadErr) {
      return { ok: false, error: "No se pudieron leer las rutas del viaje origen." };
    }
    empty.routes = (routes ?? []) as Record<string, unknown>[];
  }

  if (includes.lists) {
    const { data: lists, error: listsErr } = await db.from("trip_lists").select("*").eq("trip_id", sourceTripId);
    if (listsErr) {
      return { ok: false, error: "No se pudieron leer las listas del viaje origen." };
    }
    for (const list of lists ?? []) {
      const listId = typeof list.id === "string" ? list.id : String(list.id);
      const { data: items, error: itemsErr } = await db
        .from("trip_list_items")
        .select("*")
        .eq("list_id", listId);
      if (itemsErr) {
        return { ok: false, error: "No se pudieron leer las listas del viaje origen." };
      }
      empty.lists.push({
        list: list as Record<string, unknown>,
        items: (items ?? []) as Record<string, unknown>[],
      });
    }
  }

  if (includes.docs) {
    const { data: resources, error: resErr } = await db
      .from("trip_resources")
      .select("*")
      .eq("trip_id", sourceTripId);
    if (resErr) {
      return { ok: false, error: "No se pudieron leer los documentos del viaje origen." };
    }
    empty.resources = (resources ?? []) as Record<string, unknown>[];

    const { data: reservations, error: resvReadErr } = await db
      .from("trip_reservations")
      .select("*")
      .eq("trip_id", sourceTripId);
    if (resvReadErr) {
      return { ok: false, error: "No se pudieron leer las reservas del viaje origen." };
    }
    empty.reservations = (reservations ?? []) as Record<string, unknown>[];
  }

  if (includes.announcements && tripAgencyId) {
    const { data: announcements, error: annReadErr } = await db
      .from("agency_trip_announcements")
      .select("title, body, agency_id")
      .eq("trip_id", sourceTripId);
    if (annReadErr) {
      return { ok: false, error: "No se pudieron leer los avisos del viaje origen." };
    }
    empty.announcements = (announcements ?? []) as SourceCopyBundle["announcements"];
  }

  return { ok: true, data: empty };
}

async function rollbackCreatedTrip(db: SupabaseClient, tripId: string) {
  const { error } = await db.from("trips").delete().eq("id", tripId);
  if (error) console.error("[duplicateTrip] rollback delete trip:", error.message);
}

async function failAfterPartialCreate(
  db: SupabaseClient,
  tripId: string,
  error: string,
  status: number
): Promise<DuplicateTripResult> {
  await rollbackCreatedTrip(db, tripId);
  return { ok: false, error, status };
}

async function applySourceCopyToTrip(
  db: SupabaseClient,
  targetTripId: string,
  source: SourceCopyBundle,
  includes: TripTemplateIncludes,
  user: User,
  tripAgencyId: string | null
): Promise<CopyTemplateIntoTripResult> {
  const stats: TemplateCopyStats = {
    activityKinds: 0,
    activities: 0,
    routes: 0,
    lists: 0,
    resources: 0,
    reservations: 0,
    announcements: 0,
  };

  if (includes.activityKinds && source.kinds.length) {
    const { count } = await db
      .from("trip_activity_kinds")
      .select("id", { count: "exact", head: true })
      .eq("trip_id", targetTripId);
    if ((count ?? 0) === 0) {
      const kindInserts = source.kinds.map((row) => {
        const { id: _id, trip_id: _tid, created_at: _ca, updated_at: _ua, ...k } = row;
        return { ...k, trip_id: targetTripId };
      });
      const { error: kindsErr } = await db.from("trip_activity_kinds").insert(kindInserts);
      if (kindsErr) return { ok: false, error: "No se pudieron copiar los tipos de actividad." };
      stats.activityKinds = kindInserts.length;
    }
  }

  let activityMap = new Map<string, string>();

  if (includes.plan) {
    if (source.activities.length === 0) {
      return {
        ok: false,
        error:
          "El viaje origen de la plantilla no tiene actividades en el plan. Abre ese viaje en Plan y comprueba que la plantilla apunta al viaje correcto.",
      };
    }

    const { count: existingActs } = await db
      .from("trip_activities")
      .select("id", { count: "exact", head: true })
      .eq("trip_id", targetTripId);

    if ((existingActs ?? 0) > 0) {
      return {
        ok: false,
        error:
          "Este viaje ya tiene actividades. Para volver a importar la plantilla, elimina las actividades actuales o crea un viaje nuevo desde la plantilla.",
      };
    }

    const inserted = await insertCopiedActivities(db, source.activities, targetTripId, user.id);
    if (inserted.error) {
      return { ok: false, error: "No se pudo copiar el plan del viaje." };
    }
    activityMap = inserted.activityMap;
    stats.activities = inserted.activityMap.size;
  }

  if (includes.routes && source.routes.length) {
    const routeInserts = source.routes.map((row) => {
      const { id: _id, trip_id: _tid, created_at: _ca, ...r } = row;
      return {
        ...r,
        trip_id: targetTripId,
        origin_activity_id:
          r.origin_activity_id && typeof r.origin_activity_id === "string"
            ? (activityMap.get(r.origin_activity_id) ?? null)
            : null,
        destination_activity_id:
          r.destination_activity_id && typeof r.destination_activity_id === "string"
            ? (activityMap.get(r.destination_activity_id) ?? null)
            : null,
      };
    });
    const { error: routesErr } = await db.from("trip_routes").insert(routeInserts);
    if (routesErr) return { ok: false, error: "No se pudieron copiar las rutas del viaje." };
    stats.routes = routeInserts.length;
  }

  if (includes.lists && source.lists.length) {
    let listCount = 0;
    for (const { list, items } of source.lists) {
      const { id: _id, trip_id: _tid, created_at: _ca, updated_at: _ua, ...listFields } = list;
      const { data: newList, error: listErr } = await db
        .from("trip_lists")
        .insert({ ...listFields, trip_id: targetTripId })
        .select("id")
        .single();

      if (listErr || !newList) return { ok: false, error: "No se pudieron copiar las listas del viaje." };

      listCount += 1;
      if (items.length) {
        const itemInserts = items.map((row) => {
          const { id: _i, list_id: _lid, created_at: _ica, ...item } = row;
          return { ...item, list_id: newList.id, is_done: false };
        });
        const { error: itemsErr } = await db.from("trip_list_items").insert(itemInserts);
        if (itemsErr) return { ok: false, error: "No se pudieron copiar los ítems de las listas." };
      }
    }
    stats.lists = listCount;
  }

  if (includes.docs) {
    const resourceMap = new Map<string, string>();

    if (source.resources.length) {
      for (const res of source.resources) {
        const oldId = typeof res.id === "string" ? res.id : String(res.id);
        const { id: _id, trip_id: _tid, created_at: _ca, updated_at: _ua, ...fields } = res;
        const { data: newRes, error: resErr } = await db
          .from("trip_resources")
          .insert({
            ...fields,
            trip_id: targetTripId,
            created_by_user_id: user.id,
          })
          .select("id")
          .single();
        if (resErr) return { ok: false, error: "No se pudieron copiar los documentos del viaje." };
        if (newRes?.id) resourceMap.set(oldId, String(newRes.id));
      }
      stats.resources = source.resources.length;
    }

    if (source.reservations.length) {
      const resvInserts = source.reservations.map((row) => {
        const {
          id: _id,
          trip_id: _tid,
          created_at: _ca,
          updated_at: _ua,
          resource_id,
          ...r
        } = row;
        return {
          ...r,
          trip_id: targetTripId,
          resource_id:
            resource_id && typeof resource_id === "string"
              ? (resourceMap.get(resource_id) ?? null)
              : null,
          created_by_user_id: user.id,
        };
      });
      const { error: resvErr } = await db.from("trip_reservations").insert(resvInserts);
      if (resvErr) return { ok: false, error: "No se pudieron copiar las reservas del viaje." };
      stats.reservations = resvInserts.length;
    }
  }

  if (includes.announcements && tripAgencyId && source.announcements.length) {
    const { error: annErr } = await db.from("agency_trip_announcements").insert(
      source.announcements.map((a) => ({
        trip_id: targetTripId,
        agency_id: a.agency_id,
        title: a.title,
        body: a.body,
        created_by: user.id,
      }))
    );
    if (annErr) return { ok: false, error: "No se pudieron copiar los avisos del viaje." };
    stats.announcements = source.announcements.length;
  }

  return { ok: true, stats };
}

/** Copia el contenido de un viaje origen (plantilla) en un viaje ya existente y vacío de plan. */
export async function copyTemplateSourceIntoTrip(
  supabase: SupabaseClient,
  user: User,
  targetTripId: string,
  sourceTripId: string,
  includes: TripTemplateIncludes
): Promise<CopyTemplateIntoTripResult> {
  const { data: targetTrip } = await supabase
    .from("trips")
    .select("id, agency_id")
    .eq("id", targetTripId)
    .maybeSingle();
  if (!targetTrip) return { ok: false, error: "Viaje no encontrado." };

  const { data: sourceTrip } = await supabase
    .from("trips")
    .select("id, agency_id")
    .eq("id", sourceTripId)
    .maybeSingle();
  if (!sourceTrip) return { ok: false, error: "Viaje origen de la plantilla no encontrado." };

  const targetAgencyId = (targetTrip as { agency_id?: string | null }).agency_id ?? null;
  const sourceAgencyId = (sourceTrip as { agency_id?: string | null }).agency_id ?? null;
  if (!targetAgencyId || targetAgencyId !== sourceAgencyId) {
    return { ok: false, error: "La plantilla no pertenece a la misma agencia que el viaje." };
  }

  const ctx = await getAgencyForUser(supabase, user.id);
  if (!ctx || ctx.agency.id !== targetAgencyId) {
    return { ok: false, error: "Sin permiso para modificar este viaje." };
  }

  const db = createSupabaseAdmin();
  const preloaded = await preloadSourceTripData(db, sourceTripId, includes, sourceAgencyId);
  if (!preloaded.ok) return { ok: false, error: preloaded.error };

  return applySourceCopyToTrip(db, targetTripId, preloaded.data, includes, user, sourceAgencyId);
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

  const preloaded = await preloadSourceTripData(db, sourceTripId, includes, tripAgencyId);
  if (!preloaded.ok) {
    return { ok: false, error: preloaded.error, status: 500 };
  }
  const source = preloaded.data;

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

  const { error: participantErr } = await db.from("trip_participants").insert({
    trip_id: newTripId,
    user_id: user.id,
    role: "owner",
    status: "active",
    display_name: user.user_metadata?.full_name ?? user.email ?? "Yo",
    email: user.email ?? null,
    joined_via: "owner",
  });
  if (participantErr) {
    await rollbackCreatedTrip(db, newTripId);
    return { ok: false, error: "No se pudo asignar el viaje al usuario.", status: 500 };
  }

  const applied = await applySourceCopyToTrip(
    db,
    newTripId,
    source,
    includes,
    user,
    targetAgencyId ?? tripAgencyId
  );
  if (!applied.ok) {
    return failAfterPartialCreate(db, newTripId, applied.error, 500);
  }

  return { ok: true, tripId: newTripId, clientPortalSlug, stats: applied.stats };
}
