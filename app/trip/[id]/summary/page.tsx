import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCachedTripAccess } from "@/lib/trip-access";
import TripBoardPageHeader from "@/components/layout/TripBoardPageHeader";
import TripScreenActions from "@/components/trip/common/TripScreenActions";
import TripSummaryOverview, {
  type TripSummaryActivityPreview,
  type TripSummaryTabDef,
} from "@/components/trip/summary/TripSummaryOverview";
import { getCachedTripPremium } from "@/lib/entitlements";
import { getTripWeatherBundle } from "@/lib/trip-weather";
import { normalizeWeatherStays } from "@/lib/trip-weather-stays";
import { parseActivityLocalMoment } from "@/lib/trip-activity-moment";
import { computeExpenseTotalsInBase } from "@/lib/trip-expense-totals";
import { loadTripSettingsRow } from "@/lib/load-trip-settings-row";
import { loadTripExpenseAmountRows } from "@/lib/load-trip-expense-amounts";
import { parseTripBudgetTarget } from "@/lib/parse-trip-budget";
import { loadTripWorkspaceMeta } from "@/lib/load-trip-workspace";
import { isTravelerPreviewActive, TRAVELER_PREVIEW_COOKIE } from "@/lib/trip-traveler-preview";
import TripExpensesSummaryPanel from "@/components/trip/expenses/TripExpensesSummaryPanel";

export const dynamic = "force-dynamic";

type TripPageProps = {
  params: { id: string };
};

type TripRow = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string | null;
  /** Puede venir como number (normal) o string (fallback/legacy). */
  budget_target?: unknown;
};

type ActivityRow = {
  id: string;
  title: string;
  activity_date: string | null;
  activity_time: string | null;
  place_name: string | null;
  address: string | null;
};

const CALENDAR_TZ = "Europe/Madrid";

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return "Fechas por definir";
  if (start && end) return `${formatDate(start)} — ${formatDate(end)}`;
  return start ? `Desde ${formatDate(start)}` : `Hasta ${formatDate(end)}`;
}

