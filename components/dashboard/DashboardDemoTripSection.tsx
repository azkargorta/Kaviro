"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import TripCardItem from "@/components/dashboard/TripCardItem";
import { ChevronDown, ChevronUp, MapPin, RefreshCw, Sparkles } from "lucide-react";

type Trip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string | null;
};

const STORAGE_KEY = "kaviro_demo_section_collapsed";

export default function DashboardDemoTripSection({ trips }: { trips: Trip[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [resetting, setResetting] = useState(false);
  const router = useRouter();

  // Restore collapsed state from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch { /* private mode */ }
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

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try { window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch { /* */ }
  }

  if (!trips.length) return null;

  const demoTrip = trips[0];

  return (
    <section className="mx-auto max-w-2xl space-y-2">

      {/* ── Header colapsable ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between rounded-2xl border border-[#F87171]/25 bg-[#F87171]/5 px-4 py-3 text-left transition hover:bg-[#F87171]/10 dark:border-[#F87171]/20 dark:bg-[#F87171]/5"
      >
        <div className="flex items-center gap-2.5">
          <Image src="/brand/icon.png" alt="Kaviro" width={24} height={24} className="rounded-full shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Viaje demo · Londres
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Explora Kaviro sin crear nada · No cuenta para el límite gratuito
            </p>
          </div>
        </div>
        <span className="text-slate-400 shrink-0 ml-2">
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </span>
      </button>

      {/* ── Content ───────────────────────────────────────────────────── */}
      {!collapsed && mounted && (
        <div className="rounded-2xl border border-[#F87171]/20 bg-white dark:bg-[#0F1623] dark:border-[#F87171]/10 shadow-sm overflow-hidden">

          {/* Guided tour CTA */}
          <div className="bg-gradient-to-r from-[#F87171]/10 to-transparent px-4 py-3 border-b border-slate-100 dark:border-[#1E293B] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0">🗺️</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Visita guiada</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Tour de 7 pasos por todas las funciones
                </p>
              </div>
            </div>
            <Link
              href={`/trip/${demoTrip.id}/summary?tutorial=demo`}
              className="shrink-0 inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#F87171] px-3 text-xs font-bold text-white transition hover:bg-[#EF4444]"
            >
              <Sparkles className="h-3 w-3" />
              Iniciar tour
            </Link>
          </div>

          {/* Feature pills */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1E293B]">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">
              Qué puedes explorar
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "📅 Plan día a día",
                "🗺️ Rutas en el mapa",
                "💶 Gastos del grupo",
                "👥 Participantes",
                "📎 Documentos",
                "✨ Asistente IA",
              ].map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Trip card */}
          <div className="p-3">
            <TripCardItem
              trip={demoTrip}
              badge="Demo"
              accent="from-[#F87171]/10 to-slate-50 border-[#F87171]/20 dark:from-[#F87171]/5 dark:to-[#0F1623]"
              locked={false}
              isDemo
            />
          </div>

          {/* Footer tip + reset */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#080C14] border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Explora libremente — no afecta a tus viajes reales.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              title="Borra el demo actual y lo regenera con los datos más recientes"
              className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] px-2 py-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 transition hover:border-[#F87171]/50 hover:text-[#F87171] disabled:opacity-50 disabled:pointer-events-none"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${resetting ? "animate-spin" : ""}`} />
              {resetting ? "Regenerando…" : "Regenerar demo"}
            </button>
          </div>
        </div>
      )}

      {/* Collapsed state — quick access */}
      {collapsed && mounted && (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-50 dark:bg-[#080C14] border border-slate-200 dark:border-[#1E293B]">
          <Link
            href={`/trip/${demoTrip.id}/summary`}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#F87171] transition"
          >
            Abrir viaje demo →
          </Link>
          <Link
            href={`/trip/${demoTrip.id}/summary?tutorial=demo`}
            className="text-xs font-semibold text-[#F87171] hover:text-[#EF4444] transition"
          >
            🗺️ Visita guiada
          </Link>
        </div>
      )}
    </section>
  );
}
