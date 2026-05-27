import type { User } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  STRIPES_TRIP_NAME,
  STRIPES_TRIP_DESTINATION,
  STRIPES_TRIP_BASE_CURRENCY,
  STRIPES_GHOST_PARTICIPANTS,
  STRIPES_ROUTES,
  STRIPES_LISTS,
  buildStripesActivities,
  buildStripesExpenses,
  stripesTripDateRange,
  isStripesTripName,
} from "@/lib/onboarding/stripes-demo-seed";

export type StripesOnboardingProfile = {
  stripes_trip_id: string | null;
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

export async function readStripesOnboardingProfile(userId: string): Promise<StripesOnboardingProfile | null> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("stripes_trip_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("stripes_trip_id") || msg.includes("column")) return null;
    throw error;
  }

  return (data as StripesOnboardingProfile | null) ?? null;
}

async function findStripesTripForUser(userId: string): Promise<string | null> {
  const admin = createSupabaseAdmin();
  const profile = await readStripesOnboardingProfile(userId);
  if (profile?.stripes_trip_id) {
    const { data: trip } = await admin
      .from("trips")
      .select("id")
      .eq("id", profile.stripes_trip_id)
      .maybeSingle();
    if (trip?.id) return String(trip.id);
  }

  const { data: participations } = await admin
    .from("trip_participants")
    .select("trip_id")
    .eq("user_id", userId);

  const tripIds = (participations ?? []).map((p) => (p as { trip_id: string }).trip_id).filter(Boolean);
  if (!tripIds.length) return null;

  const { data: trips } = await admin
    .from("trips")
    .select("id, name")
    .in("id", tripIds)
    .order("created_at", { ascending: false });

  const match = (trips ?? []).find((t) => {
    const name = String((t as { name?: string }).name ?? "");
    return isStripesTripName(name);
  });

  return match ? String((match as { id: string }).id) : null;
}

export async function ensureStripesTripForUser(user: User): Promise<{
  tripId: string;
  created: boolean;
}> {
  const existingId = await findStripesTripForUser(user.id);
  if (existingId) {
    return { tripId: existingId, created: false };
  }

  return createStripesTripForUser(user);
}

export async function createStripesTripForUser(user: User): Promise<{
  tripId: string;
  created: boolean;
}> {
  const admin = createSupabaseAdmin();
  const ownerName = ownerDisplayName(user);
  const { start_date, end_date } = stripesTripDateRange();

  let tripId: string;

  const tripInsert = await admin
    .from("trips")
    .insert({
      name: STRIPES_TRIP_NAME,
      destination: STRIPES_TRIP_DESTINATION,
      start_date,
      end_date,
      base_currency: STRIPES_TRIP_BASE_CURRENCY,
      is_demo: false,
    })
    .select("id")
    .single();

  if (tripInsert.error || !tripInsert.data) {
    throw new Error(tripInsert.error?.message || "No se pudo crear el viaje Stripes.");
  }

  tripId = String((tripInsert.data as { id: string }).id);

  await admin.from("trip_participants").insert({
    trip_id: tripId,
    display_name: ownerName,
    username: user.user_metadata?.username || user.email?.split("@")[0] || null,
    user_id: user.id,
    role: "owner",
    status: "active",
    joined_via: "stripes",
    linked_at: new Date().toISOString(),
    can_manage_trip: true,
    can_manage_participants: true,
    can_manage_expenses: true,
    can_manage_plan: true,
    can_manage_map: true,
    can_manage_resources: true,
  });

  for (const ghost of STRIPES_GHOST_PARTICIPANTS) {
    if (ghost.display_name === ownerName) continue;
    await admin.from("trip_participants").insert({
      trip_id: tripId,
      display_name: ghost.display_name,
      role: ghost.role,
      status: "active",
      joined_via: "stripes",
      user_id: null,
    });
  }

  const activities = buildStripesActivities(start_date);
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
        ...(a.notes != null ? { notes: a.notes } : {}),
        source: "stripes",
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

  const expenses = buildStripesExpenses(start_date);
  const participantNames = [ownerName, ...STRIPES_GHOST_PARTICIPANTS.map((p) => p.display_name).filter((n) => n !== ownerName)];

  if (expenses.length) {
    await admin.from("trip_expenses").insert(
      expenses.map((e) => ({
        trip_id: tripId,
        title: e.description,
        category: e.category,
        amount: e.amount,
        currency: e.currency,
        expense_date: e.date,
        payer_name: e.paid_by_name === ownerName ? ownerName : e.paid_by_name,
        participant_names: participantNames,
        paid_by_names: [e.paid_by_name],
        owed_by_names: participantNames,
      }))
    );
  }

  const dateForOffset = (offset: number) => {
    const x = new Date(`${start_date}T12:00:00`);
    x.setDate(x.getDate() + offset);
    return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(x);
  };

  for (const r of STRIPES_ROUTES) {
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
    for (const waypointTitle of r.waypoint_activity_titles ?? []) {
      const c = activityCoordsByTitle.get(waypointTitle);
      if (c) pathPoints.push(c);
    }
    if (destCoords) pathPoints.push(destCoords);

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

    await admin.from("trip_routes").insert({
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
    });
  }

  for (const listSeed of STRIPES_LISTS) {
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

  const profilePatch = {
    stripes_trip_id: tripId,
    updated_at: new Date().toISOString(),
  };
  const { error: profileErr } = await admin.from("profiles").update(profilePatch).eq("id", user.id);
  if (profileErr) {
    const msg = profileErr.message.toLowerCase();
    if (!msg.includes("stripes_trip_id") && !msg.includes("column")) throw profileErr;
  }

  return { tripId, created: true };
}

export async function getStripesTripSummaryForUser(userId: string): Promise<{
  tripId: string | null;
  hasTrip: boolean;
}> {
  const tripId = await findStripesTripForUser(userId);
  return { tripId, hasTrip: Boolean(tripId) };
}
