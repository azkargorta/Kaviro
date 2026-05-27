"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import TripCardItem from "@/components/dashboard/TripCardItem";
import { ChevronDown, ChevronUp, MapPin, Loader2 } from "lucide-react";
import { stripesTripDateRange } from "@/lib/onboarding/stripes-demo-seed";

type Trip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string | null;
};

const STRIPES_FEATURES = [
  "✈️ Vuelos Madrid ↔ Chicago",
  "🏈 Bears @ Packers · Lambeau",
  "🏟️ Tour Soldier Field",
  "🏀 Chicago Bulls · NBA",
  "🎭 Teatro & comedia",
  "🚢 Tour arquitectura",
  "🎷 Blues & jazz",
  "🗽 Tiempo libre",
];

export default function DashboardStripesTripSection({
  trip,
  canCreate = true,
}: {
  trip: Trip | null;
  canCreate?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { start_date, end_date } = stripesTripDateRange();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleCreate() {
    if (creating || !canCreate) return;
    setCreating(true);
    setError(null);
    try {
      const resp = await fetch("/api/onboarding/stripes", {
        method: "POST",
        credentials: "include",
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(data?.error || "No se pudo crear el viaje.");
        return;
      }
      if (data?.redirectTo) {
        router.push(data.redirectTo);
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-2">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between rounded-2xl border border-[#002147]/15 bg-gradient-to-r from-white to-[#C43030]/5 px-4 py-3 text-left transition hover:border-[#C43030]/30 dark:border-[#002147]/40 dark:from-[#0F1623] dark:to-[#C43030]/10"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="/brand/stripes-logo.png"
            alt="Stripes Sports Trips España"
            width={120}
            height={36}
            className="h-8 w-auto shrink-0 object-contain object-left"
          />
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#002147] dark:text-white">
              Viaje con Stripes
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Chicago 7 días · Lambeau Field · Bulls NBA
            </p>
          </div>
        </div>
        <span className="text-slate-400 shrink-0 ml-2">
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </span>
      </button>

      {!collapsed && mounted && (
        <div className="rounded-2xl border border-[#002147]/10 bg-white dark:bg-[#0F1623] dark:border-[#002147]/30 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#002147]/8 via-[#C43030]/5 to-transparent px-4 py-3 border-b border-slate-100 dark:border-[#1E293B]">
            <p className="text-xs font-bold text-[#002147] dark:text-slate-200">
              Stripes Sports Trips España × Kaviro
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              Itinerario de 7 días desde Madrid: vuelos con 3 h de margen en aeropuerto, excursión a{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">Lambeau Field</strong>{" "}
              (Bears @ Packers, 11 oct 2026), tour en{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">Soldier Field</strong>,
              partido de los{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">Bulls</strong>, teatros,
              tours y tiempo libre.
            </p>
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#C43030]">
              {start_date} → {end_date}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1E293B]">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">
              Qué incluye el plan
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STRIPES_FEATURES.map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {trip ? (
            <div className="p-3">
              <TripCardItem
                trip={trip}
                badge="Stripes"
                accent="from-[#002147]/10 to-[#C43030]/5 border-[#002147]/20 dark:from-[#002147]/20 dark:to-[#C43030]/10 dark:border-[#002147]/30"
                locked={false}
              />
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Añade el viaje completo a tu panel: plan día a día, gastos de ejemplo, rutas en mapa y listas de
                equipaje y entradas. Disponible para todos los usuarios — no cuenta en el límite del plan gratuito.
              </p>
              {error ? (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
              ) : null}
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !canCreate}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#C43030] px-4 text-sm font-bold text-white shadow-md transition hover:bg-[#a82828] disabled:opacity-50 disabled:pointer-events-none"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando viaje…
                  </>
                ) : (
                  "Añadir viaje Stripes a mis viajes"
                )}
              </button>
              {!canCreate ? (
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Has alcanzado el límite de viajes del plan gratuito. Hazte Premium para añadir este viaje.
                </p>
              ) : null}
            </div>
          )}

          <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#080C14] border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-3 w-3 text-[#C43030] shrink-0" />
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Programa oficial Stripes Sports Trips · Chicago & Green Bay
              </p>
            </div>
            {trip ? (
              <Link
                href={`/trip/${trip.id}/plan`}
                className="shrink-0 text-[10px] font-bold text-[#002147] hover:text-[#C43030] dark:text-slate-300 transition"
              >
                Ver plan →
              </Link>
            ) : null}
          </div>
        </div>
      )}

      {collapsed && mounted && trip ? (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-50 dark:bg-[#080C14] border border-slate-200 dark:border-[#1E293B]">
          <Link
            href={`/trip/${trip.id}/summary`}
            className="text-xs font-semibold text-[#002147] dark:text-slate-300 hover:text-[#C43030] transition"
          >
            Abrir viaje Stripes →
          </Link>
          <span className="text-[10px] font-semibold text-slate-400">7 días · Chicago</span>
        </div>
      ) : null}
    </section>
  );
}
