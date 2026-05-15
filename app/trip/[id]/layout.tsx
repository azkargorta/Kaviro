import type { ReactNode } from "react";
import { requireTripAccess } from "@/lib/trip-access";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import TripBoardBrandRail from "@/components/layout/TripBoardBrandRail";
import { createClient } from "@/lib/supabase/server";
import { TripBoardHeaderProvider } from "@/components/layout/TripBoardHeaderContext";
import { isPremiumEnabledForTrip } from "@/lib/entitlements";
import DesktopTripSidebar from "@/components/layout/DesktopTripSidebar";
import TripPageAssistantDock from "@/components/trip/ai/TripPageAssistantDock";
import CommandPalette from "@/components/layout/CommandPalette";
import { formatTripDateRangeHeader } from "@/lib/format-trip-date-range";
import { TripDemoProvider } from "@/components/trip/TripDemoContext";
import DemoTripBanner from "@/components/trip/DemoTripBanner";

type TripLayoutProps = {
  children: ReactNode;
  params: {
    id: string;
  };
};

export default async function TripLayout({ children, params }: TripLayoutProps) {
  const access = await requireTripAccess(params.id);

  const supabase = await createClient();
  const [{ data: tripMeta }, { data: profileRow }] = await Promise.all([
    supabase.from("trips").select("name, start_date, end_date, is_demo").eq("id", params.id).maybeSingle(),
    supabase.from("profiles").select("demo_trip_id").eq("id", access.userId).maybeSingle(),
  ]);
  const isDemo =
    Boolean((tripMeta as { is_demo?: boolean } | null)?.is_demo) ||
    String((profileRow as { demo_trip_id?: string } | null)?.demo_trip_id || "") === params.id;
  const tripName = (tripMeta?.name && String(tripMeta.name).trim()) || "Viaje";
  const dateRangeLabel = formatTripDateRangeHeader(
    tripMeta?.start_date ? String(tripMeta.start_date) : null,
    tripMeta?.end_date ? String(tripMeta.end_date) : null
  );
  const isPremium = await isPremiumEnabledForTrip({ supabase, userId: access.userId, tripId: params.id });

  return (
    <TripBoardHeaderProvider>
      <TripDemoProvider isDemo={isDemo}>
        <TripBoardBrandRail tripId={params.id} tripName={tripName} dateRangeLabel={dateRangeLabel} />
        <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          <div className="page-shell !pt-4 !pb-6 md:!pt-5 md:!pb-10">
            <div className="min-w-0 md:grid md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr] md:gap-4">
              <DesktopTripSidebar
                tripId={params.id}
                isPremium={isPremium}
                startDate={tripMeta?.start_date ?? null}
                endDate={tripMeta?.end_date ?? null}
              />
              <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden md:space-y-10">
                {isDemo ? <DemoTripBanner /> : null}
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
