"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Loader2 } from "lucide-react";
import {
  PAYMENT_OVERALL_COLORS,
  formatMoney,
} from "@/lib/agency/payments";
import {
  agencyCardClass,
  agencyPageSubtitleClass,
  agencyPageTitleClass,
} from "@/lib/agency-theme";
import { useToast } from "@/components/ui/toast";

type TripRow = {
  tripId: string;
  tripName: string;
  startDate: string | null;
  currency: string;
  collectedLabel: string;
  pendingLabel: string;
  totals: { collected: number; pending: number; counts: { paid: number; pending: number } };
  travelerCount: number;
};

type TravelerRow = {
  email: string;
  displayName: string;
  trips: Array<{
    tripId: string;
    tripName: string;
    overall: string;
    overallLabel: string;
    collected: number;
    collectedLabel: string;
    pending: number;
    depositDueAt: string | null;
    finalDueAt: string | null;
  }>;
};

export default function AgencyFinancePanel() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [totals, setTotals] = useState({ collected: 0, pending: 0, counts: { paid: 0, pending: 0 } });
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [travelers, setTravelers] = useState<TravelerRow[]>([]);
  const [tab, setTab] = useState<"trips" | "travelers">("trips");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agencies/payments/overview", { cache: "no-store" });
      const data = await res.json();
      if (data.needsMigration) {
        setNeedsMigration(true);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setTotals(data.totals ?? { collected: 0, pending: 0, counts: {} });
      setTrips(data.trips ?? []);
      setTravelers(data.travelers ?? []);
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden />
      </div>
    );
  }

  if (needsMigration) {
    return (
      <p className={`${agencyCardClass} p-4 text-sm text-amber-900`}>
        Ejecuta <code>docs/kaviro_agency_payments.sql</code> en Supabase para activar cobros y este panel.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={agencyPageTitleClass}>Cobros y pagos</h1>
        <p className={agencyPageSubtitleClass}>
          Vista global por viaje y por viajero. Configura importes y vencimientos en cada programa o en la pestaña
          Pagos del viaje.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`${agencyCardClass} p-4`}>
          <p className="text-xs font-semibold uppercase text-slate-500">Cobrado (todos los viajes)</p>
          <p className="mt-2 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
            {formatMoney(totals.collected, "EUR")}
          </p>
        </div>
        <div className={`${agencyCardClass} p-4`}>
          <p className="text-xs font-semibold uppercase text-slate-500">Pendiente de cobro</p>
          <p className="mt-2 text-xl font-bold tabular-nums text-amber-800 dark:text-amber-200">
            {formatMoney(totals.pending, "EUR")}
          </p>
        </div>
        <div className={`${agencyCardClass} p-4`}>
          <p className="text-xs font-semibold uppercase text-slate-500">Viajeros al día</p>
          <p className="mt-2 text-xl font-bold tabular-nums">{totals.counts.paid ?? 0}</p>
        </div>
        <div className={`${agencyCardClass} p-4`}>
          <p className="text-xs font-semibold uppercase text-slate-500">Con pago pendiente</p>
          <p className="mt-2 text-xl font-bold tabular-nums">{totals.counts.pending ?? 0}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("trips")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            tab === "trips" ? "bg-[#1e3a5f] text-white" : "bg-white text-slate-700 dark:bg-[#0F1623] dark:text-slate-300"
          }`}
        >
          Por viaje
        </button>
        <button
          type="button"
          onClick={() => setTab("travelers")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            tab === "travelers"
              ? "bg-[#1e3a5f] text-white"
              : "bg-white text-slate-700 dark:bg-[#0F1623] dark:text-slate-300"
          }`}
        >
          Por viajero
        </button>
      </div>

      {tab === "trips" ? (
        <ul className={`${agencyCardClass} divide-y divide-slate-100 dark:divide-slate-800`}>
          {trips.length === 0 ? (
            <li className="p-4 text-sm text-slate-500">Sin viajes con viajeros o cobros configurados.</li>
          ) : (
            trips.map((t) => (
              <li key={t.tripId} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{t.tripName}</p>
                  <p className="text-xs text-slate-500">
                    {t.travelerCount} viajero{t.travelerCount === 1 ? "" : "s"} · Cobrado {t.collectedLabel} ·
                    Pendiente {t.pendingLabel}
                  </p>
                </div>
                <Link
                  href={`/trip/${t.tripId}/payments`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#152a47]"
                >
                  <CreditCard className="h-3.5 w-3.5" aria-hidden />
                  Gestionar pagos
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : (
        <ul className={`${agencyCardClass} divide-y divide-slate-100 dark:divide-slate-800`}>
          {travelers.length === 0 ? (
            <li className="p-4 text-sm text-slate-500">Añade viajeros con email en tus programas.</li>
          ) : (
            travelers.map((tr) => (
              <li key={tr.email} className="p-4">
                <p className="font-semibold text-slate-900 dark:text-white">{tr.displayName}</p>
                <p className="text-xs text-slate-500">{tr.email}</p>
                <ul className="mt-2 space-y-1.5">
                  {tr.trips.map((t) => (
                    <li key={`${tr.email}-${t.tripId}`} className="flex flex-wrap items-center gap-2 text-xs">
                      <Link href={`/trip/${t.tripId}/payments`} className="font-semibold text-[#1e3a5f] underline dark:text-sky-300">
                        {t.tripName}
                      </Link>
                      <span
                        className={`rounded px-1.5 py-0.5 font-bold ${PAYMENT_OVERALL_COLORS[t.overall as keyof typeof PAYMENT_OVERALL_COLORS] ?? "bg-slate-100"}`}
                      >
                        {t.overallLabel}
                      </span>
                      {t.collected > 0 ? (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                          Cobrado {t.collectedLabel}
                        </span>
                      ) : null}
                      {t.pending > 0 ? (
                        <span className="text-amber-700 dark:text-amber-300">
                          Pendiente {formatMoney(t.pending, "EUR")}
                        </span>
                      ) : null}
                      {t.depositDueAt ? <span className="text-slate-500">Señal: {t.depositDueAt}</span> : null}
                      {t.finalDueAt ? <span className="text-slate-500">Final: {t.finalDueAt}</span> : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
