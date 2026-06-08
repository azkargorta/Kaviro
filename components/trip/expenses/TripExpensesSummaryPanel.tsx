"use client";

import Link from "next/link";
import { Loader2, Plus, Users, Wallet } from "lucide-react";
import { useTripExpenses } from "@/hooks/useTripExpenses";
import ConvertExpenseGroupToTripPanel from "@/components/trip/ConvertExpenseGroupToTripPanel";

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export default function TripExpensesSummaryPanel({
  tripId,
  groupName,
  destination = null,
  startDate = null,
  endDate = null,
  canManageTrip = false,
}: {
  tripId: string;
  groupName: string;
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  canManageTrip?: boolean;
}) {
  const {
    loading,
    balances,
    suggestedSettlements,
    tripBaseCurrency,
    expenses,
  } = useTripExpenses(tripId);

  const currency = tripBaseCurrency || "EUR";
  const total = balances.reduce((s, b) => s + (b.paid || 0), 0);
  const pending = suggestedSettlements.filter((s) => s.status !== "paid");

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg dark:border-[#1E293B]">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Grupo de gastos</p>
        <h2 className="mt-1 text-2xl font-extrabold">{groupName}</h2>
        <p className="mt-3 text-sm text-slate-300">
          {expenses.length} gasto{expenses.length === 1 ? "" : "s"} · Total{" "}
          <span className="font-bold text-white">{formatMoney(total, currency)}</span>
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/trip/${tripId}/expenses`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--brand-hover)]"
          >
            <Plus className="h-4 w-4" />
            Añadir gasto
          </Link>
          <Link
            href={`/trip/${tripId}/participants`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
          >
            <Users className="h-4 w-4" />
            Gente
          </Link>
        </div>
      </div>

      <ConvertExpenseGroupToTripPanel
        tripId={tripId}
        groupName={groupName}
        initialDestination={destination}
        initialStartDate={startDate}
        initialEndDate={endDate}
        canManage={canManageTrip}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
          <Wallet className="h-4 w-4 text-[var(--brand)]" />
          Balances
        </div>
        {balances.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Añade el primer gasto para ver quién debe a quién.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {balances.map((b) => (
              <li
                key={b.person}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#080C14]"
              >
                <span className="font-semibold">{b.person}</span>
                <span
                  className={`font-extrabold tabular-nums ${
                    b.balance >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {b.balance >= 0 ? "+" : ""}
                  {formatMoney(b.balance, currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pending.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="text-sm font-extrabold text-amber-950 dark:text-amber-100">Pagos pendientes</p>
          <ul className="mt-3 space-y-2 text-sm">
            {pending.slice(0, 6).map((s) => (
              <li key={s.id} className="font-semibold text-amber-900 dark:text-amber-100">
                {s.debtor_name} → {s.creditor_name}: {formatMoney(s.amount, s.currency || currency)}
              </li>
            ))}
          </ul>
          {pending.length > 6 ? (
            <p className="mt-2 text-xs text-amber-800">Y {pending.length - 6} más en Gastos.</p>
          ) : null}
          <Link
            href={`/trip/${tripId}/expenses`}
            className="mt-4 inline-block text-sm font-bold text-[var(--brand)] underline"
          >
            Ver todo en Gastos →
          </Link>
        </section>
      ) : null}
    </div>
  );
}
