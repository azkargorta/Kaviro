import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateTripSection from "@/components/dashboard/CreateTripSection";
import OnboardingNudge from "@/components/dashboard/OnboardingNudge";
import DashboardAiShortcuts from "@/components/dashboard/DashboardAiShortcuts";
import DashboardCreateFlowStepper from "@/components/dashboard/DashboardCreateFlowStepper";
import { surfaceAccentCyan } from "@/components/ui/brandStyles";
import { Sparkles } from "lucide-react";
import DashboardDemoTripSection from "@/components/dashboard/DashboardDemoTripSection";
import DashboardTripInvitesInbox from "@/components/dashboard/DashboardTripInvitesInbox";
import DashboardContinueTrip from "@/components/dashboard/DashboardContinueTrip";
import DashboardTripsClient from "@/components/dashboard/DashboardTripsClient";
import DashboardAgencyEntry from "@/components/dashboard/DashboardAgencyEntry";
import PushNotificationPrompt from "@/components/pwa/PushNotificationPrompt";
import DashboardOfflineRegistry, {
  DashboardOfflinePanel,
} from "@/components/dashboard/DashboardOfflineRegistry";
import {
  detachLegacyDemoTripsForUser,
  ensureDemoTripForUser,
  isFirstDemoOnboardingVisit,
} from "@/lib/onboarding/createDemoTrip";
import { isDemoTripForListing } from "@/lib/onboarding/is-demo-trip";
import { FREE_TRIP_LIMIT, freePlanBanner } from "@/lib/premium-copy";
import { userHasAgencyWorkspace } from "@/lib/agency-default-route";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { countUnreadAnnouncementsByTrip } from "@/lib/dashboard-announcement-unread";
import {
  DASHBOARD_TRIP_BADGE_ACCENTS,
  type DashboardTripBadgeAccent,
  isExpenseGroupTrip,
  splitDashboardTrips,
  type DashboardTrip,
} from "@/lib/dashboard-trip-types";
import { canShowExpensesGroupCreation } from "@/lib/expenses-group-rollout";
import { isMissingColumnError } from "@/lib/expenses-group-rollout";

type Trip = DashboardTrip & {
  is_demo?: boolean | null;
};

type DashboardPageProps = {
  searchParams?: { personal?: string };
};

