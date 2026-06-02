import { createClient } from "@/lib/supabase/server";
import { getCachedTripAccess } from "@/lib/trip-access";
import TripPlanView from "@/components/trip/plan/TripPlanView";
import TripScreenActions from "@/components/trip/common/TripScreenActions";
import TripBoardPageHeader from "@/components/layout/TripBoardPageHeader";
import { getCachedTripPremium } from "@/lib/entitlements";
import { canEditTripNotesFromAccess } from "@/lib/trip-module-access";
import type { TripActivitiesInitial } from "@/hooks/useTripActivities";
import {
  attachInvitedParticipantIds,
  filterActivitiesForViewer,
} from "@/lib/activity-invite-scope";
import { loadActivityInviteesForTrip } from "@/lib/activity-invitees-api";
import type { PlanTripParticipant } from "@/lib/plan-trip-participants";

export default async function TripPlanPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const access = await getCachedTripAccess(params.id);
  const supabase = await createClient();
  const isPremium = await getCachedTripPremium(params.id, access.userId);
  const rawExplore = searchParams?.explore;
  const explore = typeof rawExplore === "string" ? rawExplore : Array.isArray(rawExplore) ? String(rawExplore[0] || "") : "";
  const initialExploreOpen = explore.trim() === "1" || explore.trim().toLowerCase() === "true";

  const rawTab = searchParams?.tab;
  const tabParam =
    typeof rawTab === "string" ? rawTab.trim().toLowerCase() : Array.isArray(rawTab) ? String(rawTab[0] || "").trim().toLowerCase() : "";
  const initialWorkspaceTab =
    tabParam === "notas" || tabParam === "notes"
      ? "notes"
      : tabParam === "asistencia" || tabParam === "attendance"
        ? "attendance"
        : "itinerary";

  const rawDate = searchParams?.date;
  const dateParam =
    typeof rawDate === "string"
      ? rawDate.trim()
      : Array.isArray(rawDate)
        ? String(rawDate[0] || "").trim()
        : "";
  const initialSelectedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : null;

  const [{ data: tripRow }, { data: profileRow }, { data: activityRows }, { data: participantRows }] = await Promise.all([
    supabase.from("trips").select("id, name, destination, start_date, end_date").eq("id", params.id).maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", access.userId).maybeSingle(),
    supabase
      .from("trip_activities")
      .select("*")
      .eq("trip_id", params.id)
      .order("activity_date", { ascending: true })
      .order("activity_time", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("trip_participants")
      .select("id, display_name, user_id")
      .eq("trip_id", params.id)
      .neq("status", "removed")
      .order("created_at", { ascending: true })
      .limit(24),
  ]);

  const rawDesc = (tripRow as { description?: string | null } | null)?.description;
  const tripDescription = typeof rawDesc === "string" ? rawDesc : null;
  const currentDisplayName =
    (profileRow as { display_name?: string | null } | null)?.display_name?.trim() || "Yo";

  const canEditTripNotes = canEditTripNotesFromAccess(access);

  const tripParticipants: PlanTripParticipant[] = [];
  for (const r of participantRows ?? []) {
    const row = r as { id?: string; display_name?: string | null; user_id?: string | null };
    const name = row.display_name?.trim();
    if (!row.id || !name) continue;
    tripParticipants.push({
      id: row.id,
      display_name: name,
      user_id: row.user_id ?? null,
    });
  }

  const participantNames = tripParticipants.map((p) => p.display_name);

  const rawActivities = (activityRows ?? []) as TripActivitiesInitial["activities"];
  const activityIds = rawActivities.map((a) => a.id).filter(Boolean);
  let inviteesMap = new Map<string, string[]>();
  try {
    inviteesMap = await loadActivityInviteesForTrip(supabase, params.id, activityIds);
  } catch {
    inviteesMap = new Map();
  }
  const withInvitees = attachInvitedParticipantIds(rawActivities, inviteesMap);
  const visibleActivities = filterActivitiesForViewer(withInvitees, access, inviteesMap);

  const initialActivities: TripActivitiesInitial = {
    trip: (tripRow as TripActivitiesInitial["trip"]) || null,
    activities: visibleActivities,
    actorName: currentDisplayName,
  };

  return (
    <main className="overflow-x-hidden space-y-8">
      <TripBoardPageHeader
        section="Plan del viaje"
        title="Plan"
        description={"Itinerario por días y notas del viaje en la misma pantalla. Las notas son texto libre para el grupo."}
        iconKey="plan"
        iconAlt="Plan"
        actions={<TripScreenActions tripId={params.id} />}
      />

      <TripPlanView
        tripId={params.id}
        premiumEnabled={isPremium}
        currentUserId={access.userId}
        currentDisplayName={currentDisplayName}
        initialExploreOpen={initialExploreOpen}
        initialTripDescription={tripDescription}
        canEditTripNotes={canEditTripNotes}
        canManagePlan={access.can_manage_plan}
        initialWorkspaceTab={initialWorkspaceTab}
        initialSelectedDate={initialSelectedDate}
        initialActivities={initialActivities}
        participants={participantNames}
        tripParticipants={tripParticipants}
        currentParticipantId={access.participantId}
      />
    </main>
  );
}
