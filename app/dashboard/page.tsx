import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateTripSection from "@/components/dashboard/CreateTripSection";
import OnboardingNudge from "@/components/dashboard/OnboardingNudge";
import DashboardAiShortcuts from "@/components/dashboard/DashboardAiShortcuts";
import DashboardCreateFlowStepper from "@/components/dashboard/DashboardCreateFlowStepper";
import { surfaceAccentCyan } from "@/components/ui/brandStyles";
import { Sparkles, Plane } from "lucide-react";
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

  const showSidePanel = allRealTrips.length > 0 || demoTrips.length > 0;

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

      <DashboardTripInvitesInbox />

      {/* ── Área de acción principal ────────────────────────────────────── */}
      <div className={showSidePanel ? "grid gap-4 md:grid-cols-2 md:items-start" : ""}>

        {/* Columna izquierda: crear viaje — order-2 en móvil para que "estado actual" aparezca primero */}
        <section
          className={`min-w-0 overflow-hidden rounded-2xl px-5 py-5 md:px-6 md:py-6 ${surfaceAccentCyan} dark:border-slate-700/50 dark:bg-slate-950/40${showSidePanel ? " order-2 md:order-1" : ""}`}
        >
          {/* Header de sección */}
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] text-white shadow-sm">
              <Plane className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Crear viaje</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Sigue los pasos o planifica con IA</p>
            </div>
          </div>

          <DashboardCreateFlowStepper isPremium={isPremium} canCreate={!freeTripLimitReached} />

          {/* Tarjeta compacta IA / Premium */}
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700/50">
            {isPremium ? (
              <>
                <div className="flex min-w-0 items-center justify-between gap-3 overflow-hidden rounded-xl border border-[var(--brand-border)] bg-white/70 px-4 py-3 dark:border-slate-600/40 dark:bg-slate-800/40">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-light)] text-[var(--brand)]">
                      <Sparkles className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--brand)] dark:text-[#F87171]">Asistente personal</p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        Genera planes completos con IA para cualquier destino
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/trips/new/planner"
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
                    title="Genera un borrador con lugares reales y coordenadas"
                  >
                    <Sparkles className="h-3 w-3" aria-hidden />
                    Planificar
                  </Link>
                </div>
                <DashboardAiShortcuts trips={realTrips} isPremium />
              </>
            ) : (
              <Link
                href="/account?upgrade=premium&focus=premium#premium-plans"
                className="group flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/40 px-4 py-3 transition hover:border-amber-300 hover:shadow-sm dark:border-amber-800/30 dark:from-amber-950/20 dark:to-transparent"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                    <Sparkles className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-300">Asistente IA con Premium</p>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-500">Sin límite de viajes y mucho más</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-semibold text-amber-700 transition group-hover:underline dark:text-amber-400">
                  Ver planes →
                </span>
              </Link>
            )}
          </div>

          <div
            id="create-trip"
            className="mt-4 scroll-mt-20 border-t border-slate-100 pt-4 md:mt-5 md:pt-5 dark:border-slate-700/50"
          >
            <CreateTripSection isPremium={isPremium} tripCount={realTrips.length} />
          </div>
        </section>

        {/* Columna derecha: viaje activo + demo + onboarding — order-1 en móvil (aparece primero) */}
        {showSidePanel && (
          <div className="order-1 min-w-0 flex flex-col gap-3 md:order-2">
            <p className="hidden text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 md:block dark:text-slate-500">
              Tu estado actual
            </p>
            <DashboardContinueTrip trips={allRealTrips} />
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
            <PushNotificationPrompt />
          </div>
        )}
      </div>

      {/* Si no hay panel lateral, mostrar push notification debajo */}
      {!showSidePanel && <PushNotificationPrompt />}

      {/* ── Grid de viajes ──────────────────────────────────────────────── */}
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

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="mt-6 space-y-3 border-t border-slate-200/70 pt-5 dark:border-slate-700/50">
        <DashboardAgencyEntry />
        {!isPremium ? (
          <section className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-700 md:text-sm dark:border-slate-700/50 dark:bg-slate-950/40 dark:text-slate-200">
            {freePlanBanner()}
          </section>
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
