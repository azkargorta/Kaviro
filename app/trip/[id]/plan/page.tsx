import { createClient } from "@/lib/supabase/server";
import { requireTripAccess } from "@/lib/trip-access";
import TripPlanView from "@/components/trip/plan/TripPlanView";
import TripScreenActions from "@/components/trip/common/TripScreenActions";
import TripBoardPageHeader from "@/components/layout/TripBoardPageHeader";
import { isPremiumEnabledForTrip } from "@/lib/entitlements";
import { canEditTripNotesFromAccess } from "@/lib/trip-module-access";

export default async function TripPlanPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const access = await requireTripAccess(params.id);
  const supabase = await createClient();
  const isPremium = await isPremiumEnabledForTrip({ supabase, userId: access.userId, tripId: params.id });
  const rawExplore = searchParams?.explore;
  const explore = typeof rawExplore === "string" ? rawExplore : Array.isArray(rawExplore) ? String(rawExplore[0] || "") : "";
  const initialExploreOpen = explore.trim() === "1" || explore.trim().toLowerCase() === "true";

  const rawTab = searchParams?.tab;
  const tabParam =
    typeof rawTab === "string" ? rawTab.trim().toLowerCase() : Array.isArray(rawTab) ? String(rawTab[0] || "").trim().toLowerCase() : "";
  const initialWorkspaceTab = tabParam === "notas" || tabParam === "notes" ? "notes" : "itinerary";

  const rawDate = searchParams?.date;
  const dateParam =
    typeof rawDate === "string"
      ? rawDate.trim()
      : Array.isArray(rawDate)
        ? String(rawDate[0] || "").trim()
        : "";
  const initialSelectedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : null;

  const [{ data: tripNoteRow }, { data: profileRow }] = await Promise.all([
    supabase.from("trips").select("description").eq("id", params.id).maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", access.userId).maybeSingle(),
  ]);
  const rawDesc = (tripNoteRow as { description?: string | null } | null)?.description;
  const tripDescription = typeof rawDesc === "string" ? rawDesc : null;
  const currentDisplayName =
    (profileRow as { display_name?: string | null } | null)?.display_name?.trim() || "Yo";

  const canEditTripNotes = canEditTripNotesFromAccess(access);

  return (
    <main className="space-y-8">
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
      />
    </main>
  );
}
