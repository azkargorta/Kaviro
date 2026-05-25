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
import DashboardHero from "@/components/dashboard/DashboardHero";
import DashboardContinueTrip from "@/components/dashboard/DashboardContinueTrip";
import DashboardTripsClient from "@/components/dashboard/DashboardTripsClient";
import PushNotificationPrompt from "@/components/pwa/PushNotificationPrompt";
import DashboardOfflineRegistry, {
  DashboardOfflinePanel,
} from "@/components/dashboard/DashboardOfflineRegistry";
import {
  ensureDemoTripForUser,
  isFirstDemoOnboardingVisit,
  readDemoOnboardingProfile,
} from "@/lib/onboarding/createDemoTrip";
import { FREE_TRIP_LIMIT, freePlanBanner } from "@/lib/premium-copy";

type Trip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string | null;
  created_at?: string | null;
  is_demo?: boolean | null;
  is_favorite?: boolean;
};

type TripParticipantRow = {
  trip_id: string;
  is_favorite?: boolean;
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

function categorizeTrips(trips: Trip[]) {
  const today = new Date().toISOString().slice(0, 10);

  const current: Trip[] = [];
  const future: Trip[] = [];
  const past: Trip[] = [];
  const unscheduled: Trip[] = [];

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

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let demoTripId: string | null = null;
  let isFirstOnboardingVisit = true;
  const existingDemoProfile = await readDemoOnboardingProfile(user.id);
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

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .maybeSingle();
  const isPremium = Boolean((profileRow as { is_premium?: boolean } | null)?.is_premium);

  const { data: participantRows, error: participantsError } = await supabase
    .from("trip_participants")
    .select("trip_id, is_favorite")
    .eq("user_id", user.id);

  if (participantsError) {
    console.error("Error cargando participaciones del usuario:", participantsError);
  }

  const participantData = (participantRows ?? []) as TripParticipantRow[];
  const favoriteMap = new Map<string, boolean>(
    participantData.map((row) => [row.trip_id, row.is_favorite ?? false])
  );
  const tripIds = participantData.map((row) => row.trip_id).filter(Boolean);

  let trips: Trip[] = [];

  if (tripIds.length > 0) {
    const { data: tripsData, error: tripsError } = await supabase
      .from("trips")
      .select("id, name, destination, start_date, end_date, base_currency, created_at, is_demo")
      .in("id", tripIds)
      .order("created_at", { ascending: false });

    if (tripsError) {
      console.error("Error cargando viajes del usuario:", tripsError);
    } else {
      trips = ((tripsData ?? []) as Trip[]).map((t) => ({
        ...t,
        is_favorite: favoriteMap.get(t.id) ?? false,
      }));
    }
  }

  const demoTrips = trips.filter((t) => t.is_demo || (demoTripId && t.id === demoTripId));
  const realTrips = trips.filter((t) => !demoTrips.some((d) => d.id === t.id));

  const { current, future, past, unscheduled } = categorizeTrips(realTrips);
  const lockedTripIds = new Set<string>();
  const freeTripLimitReached = !isPremium && realTrips.length >= FREE_TRIP_LIMIT;

  const currentIds = new Set(current.map((t) => t.id));
  const futureIds = new Set(future.map((t) => t.id));
  const pastIds = new Set(past.map((t) => t.id));

  const favoriteTrips = realTrips
    .filter((t) => t.is_favorite)
    .map((t) => {
      let badge = "Pendiente";
      let accent = "from-amber-100 to-orange-50 border-amber-200";
      if (currentIds.has(t.id)) {
        badge = "En curso";
        accent = "from-emerald-100 to-teal-50 border-emerald-200";
      } else if (futureIds.has(t.id)) {
        badge = "Próximo";
        accent = "from-[var(--brand-light)] to-slate-50 border-[var(--brand-border)]";
      } else if (pastIds.has(t.id)) {
        badge = "Finalizado";
        accent = "from-slate-100 to-slate-50 border-slate-200";
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

  return (
    <main className="page-shell space-y-4 pb-8 md:space-y-5 md:pb-10">
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
      <div className="relative">
        <DashboardHero tripCount={realTrips.length} isPremium={isPremium} />
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

      {realTrips.length === 0 ? null : (
        <DashboardTripsClient
          current={current}
          future={future}
          past={past}
          unscheduled={unscheduled}
          favoriteTrips={favoriteTrips}
          lockedTripIds={Array.from(lockedTripIds)}
        />
      )}
    </main>
  );
}
