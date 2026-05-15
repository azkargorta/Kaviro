"use client";

import TripCardItem from "@/components/dashboard/TripCardItem";

type Trip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string | null;
};

export default function DashboardDemoTripSection({ trips }: { trips: Trip[] }) {
  if (!trips.length) return null;

  return (
    <section className="mx-auto max-w-2xl space-y-3">
      <DemoSectionHeader />
      <div className="rounded-2xl border border-violet-200/90 bg-gradient-to-b from-violet-50/80 to-white p-3 shadow-sm ring-1 ring-violet-200/40 dark:border-violet-900/50 dark:from-violet-950/30 dark:to-[#0F1623] sm:p-4">
        <div className="grid grid-cols-1 gap-3">
          {trips.map((trip) => (
            <TripCardItem
              key={trip.id}
              trip={trip}
              badge="Demo"
              accent="from-violet-100 to-indigo-50 border-violet-200"
              locked={false}
              isDemo
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoSectionHeader() {
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/60 px-4 py-3 dark:border-violet-900/40 dark:bg-violet-950/20">
      <h2 className="text-base font-bold tracking-tight text-slate-950 dark:text-white">Viaje demo</h2>
      <p className="mt-0.5 text-xs text-slate-600 sm:text-sm dark:text-slate-300">
        Practica con el ejemplo de Londres (plan, gastos multi-moneda y rutas). No cuenta para el límite de viajes del plan gratuito.
      </p>
    </div>
  );
}
