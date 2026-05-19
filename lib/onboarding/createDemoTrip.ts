import type { User } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  DEMO_TRIP_BASE_CURRENCY,
  DEMO_TRIP_DESTINATION,
  DEMO_TRIP_NAME,
  DEMO_GHOST_PARTICIPANTS,
  buildDemoActivities,
  buildDemoExpenses,
  demoTripDateRange,
  DEMO_ROUTE_SEED,
  DEMO_ROUTE_SEED_2,
  DEMO_ROUTE_SEED_3,
} from "@/lib/onboarding/demo-trip-seed";

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

export async function ensureDemoTripForUser(user: User): Promise<{
  tripId: string;
  created: boolean;
  profile: DemoOnboardingProfile;
}> {
  const admin = createSupabaseAdmin();
  const existing = await readDemoOnboardingProfile(user.id);

  if (existing?.demo_trip_id) {
    const { data: trip } = await admin.from("trips").select("id, is_demo").eq("id", existing.demo_trip_id).maybeSingle();
    if (trip?.id) {
      return {
        tripId: String(trip.id),
        created: false,
        profile: existing,
      };
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
  if (activities.length) {
    await admin.from("trip_activities").insert(
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
    );
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

  await admin.from("trip_routes").insert([
    {
      trip_id: tripId,
      route_date: start_date,
      route_day: start_date,
      day_date: start_date,
      sort_order: 0,
      title: DEMO_ROUTE_SEED.title,
      route_name: DEMO_ROUTE_SEED.title,
      travel_mode: DEMO_ROUTE_SEED.travel_mode,
      origin_name: DEMO_ROUTE_SEED.origin_name,
      destination_name: DEMO_ROUTE_SEED.destination_name,
      distance_text: DEMO_ROUTE_SEED.distance_text,
      duration_text: DEMO_ROUTE_SEED.duration_text,
    },
    {
      trip_id: tripId,
      route_date: start_date,
      route_day: start_date,
      day_date: start_date,
      sort_order: 1,
      title: DEMO_ROUTE_SEED_2.title,
      route_name: DEMO_ROUTE_SEED_2.title,
      travel_mode: DEMO_ROUTE_SEED_2.travel_mode,
      origin_name: DEMO_ROUTE_SEED_2.origin_name,
      destination_name: DEMO_ROUTE_SEED_2.destination_name,
      distance_text: DEMO_ROUTE_SEED_2.distance_text,
      duration_text: DEMO_ROUTE_SEED_2.duration_text,
    },
    {
      trip_id: tripId,
      route_date: start_date,
      route_day: start_date,
      day_date: start_date,
      sort_order: 2,
      title: DEMO_ROUTE_SEED_3.title,
      route_name: DEMO_ROUTE_SEED_3.title,
      travel_mode: DEMO_ROUTE_SEED_3.travel_mode,
      origin_name: DEMO_ROUTE_SEED_3.origin_name,
      destination_name: DEMO_ROUTE_SEED_3.destination_name,
      distance_text: DEMO_ROUTE_SEED_3.distance_text,
      duration_text: DEMO_ROUTE_SEED_3.duration_text,
    },
  ]);

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
  const { data } = await admin.from("trips").select("is_demo").eq("id", tripId).maybeSingle();
  if (data && typeof (data as { is_demo?: boolean }).is_demo === "boolean") {
    return Boolean((data as { is_demo: boolean }).is_demo);
  }
  const profile = await admin.from("profiles").select("demo_trip_id").eq("demo_trip_id", tripId).limit(1);
  return (profile.data?.length ?? 0) > 0;
}
