import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingNudge from "@/components/dashboard/OnboardingNudge";
import DashboardDemoTripSection from "@/components/dashboard/DashboardDemoTripSection";
import DashboardTripInvitesInbox from "@/components/dashboard/DashboardTripInvitesInbox";
import DashboardContinueTrip from "@/components/dashboard/DashboardContinueTrip";
import DashboardTripsClient from "@/components/dashboard/DashboardTripsClient";
import DashboardCreateTripOverlay from "@/components/dashboard/DashboardCreateTripOverlay";
import DashboardAgencyEntry from "@/components/dashboard/DashboardAgencyEntry";
import PushNotificationPrompt from "@/components/pwa/PushNotificationPrompt";
import DashboardOfflineRegistry, {
  DashboardOfflinePanel,
} from "@/components/dashboard/DashboardOfflineRegistry";
import { pickContinueTrip } from "@/lib/trip-active";
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

  const heroTrip = pickContinueTrip(allRealTrips);
  const hasTrips = realTrips.length > 0;

  return (
    <main className="page-shell page-shell--fluid space-y-6 pb-8 md:space-y-8 md:pb-10">
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
      <DashboardCreateTripOverlay isPremium={isPremium} tripCount={realTrips.length} />

      <DashboardTripInvitesInbox />

      {hasTrips ? <DashboardContinueTrip trips={allRealTrips} /> : null}

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
        heroTripId={hasTrips ? heroTrip?.id ?? null : null}
      />

      <div className="grid gap-3 sm:grid-cols-2">
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
      </div>

      <PushNotificationPrompt />

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="mt-6 space-y-4 border-t border-slate-200/70 pt-5 dark:border-slate-700/50">
        <DashboardAgencyEntry />
        {!isPremium ? (
          <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 sm:flex-row sm:items-center dark:border-[#1E293B] dark:bg-[#0F1623]">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Plan gratuito</span>
              {" · "}hasta {FREE_TRIP_LIMIT} viajes. Desbloquea el asistente IA y análisis de documentos con Premium.
            </p>
            <Link
              href="/pricing"
              className="shrink-0 rounded-lg border border-[var(--brand)]/30 bg-[var(--brand)]/5 px-3 py-1.5 text-xs font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)]/10"
            >
              Ver Premium →
            </Link>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pb-2 text-[11px] text-slate-400 dark:text-slate-500">
          <Link href="/privacy" className="transition hover:text-slate-600 hover:underline dark:hover:text-slate-300">
            Política de privacidad
          </Link>
          <a
            href="mailto:hola@kaviro.app"
            className="transition hover:text-slate-600 hover:underline dark:hover:text-slate-300"
          >
            Contacto
          </a>
          <span>© {new Date().getFullYear()} Kaviro</span>
        </div>
      </footer>
    </main>
  );
}
