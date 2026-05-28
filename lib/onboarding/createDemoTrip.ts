import type { User } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  DEMO_TRIP_BASE_CURRENCY,
  DEMO_TRIP_DESTINATION,
  DEMO_TRIP_NAME,
  DEMO_GHOST_PARTICIPANTS,
  DEMO_ROUTES,
  DEMO_LISTS,
  DEMO_CHATS,
  buildDemoActivities,
  buildDemoExpenses,
  demoTripDateRange,
} from "@/lib/onboarding/demo-trip-seed";
import {
  isCurrentLondonDemoTrip,
  isDemoTripForListing,
  type TripDemoFields,
} from "@/lib/onboarding/is-demo-trip";

export type DemoOnboardingProfile = {
  demo_trip_id: string | null;
  demo_onboarding_completed_at: string | null;
  demo_onboarding_skipped_at: string | null;
};

function ownerDisplayName(user: User): string {
  const meta = user.user_metadata || {};
  return (
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    (typeof meta.username === "string" && meta.username.trim()) ||
    user.email?.split("@")[0] ||
    "Tú"
  );
}

export async function readDemoOnboardingProfile(userId: string): Promise<DemoOnboardingProfile | null> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("demo_trip_id, demo_onboarding_completed_at, demo_onboarding_skipped_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("demo_trip_id") || msg.includes("column")) return null;
    throw error;
  }

  return (data as DemoOnboardingProfile | null) ?? null;
}

export function shouldRedirectToDemoTour(profile: DemoOnboardingProfile | null): boolean {
  if (!profile) return false;
  if (profile.demo_onboarding_skipped_at || profile.demo_onboarding_completed_at) return false;
  return Boolean(profile.demo_trip_id);
}

/** Aún no ha completado ni saltado el tour demo (primera visita al panel). */
export function isFirstDemoOnboardingVisit(profile: DemoOnboardingProfile | null): boolean {
  if (!profile) return true;
  if (profile.demo_onboarding_skipped_at || profile.demo_onboarding_completed_at) return false;
  return true;
}

