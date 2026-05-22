import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { getCachedTripAccess } from "@/lib/trip-access";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import { createClient } from "@/lib/supabase/server";
import { TripBoardHeaderProvider } from "@/components/layout/TripBoardHeaderContext";
import { getCachedTripPremium } from "@/lib/entitlements";
import DesktopTripSidebar from "@/components/layout/DesktopTripSidebar";
import { TripDemoProvider } from "@/components/trip/TripDemoContext";
import DemoTripBanner from "@/components/trip/DemoTripBanner";
import TripHeroCard from "@/components/trip/common/TripHeroCard";
import TripOnboardingChecklist from "@/components/trip/onboarding/TripOnboardingChecklist";
import { fetchTripOnboardingCounts } from "@/lib/trip-onboarding";
import TripOfflineSync from "@/components/pwa/TripOfflineSync";

const TripPageAssistantDock = dynamic(
  () => import("@/components/trip/ai/TripPageAssistantDock"),
  { ssr: false }
);

const CommandPalette = dynamic(() => import("@/components/layout/CommandPalette"), {
  ssr: false,
});

type TripLayoutProps = {
  children: ReactNode;
  params: {
    id: string;
  };
};

export default async function TripLayout({ children, params }: TripLayoutProps) {
  const access = await getCachedTripAccess(params.id);

  const supabase = await createClient();
  const [{ data: tripMeta }, { data: profileRow }, { data: participantRows }, isPremium, onboardingCountsRaw] =
    await Promise.all([
      supabase.from("trips").select("name, start_date, end_date, is_demo, destination").eq("id", params.id).maybeSingle(),
      supabase.from("profiles").select("demo_trip_id").eq("id", access.userId).maybeSingle(),
      supabase
        .from("trip_participants")
        .select("profiles(display_name)")
        .eq("trip_id", params.id)
        .neq("status", "removed")
        .limit(6),
      getCachedTripPremium(params.id, access.userId),
      fetchTripOnboardingCounts(supabase, params.id),
    ]);

  const isDemo =
    Boolean((tripMeta as { is_demo?: boolean } | null)?.is_demo) ||
    String((profileRow as { demo_trip_id?: string } | null)?.demo_trip_id || "") === params.id;
  const tripName = (tripMeta?.name && String(tripMeta.name).trim()) || "Viaje";
  const destination = (tripMeta as { destination?: string } | null)?.destination ?? null;
  const participantNames = (participantRows ?? [])
    .map((r) => {
      const p = (r as { profiles?: { display_name?: string } | null }).profiles;
      return p?.display_name?.trim() || null;
    })
    .filter((n): n is string => Boolean(n));
  const onboardingCounts = isDemo ? null : onboardingCountsRaw;

  return (
    <TripBoardHeaderProvider>
      <TripDemoProvider isDemo={isDemo}>
        <TripOfflineSync tripId={params.id} />
        <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          <div className="page-shell max-md:!pt-0 !pb-6 md:!pt-5 md:!pb-10">
            <div className="mb-4 md:mb-5">
              <TripHeroCard
                tripId={params.id}
                tripName={tripName}
                destination={destination}
                participants={participantNames}
              />
            </div>

            <div className="min-w-0 md:grid md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr] md:gap-4">
              <DesktopTripSidebar
                tripId={params.id}
                isPremium={isPremium}
                startDate={tripMeta?.start_date ?? null}
                endDate={tripMeta?.end_date ?? null}
              />
              <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden md:space-y-10">
                {isDemo ? <DemoTripBanner /> : null}
                {!isDemo && onboardingCounts ? (
                  <TripOnboardingChecklist
                    tripId={params.id}
                    tripName={tripName}
                    isPremium={isPremium}
                    counts={onboardingCounts}
                  />
                ) : null}
                {children}
              </div>
            </div>
          </div>
        </div>
        <MobileBottomNav tripId={params.id} isPremium={isPremium} />
        <TripPageAssistantDock tripId={params.id} isPremium={isPremium} />
        <CommandPalette tripId={params.id} />
      </TripDemoProvider>
    </TripBoardHeaderProvider>
  );
}