function calendarDayYMD(timeZone: string, d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function pickNextPlan(activities: ActivityRow[], todayYmd: string, now: Date): ActivityRow | null {
  const items = activities.map((a) => ({ a, when: parseActivityLocalMoment(a) }));
  const valid = items.filter((i): i is { a: ActivityRow; when: Date } => i.when !== null);
  const upcoming = valid.filter((i) => i.when.getTime() >= now.getTime());
  if (upcoming.length) {
    upcoming.sort((x, y) => x.when.getTime() - y.when.getTime());
    return upcoming[0]!.a;
  }
  const futureDays = activities
    .filter((a) => a.activity_date && a.activity_date > todayYmd)
    .sort(
      (a, b) =>
        (a.activity_date || "").localeCompare(b.activity_date || "") ||
        String(a.activity_time || "").localeCompare(String(b.activity_time || ""), "en")
    );
  if (futureDays.length) return futureDays[0]!;
  return null;
}

function truncateHint(s: string, max = 52) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function formatMoneyCompact(amount: number, currency: string) {
  const c = (currency || "EUR").toUpperCase();
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${Math.round(amount)} ${c}`;
  }
}

export async function generateMetadata({ params }: TripPageProps) {
  try {
    const { createClient: sc } = await import("@/lib/supabase/server");
    const supabase = await sc();
    const { data } = await supabase
      .from("trips")
      .select("name, destination, start_date, end_date")
      .eq("id", params.id)
      .maybeSingle();
    if (!data) return { title: "Kaviro" };
    const dest = data.destination ? ` — ${data.destination}` : "";
    const dates = data.start_date
      ? ` · ${new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(data.start_date + "T00:00:00"))}`
      : "";
    const title = `${data.name}${dest}${dates} | Kaviro`;
    const description = `Organiza ${data.name}${dest} con Kaviro: plan por días, rutas, gastos y documentos en un solo lugar.`;
    return {
      title,
      description,
      openGraph: { title, description, type: "website", siteName: "Kaviro" },
      twitter: { card: "summary", title, description },
    };
  } catch {
    return { title: "Kaviro" };
  }
}

export default async function TripSummaryPage({ params }: TripPageProps) {
  const tripId = params.id;
  const access = await getCachedTripAccess(tripId);
  const supabase = await createClient();
  const workspace = await loadTripWorkspaceMeta(supabase, tripId, access.userId);
  const previewCookie = (await cookies()).get(TRAVELER_PREVIEW_COOKIE)?.value;
  const travelerPreview =
    workspace.isAgencyManaged && isTravelerPreviewActive(previewCookie, tripId);
  if (workspace.isAgencyTrip && !travelerPreview) {
    redirect(`/trip/${tripId}/plan`);
  }
  const isPremium = await getCachedTripPremium(tripId, access.userId);

  const [
    { data: profileRow },
    { count: participantsCount },
    { count: activitiesCount, data: activitiesData },
    { count: routesCount },
    { count: expensesCount },
    { count: resourcesCount },
    { data: lastExpenseRow },
    { data: lastResourceRow },
    { data: firstRouteRow },
  ] = await Promise.all([
    supabase.from("profiles").select("demo_trip_id").eq("id", access.userId).maybeSingle(),
    supabase.from("trip_participants").select("id", { count: "exact", head: true }).eq("trip_id", tripId).neq("status", "removed"),
    supabase
      .from("trip_activities")
      .select("id, title, activity_date, activity_time, place_name, address", { count: "exact" })
      .eq("trip_id", tripId)
      .order("activity_date", { ascending: true })
      .order("activity_time", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("trip_routes").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
    supabase.from("trip_expenses").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
    supabase.from("trip_resources").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
    supabase.from("trip_expenses").select("title").eq("trip_id", tripId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("trip_resources").select("title").eq("trip_id", tripId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase
      .from("trip_routes")
      .select("title, route_day")
      .eq("trip_id", tripId)
      .order("route_day", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const expenseAmountRows = await loadTripExpenseAmountRows(supabase, tripId);

  let tripRow: TripRow & { is_demo?: boolean; weather_stays?: unknown };
  try {
    const loaded = await loadTripSettingsRow(supabase, tripId);
    if (!loaded.data) redirect("/dashboard");
    tripRow = loaded.data as TripRow & { is_demo?: boolean; weather_stays?: unknown };
  } catch (e) {
    console.error("Error cargando viaje:", e);
    redirect("/dashboard");
  }

  const currentTrip = tripRow;
  const isDemoTrip =
    Boolean(currentTrip.is_demo) ||
    String((profileRow as { demo_trip_id?: string } | null)?.demo_trip_id || "") === tripId;
  const activities = (activitiesData ?? []) as ActivityRow[];

  const now = new Date();
  const todayStr = calendarDayYMD(CALENDAR_TZ, now);
  const todayLabel = new Intl.DateTimeFormat("es-ES", {
    timeZone: CALENDAR_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const nextActivity = pickNextPlan(activities, todayStr, now);

  const plansToday: Array<TripSummaryActivityPreview & { isPast: boolean }> = activities
    .filter((a) => a.activity_date === todayStr)
    .map((a) => {
      const w = parseActivityLocalMoment(a);
      return {
        id: a.id,
        title: a.title,
        activity_date: a.activity_date,
        activity_time: a.activity_time,
        place_name: a.place_name,
        address: a.address,
        isPast: w ? w.getTime() < now.getTime() : false,
      };
    })
    .sort((a, b) => {
      const wa = parseActivityLocalMoment(a as ActivityRow);
      const wb = parseActivityLocalMoment(b as ActivityRow);
      if (!wa && !wb) return 0;
      if (!wa) return 1;
      if (!wb) return -1;
      return wa.getTime() - wb.getTime();
    });

  const nextPlanPreview: TripSummaryActivityPreview | null = nextActivity
    ? {
        id: nextActivity.id,
        title: nextActivity.title,
        activity_date: nextActivity.activity_date,
        activity_time: nextActivity.activity_time,
        place_name: nextActivity.place_name,
        address: nextActivity.address,
      }
    : null;

  const weatherStays = normalizeWeatherStays((currentTrip as { weather_stays?: unknown }).weather_stays);
  const weatherBundle = await getTripWeatherBundle({
    destination: currentTrip.destination,
    weatherStays,
  });
  const weather = weatherBundle.primary;
  const hasPlace =
    weatherStays.length > 0 || Boolean((currentTrip.destination ?? "").trim());
  const weatherHint = !hasPlace ? "no-destination" : !weather ? "unavailable" : "ok";

  const lastExpenseTitle =
    typeof (lastExpenseRow as { title?: string } | null)?.title === "string"
      ? String((lastExpenseRow as { title: string }).title).trim()
      : "";
  const lastResourceTitle =
    typeof (lastResourceRow as { title?: string } | null)?.title === "string"
      ? String((lastResourceRow as { title: string }).title).trim()
      : "";

  const firstRoute = firstRouteRow as { title?: string | null; route_day?: string | null } | null;
  const baseCurrency = currentTrip.base_currency || "EUR";
  const expenseTotals = computeExpenseTotalsInBase(
    (expenseAmountRows ?? []) as Array<{
      amount: unknown;
      currency: string | null;
      exchange_rate_to_base?: number | null;
    }>,
    baseCurrency
  );
  const budgetTarget = parseTripBudgetTarget(currentTrip.budget_target);
  const totalSpentInBase = expenseTotals.totalInBase;
  const expenseMultiCurrency =
    expenseTotals.hasUnconvertedForeign || expenseTotals.byCurrency.size > 1;

  const alerts = [
    !currentTrip.destination ? "Añade el destino para activar clima y contexto." : null,
    (participantsCount ?? 0) <= 1 ? "Añade participantes si vais a viajar en grupo." : null,
    (activitiesCount ?? 0) === 0 ? "Todavía no hay planes: crea tu primer plan en la pestaña Plan." : null,
    (routesCount ?? 0) === 0 ? "Aún no hay rutas: abre Rutas para crear trayectos." : null,
    (expensesCount ?? 0) === 0 ? "Aún no hay gastos: añade el primer gasto para ver balances." : null,
  ].filter(Boolean) as string[];

  const planHint = nextActivity
    ? `Siguiente: ${truncateHint(nextActivity.title)}`
    : (activitiesCount ?? 0) > 0
      ? "Hay actividades: revisa fechas en Plan si no ves un “siguiente”."
      : null;
  const mapHint =
    (routesCount ?? 0) === 0
      ? "Aún sin rutas: enlaza paradas del plan en el mapa."
      : firstRoute?.title
        ? `Primera en calendario: ${truncateHint(String(firstRoute.title), 34)}${
            firstRoute.route_day ? ` · ${formatDate(firstRoute.route_day)}` : ""
          }`
        : "Edita trayectos y paradas en el mapa.";

  const expenseHintParts: string[] = [];
  if ((expensesCount ?? 0) > 0 && expenseTotals.byCurrency.size === 1) {
    const [cur, val] = [...expenseTotals.byCurrency.entries()][0]!;
    expenseHintParts.push(`Suma aprox.: ${formatMoneyCompact(val, cur)}`);
  } else if ((expensesCount ?? 0) > 0 && expenseTotals.byCurrency.size > 1) {
    expenseHintParts.push("Varias divisas: totales en Gastos");
  }
  if (lastExpenseTitle) expenseHintParts.push(`Último: ${truncateHint(lastExpenseTitle, 38)}`);
  const expensesHint =
    expenseHintParts.length > 0
      ? expenseHintParts.join(" · ")
      : (expensesCount ?? 0) > 0
        ? "Abre Gastos para ver importes y balances."
        : "Registra el primer gasto para balances.";
  const peopleHint =
    (participantsCount ?? 0) <= 1 ? "Invita al grupo con el enlace de participantes." : "Roles y permisos por persona.";
  const resourcesHint = lastResourceTitle ? `Último doc: ${truncateHint(lastResourceTitle, 44)}` : (resourcesCount ?? 0) > 0 ? "Revisa reservas y archivos." : "Sube billetes o PDFs cuando los tengas.";
  const aiHint = isPremium
    ? "Pide rutas, un itinerario o cambios con contexto del viaje."
    : "Desbloquea el asistente personal con Premium.";

  const tabs: TripSummaryTabDef[] = [
    {
      href: `/trip/${tripId}/plan`,
      label: "Plan",
      subtitle: "Itinerario, notas del viaje y actividades por día",
      metric: `${activitiesCount ?? 0} planes`,
      iconKey: "plan",
      tone: "violet",
      hint: planHint,
    },
    {
      href: `/trip/${tripId}/map`,
      label: "Mapa",
      subtitle: "Rutas, trayectos y paradas sobre el mapa",
      metric: `${routesCount ?? 0} rutas`,
      iconKey: "map",
      tone: "emerald",
      hint: mapHint,
    },
    {
      href: `/trip/${tripId}/expenses`,
      label: "Gastos",
      subtitle: "Split, pagos y balances del grupo",
      metric: `${expensesCount ?? 0} gastos`,
      iconKey: "expenses",
      tone: "amber",
      hint: expensesHint,
    },
    {
      href: `/trip/${tripId}/participants`,
      label: "Participantes",
      subtitle: "Invitaciones, roles y permisos",
      metric: `${participantsCount ?? 0} ${(participantsCount ?? 0) === 1 ? "persona" : "personas"}`,
      iconKey: "participants",
      tone: "slate",
      hint: peopleHint,
    },
    {
      href: `/trip/${tripId}/resources`,
      label: "Documentos",
      subtitle: "Documentos, reservas y listas",
      metric: `${resourcesCount ?? 0} ítems`,
      iconKey: "resources",
      tone: "rose",
      hint: resourcesHint,
    },
    {
      href: `/trip/${tripId}/ai-chat`,
      label: "IA",
      subtitle: isPremium ? "Conversación con el contexto de este viaje" : "Requiere plan Premium",
      metric: isPremium ? "Premium activo" : "Ver Premium",
      iconKey: "chat",
      tone: "violet",
      hint: aiHint,
    },
  ];

  if (workspace.tripMode === "expenses") {
    return (
      <main className="w-full min-w-0 max-w-full space-y-5 md:space-y-6">
        <TripBoardPageHeader
          section="Inicio"
          title={currentTrip.name}
          description={
            currentTrip.start_date || currentTrip.end_date
              ? `Grupo de gastos · ${formatDateRange(currentTrip.start_date, currentTrip.end_date)}`
              : "Grupo de gastos compartidos"
          }
          iconKey="expenses"
          iconAlt="Gastos"
          actions={<TripScreenActions tripId={tripId} homeLabel="Mis viajes" />}
        />
        <TripExpensesSummaryPanel
          tripId={tripId}
          groupName={currentTrip.name}
          destination={currentTrip.destination}
          startDate={currentTrip.start_date}
          endDate={currentTrip.end_date}
          canManageTrip={access.can_manage_trip}
        />
      </main>
    );
  }

  return (
    <main className="w-full min-w-0 max-w-full space-y-5 md:space-y-6">
      <TripBoardPageHeader
        section="Resumen"
        title="Centro de control"
        description="Itinerario, gastos, documentos y equipo en un vistazo"
        iconKey="summary"
        iconAlt="Resumen"
        actions={<TripScreenActions tripId={tripId} homeLabel="Mis viajes" />}
      />

      <TripSummaryOverview
        tripId={tripId}
        tripName={currentTrip.name}
        weather={weather}
        weatherByCity={weatherBundle.byCity}
        activeWeatherCity={weatherBundle.activeCityToday}
        weatherHint={weatherHint}
        todayLabel={todayLabel}
        plansToday={plansToday}
        nextPlan={nextPlanPreview}
        tabs={tabs}
        tripStartDate={currentTrip.start_date}
        tripEndDate={currentTrip.end_date}
        tripDestination={currentTrip.destination}
        activitiesCount={activitiesCount ?? 0}
        participantsCount={participantsCount ?? 1}
        budgetTarget={budgetTarget}
        totalSpent={totalSpentInBase}
        expensesCount={expensesCount ?? 0}
        currency={baseCurrency}
        expenseMultiCurrency={expenseMultiCurrency}
      />

      {alerts.length ? (
        <section className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3.5 dark:border-[#1E293B] dark:bg-[#0a0e14]/50">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Pendiente de configurar
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 [&>li:nth-child(n+3)]:hidden md:[&>li:nth-child(n+3)]:list-item">
            {alerts.slice(0, 4).map((a) => (
              <li key={a} className="flex gap-2 leading-snug">
                <span className="text-[var(--brand)]" aria-hidden>
                  ·
                </span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