export async function ensureDemoTripForUser(user: User): Promise<{
  tripId: string;
  created: boolean;
  profile: DemoOnboardingProfile;
}> {
  const admin = createSupabaseAdmin();
  const existing = await readDemoOnboardingProfile(user.id);

  if (existing?.demo_trip_id) {
    const { data: trip } = await admin
      .from("trips")
      .select("id, name, destination, is_demo")
      .eq("id", existing.demo_trip_id)
      .maybeSingle();
    if (trip?.id && isCurrentLondonDemoTrip(trip as TripDemoFields)) {
      return {
        tripId: String(trip.id),
        created: false,
        profile: existing,
      };
    }
    if (trip?.id) {
      await admin.from("trips").delete().eq("id", existing.demo_trip_id);
      await admin
        .from("profiles")
        .update({ demo_trip_id: null, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    }
  }

  const { start_date, end_date } = demoTripDateRange();
  const ownerName = ownerDisplayName(user);

  let tripId: string;

  const tripInsert = await admin
    .from("trips")
    .insert({
      name: DEMO_TRIP_NAME,
      destination: DEMO_TRIP_DESTINATION,
      start_date,
      end_date,
      base_currency: DEMO_TRIP_BASE_CURRENCY,
      is_demo: true,
    })
    .select("id")
    .single();

  if (!tripInsert.error && tripInsert.data) {
    tripId = String((tripInsert.data as { id: string }).id);
  } else {
    const fallback = await admin
      .from("trips")
      .insert({
        name: DEMO_TRIP_NAME,
        destination: DEMO_TRIP_DESTINATION,
        start_date,
        end_date,
        base_currency: DEMO_TRIP_BASE_CURRENCY,
      })
      .select("id")
      .single();
    if (fallback.error || !fallback.data) {
      throw new Error(fallback.error?.message || tripInsert.error?.message || "No se pudo crear el viaje demo.");
    }
    tripId = String((fallback.data as { id: string }).id);
  }

  await admin.from("trip_participants").insert({
    trip_id: tripId,
    display_name: ownerName,
    username: user.user_metadata?.username || user.email?.split("@")[0] || null,
    user_id: user.id,
    role: "owner",
    status: "active",
    joined_via: "demo",
    linked_at: new Date().toISOString(),
    can_manage_trip: true,
    can_manage_participants: true,
    can_manage_expenses: true,
    can_manage_plan: true,
    can_manage_map: true,
    can_manage_resources: true,
  });

  for (const ghost of DEMO_GHOST_PARTICIPANTS) {
    await admin.from("trip_participants").insert({
      trip_id: tripId,
      display_name: ghost.display_name,
      role: ghost.role,
      status: "active",
      joined_via: "demo",
      user_id: null,
    });
  }

  const activities = buildDemoActivities(start_date);
  // title → {id, lat, lng} map for linking routes to activities
  const activityIdByTitle = new Map<string, string>();
  const activityCoordsByTitle = new Map<string, { lat: number; lng: number }>();
  if (activities.length) {
    const { data: insertedActivities } = await admin.from("trip_activities").insert(
      activities.map((a) => ({
        trip_id: tripId,
        title: a.title,
        activity_date: a.activity_date,
        activity_time: a.activity_time,
        place_name: a.place_name,
        address: a.address,
        activity_kind: a.activity_kind,
        latitude: a.latitude,
        longitude: a.longitude,
        ...(a.rating != null ? { rating: a.rating } : {}),
        ...(a.comment != null ? { comment: a.comment } : {}),
        source: "demo",
        created_by_user_id: user.id,
      }))
    ).select("id, title, latitude, longitude");
    if (insertedActivities) {
      for (const row of insertedActivities as Array<{ id: string; title: string; latitude: number; longitude: number }>) {
        activityIdByTitle.set(row.title, row.id);
        if (row.latitude != null && row.longitude != null) {
          activityCoordsByTitle.set(row.title, { lat: row.latitude, lng: row.longitude });
        }
      }
    }
  }

  const expenses = buildDemoExpenses(start_date, ownerName);
  if (expenses.length) {
    await admin.from("trip_expenses").insert(
      expenses.map((e) => ({
        trip_id: tripId,
        title: e.title,
        category: e.category,
        amount: e.amount,
        currency: e.currency,
        expense_date: e.expense_date,
        payer_name: e.payer_name,
        participant_names: e.participant_names,
        paid_by_names: e.paid_by_names,
        owed_by_names: e.owed_by_names,
        notes: e.notes,
      }))
    );
  }

  const dateForOffset = (offset: number) => {
    const x = new Date(`${start_date}T12:00:00`);
    x.setDate(x.getDate() + offset);
    return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(x);
  };

  // Insertar rutas una a una con fallback progresivo si alguna columna no existe
  for (let i = 0; i < DEMO_ROUTES.length; i++) {
    const r = DEMO_ROUTES[i]!;
    const routeDate = dateForOffset(r.day_offset);
    const originId = r.origin_activity_title ? activityIdByTitle.get(r.origin_activity_title) : undefined;
    const destId = r.destination_activity_title ? activityIdByTitle.get(r.destination_activity_title) : undefined;
    const waypointIds = (r.waypoint_activity_titles ?? [])
      .map((t) => activityIdByTitle.get(t))
      .filter((id): id is string => Boolean(id));
    const originCoords = r.origin_activity_title ? activityCoordsByTitle.get(r.origin_activity_title) : undefined;
    const destCoords = r.destination_activity_title ? activityCoordsByTitle.get(r.destination_activity_title) : undefined;

    const pathPoints: Array<{ lat: number; lng: number }> = [];
    if (originCoords) pathPoints.push(originCoords);
    for (const waypointTitle of (r.waypoint_activity_titles ?? [])) {
      const c = activityCoordsByTitle.get(waypointTitle);
      if (c) pathPoints.push(c);
    }
    if (destCoords) pathPoints.push(destCoords);

    // Intento 1: con todas las columnas enriquecidas
    const fullPayload = {
      trip_id: tripId,
      route_date: routeDate,
      route_day: routeDate,
      day_date: routeDate,
      title: r.title,
      route_name: r.title,
      travel_mode: r.travel_mode,
      origin_name: r.origin_name,
      destination_name: r.destination_name,
      distance_text: r.distance_text,
      duration_text: r.duration_text,
      ...(originCoords ? { origin_latitude: originCoords.lat, origin_longitude: originCoords.lng } : {}),
      ...(destCoords ? { destination_latitude: destCoords.lat, destination_longitude: destCoords.lng } : {}),
      ...(pathPoints.length >= 2 ? { path_points: pathPoints, route_points: pathPoints } : {}),
      ...(originId ? { origin_activity_id: originId } : {}),
      ...(destId ? { destination_activity_id: destId } : {}),
      ...(waypointIds.length ? { waypoint_ids: waypointIds } : {}),
    };

    const { error: err1 } = await admin.from("trip_routes").insert(fullPayload);
    if (!err1) continue;

    // Intento 2: sin columnas avanzadas (solo las básicas que siempre existen)
    const basicPayload = {
      trip_id: tripId,
      route_date: routeDate,
      route_day: routeDate,
      day_date: routeDate,
      title: r.title,
      route_name: r.title,
      travel_mode: r.travel_mode,
      origin_name: r.origin_name,
      destination_name: r.destination_name,
      distance_text: r.distance_text,
      duration_text: r.duration_text,
    };
    await admin.from("trip_routes").insert(basicPayload);
  }

  // Listas en la sección Docs
  for (const listSeed of DEMO_LISTS) {
    const { data: listRow, error: listErr } = await admin
      .from("trip_lists")
      .insert({
        trip_id: tripId,
        title: listSeed.title,
        visibility: listSeed.visibility,
        editable_by_all: listSeed.editable_by_all,
        owner_user_id: user.id,
      })
      .select("id")
      .single();

    if (listErr || !listRow) continue;
    const listId = String((listRow as { id: string }).id);

    if (listSeed.items.length) {
      await admin.from("trip_list_items").insert(
        listSeed.items.map((item, pos) => ({
          trip_id: tripId,
          list_id: listId,
          text: item.text,
          note: item.note ?? null,
          is_done: item.is_done ?? false,
          position: pos,
          created_by_user_id: user.id,
        }))
      );
    }
  }

  // Conversaciones IA de demostración
  for (const chatSeed of DEMO_CHATS) {
    const { data: convRow } = await admin
      .from("trip_ai_conversations")
      .insert({
        trip_id: tripId,
        mode: chatSeed.mode,
        title: chatSeed.title,
      })
      .select("id")
      .single();

    if (!convRow) continue;
    const convId = String((convRow as { id: string }).id);

    if (chatSeed.messages.length) {
      await admin.from("trip_ai_messages").insert(
        chatSeed.messages.map((msg) => ({
          conversation_id: convId,
          trip_id: tripId,
          role: msg.role,
          content: msg.content,
        }))
      );
    }
  }

  const profilePatch: Record<string, unknown> = {
    demo_trip_id: tripId,
    updated_at: new Date().toISOString(),
  };

  const { error: profileErr } = await admin.from("profiles").update(profilePatch).eq("id", user.id);
  if (profileErr) {
    const msg = profileErr.message.toLowerCase();
    if (!msg.includes("demo_trip_id") && !msg.includes("column")) throw profileErr;
  }

  return {
    tripId,
    created: true,
    profile: {
      demo_trip_id: tripId,
      demo_onboarding_completed_at: null,
      demo_onboarding_skipped_at: null,
    },
  };
}

/**
 * Quita de «Mis viajes» los demos antiguos (p. ej. USA) dejando solo el demo Londres actual.
 */
export async function detachLegacyDemoTripsForUser(
  userId: string,
  keepDemoTripId: string | null
): Promise<void> {
  const admin = createSupabaseAdmin();

  const { data: participantRows } = await admin
    .from("trip_participants")
    .select("id, trip_id, joined_via")
    .eq("user_id", userId)
    .neq("status", "removed");

  const tripIds = [
    ...new Set((participantRows ?? []).map((r) => String((r as { trip_id?: string }).trip_id || "")).filter(Boolean)),
  ];
  if (!tripIds.length) return;

  const { data: tripRows } = await admin
    .from("trips")
    .select("id, name, destination, is_demo")
    .in("id", tripIds);

  const tripMap = new Map(
    ((tripRows ?? []) as TripDemoFields[]).map((t) => [String(t.id), t])
  );

  for (const row of participantRows ?? []) {
    const participantId = String((row as { id?: string }).id || "");
    const tripId = String((row as { trip_id?: string }).trip_id || "");
    if (!participantId || !tripId) continue;

    const trip = tripMap.get(tripId);
    if (!trip) continue;
    if (isCurrentLondonDemoTrip(trip)) continue;

    const joinedViaDemo = String((row as { joined_via?: string }).joined_via || "").toLowerCase() === "demo";
    if (!isDemoTripForListing(trip, { demoTripId: keepDemoTripId, joinedViaDemo })) continue;

    await admin
      .from("trip_participants")
      .update({ status: "removed", updated_at: new Date().toISOString() })
      .eq("id", participantId);
  }

  const profile = await readDemoOnboardingProfile(userId);
  const linkedId = profile?.demo_trip_id ?? null;
  if (!linkedId) return;

  const { data: linkedTrip } = await admin
    .from("trips")
    .select("id, name, destination, is_demo")
    .eq("id", linkedId)
    .maybeSingle();

  if (
    linkedTrip &&
    isDemoTripForListing(linkedTrip as TripDemoFields) &&
    !isCurrentLondonDemoTrip(linkedTrip as TripDemoFields)
  ) {
    await admin.from("trips").delete().eq("id", linkedId);
    await admin
      .from("profiles")
      .update({ demo_trip_id: null, updated_at: new Date().toISOString() })
      .eq("id", userId);
  }
}

export async function resetDemoTripForUser(user: import("@supabase/supabase-js").User): Promise<{ tripId: string }> {
  const admin = createSupabaseAdmin();

  // Borrar el viaje demo anterior (cascada a actividades, gastos, rutas, listas…)
  const existing = await readDemoOnboardingProfile(user.id);
  if (existing?.demo_trip_id) {
    await admin.from("trips").delete().eq("id", existing.demo_trip_id);
  }

  // Limpiar el perfil para forzar recreación
  await admin.from("profiles").update({
    demo_trip_id: null,
    demo_onboarding_completed_at: null,
    demo_onboarding_skipped_at: null,
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);

  // Crear el nuevo demo con los datos actualizados
  const result = await ensureDemoTripForUser(user);
  return { tripId: result.tripId };
}

export async function markDemoOnboardingSkipped(userId: string): Promise<void> {
  const admin = createSupabaseAdmin();
  const patch = { demo_onboarding_skipped_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const { error } = await admin.from("profiles").update(patch).eq("id", userId);
  if (error) {
    const msg = error.message.toLowerCase();
    if (!msg.includes("column")) throw error;
  }
}

export async function markDemoOnboardingCompleted(userId: string): Promise<void> {
  const admin = createSupabaseAdmin();
  const patch = { demo_onboarding_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const { error } = await admin.from("profiles").update(patch).eq("id", userId);
  if (error) {
    const msg = error.message.toLowerCase();
    if (!msg.includes("column")) throw error;
  }
}

export async function isTripDemo(tripId: string): Promise<boolean> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("trips")
    .select("id, name, destination, is_demo")
    .eq("id", tripId)
    .maybeSingle();
  if (!data) return false;
  const profile = await admin.from("profiles").select("demo_trip_id").eq("demo_trip_id", tripId).limit(1);
  return isDemoTripForListing(data as TripDemoFields, {
    demoTripId: (profile.data?.[0] as { demo_trip_id?: string } | undefined)?.demo_trip_id ?? tripId,
  });
}