type TripParticipantRow = {
  trip_id: string;
  is_favorite?: boolean;
  joined_via?: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function categorizeTrips(trips: DashboardTrip[]) {
  const today = new Date().toISOString().slice(0, 10);

  const current: DashboardTrip[] = [];
  const future: DashboardTrip[] = [];
  const past: DashboardTrip[] = [];
  const unscheduled: DashboardTrip[] = [];

  for (const trip of trips) {
    const start = trip.start_date;
    const end = trip.end_date;

    if (!start && !end) {
      unscheduled.push(trip);
      continue;
    }

    if (start && end && start <= today && today <= end) {
      current.push(trip);
      continue;
    }

    if (start && start > today) {
      future.push(trip);
      continue;
    }

    if (end && end < today) {
      past.push(trip);
      continue;
    }

    if (start && !end && start > today) {
      future.push(trip);
      continue;
    }

    if (start && !end && start <= today) {
      current.push(trip);
      continue;
    }

    past.push(trip);
  }

  return { current, future, past, unscheduled };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const personalMode = searchParams?.personal === "1";
  if (!personalMode && (await userHasAgencyWorkspace(supabase, user.id))) {
    redirect("/agency");
  }

  const [{ data: profileRow }, { data: participantRows, error: participantsError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("is_premium, demo_trip_id, demo_onboarding_completed_at, demo_onboarding_skipped_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("trip_participants")
      .select("trip_id, is_favorite, joined_via")
      .eq("user_id", user.id)
      .neq("status", "removed"),
  ]);

  const existingDemoProfile = profileRow
    ? {
        demo_trip_id: (profileRow as { demo_trip_id?: string | null }).demo_trip_id ?? null,
        demo_onboarding_completed_at:
          (profileRow as { demo_onboarding_completed_at?: string | null }).demo_onboarding_completed_at ?? null,
        demo_onboarding_skipped_at:
          (profileRow as { demo_onboarding_skipped_at?: string | null }).demo_onboarding_skipped_at ?? null,
      }
    : null;

  let demoTripId: string | null = null;
  let isFirstOnboardingVisit = true;

  try {
    await detachLegacyDemoTripsForUser(user.id, existingDemoProfile?.demo_trip_id ?? null);
  } catch (legacyErr) {
    console.error("No se pudieron retirar demos antiguos del listado:", legacyErr);
  }

  if (existingDemoProfile?.demo_trip_id) {
    demoTripId = existingDemoProfile.demo_trip_id;
    isFirstOnboardingVisit = isFirstDemoOnboardingVisit(existingDemoProfile);
  } else {
    try {
      const ensured = await ensureDemoTripForUser(user);
      demoTripId = ensured.tripId;
      isFirstOnboardingVisit = isFirstDemoOnboardingVisit(ensured.profile);
    } catch (demoErr) {
      console.error("No se pudo preparar el viaje demo:", demoErr);
    }
  }

  const isPremium = Boolean((profileRow as { is_premium?: boolean } | null)?.is_premium);

  if (participantsError) {
    console.error("Error cargando participaciones del usuario:", participantsError);
  }

  const participantData = (participantRows ?? []) as TripParticipantRow[];
  const favoriteMap = new Map<string, boolean>(
    participantData.map((row) => [row.trip_id, row.is_favorite ?? false])
  );
  const joinedViaDemoMap = new Map<string, boolean>(
    participantData.map((row) => {
      const via = String(row.joined_via || "").toLowerCase();
      return [row.trip_id, via === "demo" || via === "stripes"];
    })
  );
  const tripIds = participantData.map((row) => row.trip_id).filter(Boolean);

  let trips: Trip[] = [];

  if (tripIds.length > 0) {
    const tripSelect =
      "id, name, destination, start_date, end_date, base_currency, created_at, is_demo, agency_id, trip_mode";
    let tripsData: Trip[] | null = null;
    const withMode = await supabase
      .from("trips")
      .select(tripSelect)
      .in("id", tripIds)
      .order("created_at", { ascending: false });

    if (withMode.error && isMissingColumnError(withMode.error.message, "trip_mode")) {
      const fallback = await supabase
        .from("trips")
        .select("id, name, destination, start_date, end_date, base_currency, created_at, is_demo, agency_id")
        .in("id", tripIds)
        .order("created_at", { ascending: false });
      if (fallback.error) {
        console.error("Error cargando viajes del usuario:", fallback.error);
      } else {
        tripsData = ((fallback.data ?? []) as Trip[]).map((t) => ({ ...t, trip_mode: "travel" as const }));
      }
    } else if (withMode.error) {
      console.error("Error cargando viajes del usuario:", withMode.error);
    } else {
      tripsData = (withMode.data ?? []) as Trip[];
    }

    if (tripsData) {
      trips = tripsData.map((t) => ({
        ...t,
        is_favorite: favoriteMap.get(t.id) ?? false,
      }));
    }
  }

  const demoTrips = trips.filter((t) =>
    isDemoTripForListing(t, {
      demoTripId,
      joinedViaDemo: joinedViaDemoMap.get(t.id) ?? false,
    })
  );
  const realTrips = trips.filter((t) => !demoTrips.some((d) => d.id === t.id));

  const { expenseGroups, travelTrips } = splitDashboardTrips(realTrips);
  const { current, future, past, unscheduled } = categorizeTrips(travelTrips);
  const showExpenseGroupsSection = canShowExpensesGroupCreation();
  const lockedTripIds = new Set<string>();
  const freeTripLimitReached = !isPremium && realTrips.length >= FREE_TRIP_LIMIT;

  const currentIds = new Set(current.map((t) => t.id));
  const futureIds = new Set(future.map((t) => t.id));
  const pastIds = new Set(past.map((t) => t.id));

  const favoriteTrips = realTrips
    .filter((t) => t.is_favorite)
    .map((t) => {
      if (isExpenseGroupTrip(t)) {
        return {
          ...t,
          badge: "Grupo de gastos",
          accent: DASHBOARD_TRIP_BADGE_ACCENTS.expenseGroup,
          is_favorite: true as const,
        };
      }
      let badge = "Pendiente";
      let accent: DashboardTripBadgeAccent = DASHBOARD_TRIP_BADGE_ACCENTS.unscheduled;
      if (currentIds.has(t.id)) {
        badge = "En curso";
        accent = DASHBOARD_TRIP_BADGE_ACCENTS.current;
      } else if (futureIds.has(t.id)) {
        badge = "Próximo";
        accent = DASHBOARD_TRIP_BADGE_ACCENTS.future;
      } else if (pastIds.has(t.id)) {
        badge = "Finalizado";
        accent = DASHBOARD_TRIP_BADGE_ACCENTS.past;
      }
      return { ...t, badge, accent, is_favorite: true as const };
    });

  // For onboarding checklist — check if user has invited someone or added an expense
  let hasParticipants = false;
  let hasExpenses = false;
  const realTripIds = realTrips.map((t) => t.id);
  if (realTripIds.length > 0) {
    const [{ count: partCount }, { count: expCount }] = await Promise.all([
      supabase.from("trip_participants").select("*", { count: "exact", head: true })
        .in("trip_id", realTripIds).neq("user_id", user.id),
      supabase.from("trip_expenses").select("*", { count: "exact", head: true })
        .in("trip_id", realTripIds),
    ]);
    hasParticipants = (partCount ?? 0) > 0;
    hasExpenses = (expCount ?? 0) > 0;
  }

  const allRealTrips = [...current, ...future, ...past, ...unscheduled];

  const admin = createSupabaseAdmin();
  const { data: unreadAnnouncementRows } = await admin
    .from("user_notifications")
    .select("url")
    .eq("user_id", user.id)
    .eq("type", "trip_announcement")
    .is("read_at", null);

  const announcementUnreadByTripId = countUnreadAnnouncementsByTrip(unreadAnnouncementRows);

  return (
    <main className="page-shell page-shell--fluid space-y-4 pb-8 md:space-y-5 md:pb-10">
      <DashboardOfflineRegistry
        trips={allRealTrips.map((t) => ({
          id: t.id,
          name: t.name,
          destination: t.destination,
          start_date: t.start_date,
          end_date: t.end_date,
        }))}
      />
      <DashboardOfflinePanel />

      <div className="mx-auto max-w-2xl px-4">
        <DashboardAgencyEntry />
      </div>

      <DashboardTripInvitesInbox />

      {realTrips.length > 0 ? (
        <div className="mx-auto max-w-2xl px-4">
          <DashboardContinueTrip trips={allRealTrips} />
        </div>
      ) : null}

      <div className="mx-auto max-w-2xl px-4">
        <PushNotificationPrompt />
      </div>

      {isFirstOnboardingVisit ? (
        <>
          <OnboardingNudge
            hasTrips={realTrips.length > 0}
            hasParticipants={hasParticipants}
            hasExpenses={hasExpenses}
            demoTripId={demoTripId}
          />
          <DashboardDemoTripSection trips={demoTrips} />
        </>
      ) : (
        <>
          <DashboardDemoTripSection trips={demoTrips} />
          <OnboardingNudge
            hasTrips={realTrips.length > 0}
            hasParticipants={hasParticipants}
            hasExpenses={hasExpenses}
            demoTripId={demoTripId}
          />
        </>
      )}

      <section
        className={`mx-auto max-w-2xl px-4 py-4 md:px-5 md:py-5 ${surfaceAccentCyan} dark:border-slate-700/50 dark:bg-slate-950/40`}
      >
        <DashboardCreateFlowStepper isPremium={isPremium} canCreate={!freeTripLimitReached} />

        <div className="mx-auto mt-4 max-w-2xl border-t border-slate-100 pt-4 md:mt-5 md:pt-5 dark:border-slate-700/50">
          {isPremium ? (
            <>
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand)] dark:text-[#F87171]">
                Asistente personal
              </p>
              <p className="mx-auto mt-1 max-w-lg text-center text-xs text-slate-600 md:text-sm dark:text-slate-300">
                Tras crear el viaje, el asistente te guía con propuestas. También puedes abrirlo en cualquier viaje desde
                la pestaña del mismo nombre.
              </p>
              <div className="mt-4 flex justify-center">
                <Link
                  href="/trips/new/planner"
                  className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-light)] px-3 py-2 text-center text-xs font-semibold text-[var(--brand-text)] shadow-sm transition hover:bg-[var(--brand-light)] disabled:opacity-60 sm:w-auto sm:min-w-[320px] sm:text-sm"
                  title="Genera un borrador con lugares reales y coordenadas"
                >
                  <Sparkles className="h-4 w-4 text-[var(--brand)]" aria-hidden />
                  Planificador IA (borrador)
                </Link>
              </div>
              <DashboardAiShortcuts trips={realTrips} isPremium />
            </>
          ) : (
            <>
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                Plan gratuito
              </p>
              <p className="mx-auto mt-1 max-w-lg text-center text-xs text-slate-600 md:text-sm dark:text-slate-300">
                Sigue los 6 pasos del recuadro superior. Al pulsar <strong className="text-slate-800">Crear viaje</strong> y abrir el
                formulario verás una guía detallada en el mismo orden.
              </p>
              <div className="mt-4 flex justify-center">
                <Link
                  href="/account?upgrade=premium&focus=premium#premium-plans"
                  className="group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100/60 px-3 py-2.5 text-center text-xs font-semibold text-amber-950 shadow-sm ring-1 ring-slate-900/[0.02] transition hover:border-amber-300 hover:shadow-md active:translate-y-[0.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 sm:w-auto sm:min-w-[260px] sm:text-sm"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm ring-1 ring-white/20">
                    <Sparkles className="h-4 w-4" aria-hidden />
                  </span>
                  <span>Asistente personal y más con Premium</span>
                </Link>
              </div>
            </>
          )}
        </div>

        <div
          id="create-trip"
          className="mx-auto mt-4 max-w-2xl scroll-mt-20 border-t border-slate-100 pt-4 md:mt-5 md:pt-5 dark:border-slate-700/50"
        >
          <CreateTripSection isPremium={isPremium} tripCount={realTrips.length} />
        </div>
      </section>

      {!isPremium ? (
        <section className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-700 md:text-sm dark:border-slate-700/50 dark:bg-slate-950/40 dark:text-slate-200">
          {freePlanBanner()}
        </section>
      ) : null}

      {realTrips.length > 0 ? (
        <DashboardTripsClient
          current={current}
          future={future}
          past={past}
          unscheduled={unscheduled}
          expenseGroups={expenseGroups}
          showExpenseGroupsSection={showExpenseGroupsSection}
          favoriteTrips={favoriteTrips}
          lockedTripIds={Array.from(lockedTripIds)}
          announcementUnreadByTripId={announcementUnreadByTripId}
        />
      ) : null}
    </main>
  );
}
