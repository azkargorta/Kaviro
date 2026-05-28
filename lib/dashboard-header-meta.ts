import type { SupabaseClient } from "@supabase/supabase-js";
import { isDemoTripForListing } from "@/lib/onboarding/is-demo-trip";

type TripRow = {
  id: string;
  name: string | null;
  destination: string | null;
  is_demo?: boolean | null;
};

type ParticipantRow = {
  trip_id: string;
  joined_via?: string | null;
};

export async function getDashboardHeaderMeta(
  supabase: SupabaseClient,
  userId: string
): Promise<{ tripCount: number; isPremium: boolean }> {
  const [{ data: profileRow }, { data: participantRows }] = await Promise.all([
    supabase.from("profiles").select("is_premium, demo_trip_id").eq("id", userId).maybeSingle(),
    supabase.from("trip_participants").select("trip_id, joined_via").eq("user_id", userId),
  ]);

  const isPremium = Boolean((profileRow as { is_premium?: boolean } | null)?.is_premium);
  const demoTripId = (profileRow as { demo_trip_id?: string | null } | null)?.demo_trip_id ?? null;

  const participants = (participantRows ?? []) as ParticipantRow[];
  const tripIds = participants.map((r) => r.trip_id).filter(Boolean);

  if (tripIds.length === 0) {
    return { tripCount: 0, isPremium };
  }

  const joinedViaDemoMap = new Map(
    participants.map((row) => {
      const via = String(row.joined_via || "").toLowerCase();
      return [row.trip_id, via === "demo" || via === "stripes"];
    })
  );

  const { data: tripsData } = await supabase
    .from("trips")
    .select("id, name, destination, is_demo")
    .in("id", tripIds);

  const trips = (tripsData ?? []) as TripRow[];
  const demoIds = new Set(
    trips
      .filter((t) =>
        isDemoTripForListing(t, {
          demoTripId,
          joinedViaDemo: joinedViaDemoMap.get(t.id) ?? false,
        })
      )
      .map((t) => t.id)
  );

  const tripCount = trips.filter((t) => !demoIds.has(t.id)).length;
  return { tripCount, isPremium };
}
