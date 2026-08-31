import TripExpensesView from "@/components/trip/expenses/TripExpensesView";
import TripScreenActions from "@/components/trip/common/TripScreenActions";
import TripBoardPageHeader from "@/components/layout/TripBoardPageHeader";
import TripEmptyModuleGuide from "@/components/trip/onboarding/TripEmptyModuleGuide";
import { getCachedTripAccess } from "@/lib/trip-access";
import { createClient } from "@/lib/supabase/server";
import { getCachedTripPremium } from "@/lib/entitlements";
import { loadTripSettingsRow } from "@/lib/load-trip-settings-row";
import { parseTripBudgetTarget } from "@/lib/parse-trip-budget";

export default async function TripExpensesPage({
  params,
}: {
  params: { id: string };
}) {
  const tripId = params?.id;

  if (!tripId) {
    return (
      <main>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se ha recibido el ID del viaje.
        </div>
      </main>
    );
  }

  const access = await getCachedTripAccess(tripId);
  const supabase = await createClient();
  const [isPremium, { count: expensesCount }] = await Promise.all([
    getCachedTripPremium(tripId, access.userId),
    supabase
      .from("trip_expenses")
      .select("id", { count: "exact", head: true })
      .eq("trip_id", tripId),
  ]);

  let budgetTarget: number | null = null;
  try {
    const loaded = await loadTripSettingsRow(supabase, tripId);
    budgetTarget = parseTripBudgetTarget(loaded.data?.budget_target);
  } catch {
    budgetTarget = null;
  }

  let isExpenseGroup = false;
  try {
    const { data: tripRow } = await supabase
      .from("trips")
      .select("trip_mode")
      .eq("id", tripId)
      .single();
    isExpenseGroup = tripRow?.trip_mode === "expenses";
  } catch {
    isExpenseGroup = false;
  }

  return (
    <main className="space-y-6">
      <TripBoardPageHeader
        section={isExpenseGroup ? "Grupo de gastos" : "Gastos del viaje"}
        title={isExpenseGroup ? "Gastos compartidos" : "Control de gastos"}
        description={
          isExpenseGroup
            ? "Registra tickets, divide importes y lleva el control de quién debe qué en el grupo."
            : "Registra tickets, divide importes entre pasajeros, convierte moneda y marca pagos pendientes."
        }
        iconKey="expenses"
        iconAlt="Gastos"
        actions={<TripScreenActions tripId={tripId} />}
      />

      {(expensesCount ?? 0) === 0 && access.can_manage_expenses ? (
        <TripEmptyModuleGuide
          icon="💶"
          title="Añade el primer gasto cuando lo necesites"
          description="Registra quién pagó y entre quiénes se reparte. A partir de ahí Kaviro calcula automáticamente los balances del grupo."
          primaryHref={`/trip/${encodeURIComponent(tripId)}/expenses#expenses-workspace`}
          primaryLabel="Ir a añadir el primer gasto"
          secondaryText={
            isExpenseGroup
              ? "En un grupo de gastos este es el primer paso recomendado."
              : "Si todavía no habéis pagado nada juntos, puedes dejar esta sección para más adelante sin bloquear la organización del viaje."
          }
        />
      ) : null}

      <section id="expenses-workspace" className="scroll-mt-24">
        <TripExpensesView
          tripId={tripId}
          isPremium={isPremium}
          canManageExpenses={access.can_manage_expenses}
          budgetTarget={budgetTarget}
          isExpenseGroup={isExpenseGroup}
        />
      </section>
    </main>
  );
}
