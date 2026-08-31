"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TripCardItem from "@/components/dashboard/TripCardItem";
import KaviroMark from "@/components/brand/KaviroMark";
import { ChevronDown, ChevronUp, MapPin, RefreshCw, Sparkles } from "lucide-react";
import { DEMO_SPOTLIGHT_STEP_COUNT } from "@/lib/onboarding/demo-tour-copy";

type Trip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string | null;
};

export default function DashboardDemoTripSection({ trips }: { trips: Trip[] }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [resetting, setResetting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleReset() {
    if (resetting) return;
    setResetting(true);
    try {
      const resp = await fetch("/api/onboarding/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
        credentials: "include",
      });
      const data = await resp.json().catch(() => ({}));
      if (data?.redirectTo) {
        router.push(data.redirectTo);
        router.refresh();
      }
    } finally {
      setResetting(false);
    }
  }

  if (!trips.length) return null;

  const demoTrip = trips[0];

  return (
    <section className="space-y-2" aria-label="Ejemplo de Kaviro">
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-[#F87171]/35 hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623] dark:hover:bg-[#111a29]"
      >
        <div className="flex items-center gap-2.5">
          <KaviroMark size={24} className="shrink-0 rounded-full" title="Kaviro" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">¿Quieres ver un ejemplo completo?</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Explora Londres cuando quieras · No afecta a tus viajes reales
            </p>
          </div>
        </div>
        <span className="ml-2 shrink-0 text-slate-400">
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </span>
      </button>

      {!collapsed && mounted ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-[#1E293B] dark:bg-[#080C14]">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Viaje demo · Londres</p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Una visita guiada opcional de {DEMO_SPOTLIGHT_STEP_COUNT} pasos para conocer las funciones principales.
              </p>
            </div>
            <Link
              href={`/trip/${demoTrip.id}/summary?tutorial=demo`}
              data-tour="dashboard-demo-tour-cta"
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#F87171]/30 bg-[#F87171]/10 px-3 text-xs font-bold text-[#F87171] transition hover:bg-[#F87171]/15"
            >
              <Sparkles className="h-3 w-3" />
              Ver tour
            </Link>
          </div>

          <div className="px-4 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Incluye ejemplos de</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "📅 Plan día a día",
                "🗺️ Rutas",
                "💶 Gastos",
                "👥 Participantes",
                "📎 Documentos",
                "✨ Asistente IA",
              ].map((feature) => (
                <span
                  key={feature}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-300"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 pt-0">
            <TripCardItem
              trip={demoTrip}
              badge="Demo"
              accent="from-slate-50 to-white border-slate-200 dark:from-[#080C14] dark:to-[#0F1623]"
              locked={false}
              isDemo
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-[#1E293B] dark:bg-[#080C14]">
            <div className="flex min-w-0 items-center gap-2">
              <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Úsalo solo si prefieres explorar antes de crear tu viaje.</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              title="Borra el demo actual y lo regenera con los datos más recientes"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 transition hover:border-[#F87171]/50 hover:text-[#F87171] disabled:pointer-events-none disabled:opacity-50 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-400"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${resetting ? "animate-spin" : ""}`} />
              {resetting ? "Regenerando…" : "Regenerar"}
            </button>
          </div>
        </div>
      ) : null}

      {collapsed && mounted ? (
        <div className="flex items-center justify-end px-2">
          <Link
            href={`/trip/${demoTrip.id}/summary?tutorial=demo`}
            className="text-[11px] font-semibold text-slate-400 transition hover:text-[#F87171]"
          >
            Ver ejemplo de Londres →
          </Link>
        </div>
      ) : null}
    </section>
  );
}
