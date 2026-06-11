"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type {
  BalanceRow,
  PaymentMethod,
  PaymentPairRuleRow,
  PaymentPreferenceRow,
  SettlementSuggestion,
} from "@/lib/expense-balance";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  MessageCircle,
  RefreshCcw,
  Settings2,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { getBudgetProgress } from "@/lib/trip-budget-progress";
import { useIsMobile } from "@/hooks/useIsMobile";
import SettlementConfirmDialog from "@/components/trip/expenses/SettlementConfirmDialog";

function safeCurrency(currency?: string | null) {
  const code = (currency || "EUR").toUpperCase().trim();
  return /^[A-Z]{3}$/.test(code) ? code : "EUR";
}

function formatMoney(value: number, currency?: string | null) {
  const safe = safeCurrency(currency);

  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: safe,
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(value || 0);
  }
}

export type CompletedSettlement = {
  id?: string;
  debtor_name: string;
  creditor_name: string;
  amount: number;
  currency: string;
  status: string;
  paid_at?: string | null;
  payment_method?: "bizum" | "transfer" | "cash" | null;
};

type Props = {
  tripId?: string;
  budgetTarget?: number | null;
  balances: BalanceRow[];
  settlements: SettlementSuggestion[];
  /** Settlements brutos de BD (incluye pagados) para mostrar historial */
  completedSettlements?: CompletedSettlement[];
  balanceCurrency: string;
  onChangeBalanceCurrency: (value: string) => void;
  onToggleSettlementStatus: (settlement: SettlementSuggestion) => Promise<void>;
  createWhatsAppLink: (settlement: SettlementSuggestion) => string;
  settlementWarning: string | null;
  participants: string[];
  paymentPreferences: PaymentPreferenceRow[];
  onSavePaymentPreference: (participantName: string, next: { send_methods: string[]; receive_methods: string[] }) => Promise<void>;
  paymentPairRules: PaymentPairRuleRow[];
  onSavePaymentPairRule: (fromName: string, toName: string, patch: { allowed: boolean; prefer: boolean }) => Promise<void>;
  onResetPaymentPairRules: (fromName: string, toParticipantNames: string[]) => Promise<void>;
  onResetAllPaymentRules: () => Promise<void>;
  strictPaymentMethods: boolean;
  onChangeStrictPaymentMethods: (value: boolean) => void;
  onRecalculate?: () => void;
};

export default function ExpenseBalancePanel({
  balances,
  settlements,
  completedSettlements,
  balanceCurrency,
  onChangeBalanceCurrency,
  onToggleSettlementStatus,
  createWhatsAppLink,
  settlementWarning,
  participants,
  paymentPreferences,
  onSavePaymentPreference,
  paymentPairRules,
  onSavePaymentPairRule,
  onResetPaymentPairRules,
  onResetAllPaymentRules,
  strictPaymentMethods,
  onChangeStrictPaymentMethods,
  onRecalculate,
  tripId,
  budgetTarget,
}: Props) {
  const displayCurrency = safeCurrency(balanceCurrency);
  const isMobile = useIsMobile();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [balancesOpen, setBalancesOpen] = useState(false);
  const [settlementsOpen, setSettlementsOpen] = useState(false);
  const balancesRef = useRef<HTMLDivElement>(null);
  const settlementsRef = useRef<HTMLDivElement>(null);

  function toggleBalances() {
    setBalancesOpen((v) => {
      if (!v) {
        setTimeout(() => {
          balancesRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 80);
      }
      return !v;
    });
  }

  function toggleSettlements() {
    setSettlementsOpen((v) => {
      if (!v) {
        setTimeout(() => {
          settlementsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 80);
      }
      return !v;
    });
  }
  const pdfHref = tripId ? `/api/trips/${tripId}/expenses/balance-report` : null;
  const [savingPref, setSavingPref] = useState<string | null>(null);
  const [resetAllBusy, setResetAllBusy] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCopied, setBulkCopied] = useState(false);
  const [expandedPrefName, setExpandedPrefName] = useState<string | null>(null);
  const expandedPrefRef = useRef<HTMLDivElement>(null);
  const [hasPendingRecalculation, setHasPendingRecalculation] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [confirmSettlement, setConfirmSettlement] = useState<SettlementSuggestion | null>(null);
  const [confirmingSettlement, setConfirmingSettlement] = useState(false);

  const methods: Array<{ id: PaymentMethod; label: string; chip: string }> = [
    { id: "bizum", label: "Bizum", chip: "bg-emerald-50 text-emerald-900 border-emerald-200" },
    { id: "transfer", label: "Transfer", chip: "bg-sky-50 text-sky-900 border-sky-200" },
    { id: "cash", label: "Efectivo", chip: "bg-amber-50 text-amber-950 border-amber-200" },
  ];

  const prefMap = useMemo(() => {
    const map = new Map<string, PaymentPreferenceRow>();
    for (const p of paymentPreferences || []) map.set(p.participant_name, p);
    return map;
  }, [paymentPreferences]);

  const pairRuleMap = useMemo(() => {
    const map = new Map<string, PaymentPairRuleRow>();
    for (const r of paymentPairRules || []) {
      if (!r.from_participant_name || !r.to_participant_name) continue;
      map.set(`${r.from_participant_name}->${r.to_participant_name}`, r);
    }
    return map;
  }, [paymentPairRules]);

  const effectiveParticipants = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => set.add(p));
    balances.forEach((b) => set.add(b.person));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [participants, balances]);

  const totals = useMemo(() => {
    const totalPaid = balances.reduce((sum, row) => sum + (row.paid || 0), 0);
    const people = balances.length || 1;
    return {
      totalExpenses: totalPaid,
      totalPerPerson: totalPaid / people,
    };
  }, [balances]);

  const budgetProgress = useMemo(() => {
    if (budgetTarget == null || budgetTarget <= 0) return null;
    const target = budgetTarget;
    return { ...getBudgetProgress(totals.totalExpenses, target), target };
  }, [budgetTarget, totals.totalExpenses]);

  const orderedSettlements = useMemo(() => {
    // Solo pendientes — los pagados se muestran en el historial aparte
    return settlements.filter((s) => s.status !== "paid");
  }, [settlements]);

  const pendingSettlementCount = orderedSettlements.length;

  // Historial: settlements brutos de BD con status=paid
  const paidHistory = useMemo(
    () => (completedSettlements || []).filter((s) => s.status === "paid"),
    [completedSettlements]
  );

  const bulkReminders = useMemo(() => {
    const pending = orderedSettlements.filter((s) => s.status !== "paid");
    const byDebtor = new Map<string, SettlementSuggestion[]>();
    for (const s of pending) {
      const key = String(s.debtor_name || "").trim();
      if (!key) continue;
      const list = byDebtor.get(key) || [];
      list.push(s);
      byDebtor.set(key, list);
    }

    const items = Array.from(byDebtor.entries())
      .map(([debtor, list]) => {
        const total = list.reduce((sum, s) => sum + Number(s.amount || 0), 0);
        const currency = safeCurrency(list[0]?.currency || displayCurrency);

        const lines = list
          .slice()
          .sort((a, b) => String(a.creditor_name || "").localeCompare(String(b.creditor_name || "")))
          .map((s) => {
            const method =
              s.payment_method === "bizum"
                ? "Bizum"
                : s.payment_method === "transfer"
                  ? "Transferencia"
                  : s.payment_method === "cash"
                    ? "Efectivo"
                    : null;
            const methodPart = method ? ` · Método: ${method}` : "";
            return `- ${s.creditor_name}: ${formatMoney(Number(s.amount || 0), s.currency || currency)}${methodPart}`;
          })
          .join("\n");

        const text =
          `Hola ${debtor}.\n` +
          `Según el balance del viaje, tienes pagos pendientes por un total de ${formatMoney(total, currency)}.\n\n` +
          `Detalle:\n${lines}\n\n` +
          `Gracias.`;

        const link = `https://wa.me/?text=${encodeURIComponent(text)}`;
        return { debtor, total, currency, text, link, count: list.length };
      })
      .sort((a, b) => b.total - a.total);

    const allText = items
      .map((it) => `### ${it.debtor} (${formatMoney(it.total, it.currency)})\n${it.text}`)
      .join("\n\n");

    return { items, allText };
  }, [displayCurrency, orderedSettlements]);

  return (
    <div className="space-y-4">
      {pdfHref ? (
        <a
          href={pdfHref}
          {...(isMobile ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:w-auto dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200"
        >
          {isMobile ? "Ver informe de balances" : "Exportar informe (PDF / imprimir)"}
        </a>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Total gastos</p>
            <p className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
              {formatMoney(totals.totalExpenses, displayCurrency)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Media por persona</p>
            <p className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
              {formatMoney(totals.totalPerPerson, displayCurrency)}
            </p>
          </div>

          {/* Budget progress bar */}
          {budgetTarget != null && budgetTarget > 0 && totals.totalExpenses > budgetTarget * 0.8 && (
            <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
              totals.totalExpenses >= budgetTarget
                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
            }`}>
              <span className="text-lg">{totals.totalExpenses >= budgetTarget ? "🚨" : "⚠️"}</span>
              <span>
                {totals.totalExpenses >= budgetTarget
                  ? "Presupuesto superado — el grupo ha gastado más de lo previsto."
                  : `Aviso: lleváis el ${Math.round((totals.totalExpenses / budgetTarget) * 100)}% del presupuesto.`}
              </span>
            </div>
          )}

          {(budgetTarget == null || budgetTarget <= 0) && tripId ? (
            <div className="mt-3 rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Sin presupuesto objetivo definido.
              </p>
              <Link
                href={`/trip/${tripId}/settings#presupuesto`}
                className="mt-2 inline-flex text-xs font-bold text-[var(--brand)] hover:underline"
              >
                Definir en Ajustes del viaje →
              </Link>
            </div>
          ) : null}

          {budgetProgress && (
            <div className="mt-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Presupuesto objetivo</p>
                <p
                  className={`text-xs font-bold tabular-nums ${
                    budgetProgress.overBudget ? "text-rose-600 dark:text-rose-400" : "text-[var(--text-secondary)]"
                  }`}
                >
                  {budgetProgress.pct}%
                </p>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-[#1E293B] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${budgetProgress.barWidthPct}%`,
                    backgroundColor: budgetProgress.barColor,
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-[var(--text-tertiary)]">
                <span>{formatMoney(totals.totalExpenses, displayCurrency)} gastado</span>
                <span>de {formatMoney(budgetProgress.target, displayCurrency)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-200">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            <span className="text-xs text-slate-500">Moneda balance</span>
            <select
              value={displayCurrency}
              onChange={(e) => onChangeBalanceCurrency(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-900 dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
            >
              {["EUR", "USD", "GBP", "ARS", "MXN", "COP", "CLP", "JPY", "CHF"].map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
              {!["EUR", "USD", "GBP", "ARS", "MXN", "COP", "CLP", "JPY", "CHF"].includes(displayCurrency) ? (
                <option value={displayCurrency}>{displayCurrency}</option>
              ) : null}
            </select>
            </label>

            <button
              type="button"
              onClick={() => setPrefsOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
            >
              <Settings2 className="h-4 w-4" aria-hidden />
              Métodos
            </button>
          </div>
        </div>
      </div>

      {settlementWarning ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {settlementWarning}
        </div>
      ) : null}

      {prefsOpen ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-950 dark:text-white">Métodos de pago por viajero</div>
              <div className="mt-1 text-xs text-slate-600">
                Define cómo puede <span className="font-semibold">pagar</span> y <span className="font-semibold">recibir</span> cada persona.
                Si el modo estricto está activo, Kaviro solo propondrá pagos posibles.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={resetAllBusy}
                onClick={() => {
                  setResetAllBusy(true);
                  void onResetAllPaymentRules().then(() => setHasPendingRecalculation(true)).finally(() => setResetAllBusy(false));
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
              >
                {resetAllBusy ? "Restableciendo…" : "Restablecer todo"}
              </button>

              <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={strictPaymentMethods}
                  onChange={(e) => { onChangeStrictPaymentMethods(e.target.checked); setHasPendingRecalculation(true); }}
                />
                Modo estricto
              </label>
            </div>

            {hasPendingRecalculation && onRecalculate ? (
              <button
                type="button"
                disabled={recalculating}
                onClick={async () => {
                  setRecalculating(true);
                  try {
                    await onRecalculate();
                    setHasPendingRecalculation(false);
                  } finally {
                    setRecalculating(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--brand-hover)] disabled:opacity-60"
              >
                <RefreshCcw className={`h-3.5 w-3.5 ${recalculating ? "animate-spin" : ""}`} aria-hidden />
                {recalculating ? "Recalculando…" : "Recalcular pagos sugeridos"}
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3">
            {effectiveParticipants.map((name) => {
              const pref = prefMap.get(name);
              const send = pref?.send_methods?.length ? pref.send_methods : (["bizum", "transfer", "cash"] as PaymentMethod[]);
              const receive = pref?.receive_methods?.length ? pref.receive_methods : (["bizum", "transfer", "cash"] as PaymentMethod[]);
              const others = effectiveParticipants.filter((p) => p !== name);

              async function toggle(kind: "send" | "receive", method: PaymentMethod) {
                const current = kind === "send" ? send : receive;
                const next = current.includes(method) ? current.filter((m) => m !== method) : [...current, method];
                const payload = {
                  send_methods: kind === "send" ? next : send,
                  receive_methods: kind === "receive" ? next : receive,
                };
                setSavingPref(name);
                try {
                  await onSavePaymentPreference(name, payload as any);
                  setHasPendingRecalculation(true);
                } finally {
                  setSavingPref(null);
                }
              }

              async function toggleAllowed(toName: string) {
                const key = `${name}->${toName}`;
                const current = pairRuleMap.get(key);
                const allowed = current ? !current.allowed : false;
                const prefer = current?.prefer ?? false;
                setSavingPref(name);
                try {
                  await onSavePaymentPairRule(name, toName, { allowed, prefer: allowed ? prefer : false });
                  setHasPendingRecalculation(true);
                } finally {
                  setSavingPref(null);
                }
              }

              async function togglePrefer(toName: string) {
                const key = `${name}->${toName}`;
                const current = pairRuleMap.get(key);
                const allowed = current?.allowed ?? true;
                if (!allowed) return;
                const prefer = !(current?.prefer ?? false);
                setSavingPref(name);
                try {
                  await onSavePaymentPairRule(name, toName, { allowed: true, prefer });
                  setHasPendingRecalculation(true);
                } finally {
                  setSavingPref(null);
                }
              }

              async function resetAllForThisPerson() {
                setSavingPref(name);
                try {
                  await onResetPaymentPairRules(name, others);
                  setHasPendingRecalculation(true);
                } finally {
                  setSavingPref(null);
                }
              }

              const isExpanded = expandedPrefName === name;

              return (
                <div
                  key={name}
                  ref={isExpanded ? expandedPrefRef : null}
                  className="scroll-mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-[#1E293B] dark:bg-[#080C14]"
                >
                  {/* Cabecera siempre visible — click para expandir/colapsar */}
                  <button
                    type="button"
                    onClick={() => {
                      const opening = expandedPrefName !== name;
                      setExpandedPrefName(opening ? name : null);
                      if (opening) {
                        setTimeout(() => {
                          expandedPrefRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        }, 80);
                      }
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-[#1E293B]"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-[11px] font-extrabold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-950 dark:text-white">{name}</span>
                      {savingPref === name ? (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-[#1E293B] dark:text-slate-400">Guardando…</span>
                      ) : null}
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition ${isExpanded ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>

                  {isExpanded ? (
                  <div className="border-t border-slate-200 p-4 dark:border-[#1E293B]">

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Puede pagar con</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {methods.map((m) => {
                          const active = send.includes(m.id);
                          return (
                            <button
                              key={`send-${name}-${m.id}`}
                              type="button"
                              onClick={() => void toggle("send", m.id)}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                active ? m.chip : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
                              }`}
                              aria-pressed={active}
                            >
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Puede recibir por</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {methods.map((m) => {
                          const active = receive.includes(m.id);
                          return (
                            <button
                              key={`recv-${name}-${m.id}`}
                              type="button"
                              onClick={() => void toggle("receive", m.id)}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                active ? m.chip : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
                              }`}
                              aria-pressed={active}
                            >
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#1E293B] dark:bg-[#0F1623]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                        Puede pagar a
                      </div>
                      <button
                        type="button"
                        onClick={() => void resetAllForThisPerson()}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Restablecer
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {others.length ? (
                        others.map((toName) => {
                          const rule = pairRuleMap.get(`${name}->${toName}`);
                          const allowed = rule?.allowed ?? true;
                          const prefer = rule?.prefer ?? false;
                          return (
                            <div key={`${name}->${toName}`} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void toggleAllowed(toName)}
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                  allowed
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                    : "border-rose-200 bg-rose-50 text-rose-900"
                                }`}
                                title={allowed ? "Permitido (click para bloquear)" : "Bloqueado (click para permitir)"}
                              >
                                {allowed ? "✓" : "⛔"} {toName}
                              </button>
                              {allowed ? (
                                <button
                                  type="button"
                                  onClick={() => void togglePrefer(toName)}
                                  className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${
                                    prefer
                                      ? "border-[var(--brand-border)] bg-[var(--brand-light)] text-[var(--brand-text)]"
                                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
                                  }`}
                                  title={prefer ? "Preferido (click para quitar)" : "Marcar como preferido"}
                                >
                                  {prefer ? "★" : "☆"}
                                </button>
                              ) : null}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-slate-600">Añade más viajeros para configurar parejas.</div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Consejo: deja bloqueos solo cuando sea necesario. Si el modo estricto está activo y no hay forma de saldar, Kaviro te avisará.
                    </div>
                  </div>
                  </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div ref={balancesRef} className="scroll-mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
        <button
          type="button"
          onClick={toggleBalances}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={balancesOpen}
        >
          <h3 className="text-base font-semibold text-slate-950">Balance por persona</h3>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {balances.length} viajeros
            </span>
            <ChevronDown
              className={`h-5 w-5 text-slate-500 transition ${balancesOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </div>
        </button>

        {balancesOpen && balances.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
            Añade gastos para calcular balances.
          </div>
        ) : null}

        {balancesOpen && balances.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {balances.map((row) => (
              <div
                key={row.person}
                className={`overflow-hidden rounded-2xl border shadow-sm ${row.balance >= 0 ? "border-emerald-200 bg-white" : "border-rose-200 bg-white"}`}
              >
                <div className={`flex items-center justify-between gap-3 px-4 py-3 ${row.balance >= 0 ? "bg-emerald-50" : "bg-rose-50"}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${row.balance >= 0 ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"}`}>
                      {row.person.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-900 text-sm">{row.person}</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-extrabold tabular-nums ${row.balance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {row.balance >= 0 ? "+" : "-"}{formatMoney(Math.abs(row.balance), displayCurrency)}
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-wide ${row.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {row.balance >= 0 ? "Le deben" : "Debe"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
                  <div className="px-3 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ha pagado</div>
                    <div className="mt-0.5 text-sm font-bold text-slate-800 tabular-nums">{formatMoney(row.paid, displayCurrency)}</div>
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Le corresponde</div>
                    <div className="mt-0.5 text-sm font-bold text-slate-800 tabular-nums">{formatMoney(row.owed, displayCurrency)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div ref={settlementsRef} className="scroll-mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
        <button
          type="button"
          onClick={toggleSettlements}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={settlementsOpen}
        >
          <h3 className="text-base font-semibold text-slate-950">Pagos a realizar</h3>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {pendingSettlementCount > 0 ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                {pendingSettlementCount} pendiente{pendingSettlementCount !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {orderedSettlements.length} movimientos
              </span>
            )}
            <ChevronDown
              className={`h-5 w-5 text-slate-500 transition ${settlementsOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </div>
        </button>

        {settlementsOpen ? (
          <>
            {bulkReminders.items.length ? (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setBulkOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  title="Generar avisos para todos los deudores"
                >
                  <Users className="h-4 w-4" aria-hidden />
                  Cobrar a todos
                </button>
              </div>
            ) : null}

        {bulkOpen && bulkReminders.items.length ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-950 dark:text-white">Avisos por WhatsApp</div>
                <div className="mt-1 text-xs text-slate-600">
                  Genera un mensaje por deudor con el total pendiente. Puedes copiar todo o abrir WhatsApp por persona.
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(bulkReminders.allText);
                    setBulkCopied(true);
                    window.setTimeout(() => setBulkCopied(false), 1500);
                  } catch {
                    // ignore
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                title="Copiar todos los mensajes"
              >
                <Copy className="h-4 w-4" aria-hidden />
                {bulkCopied ? "Copiado" : "Copiar todo"}
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {bulkReminders.items.map((it) => (
                <div key={it.debtor} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-950 dark:text-white">{it.debtor}</div>
                      <div className="mt-1 text-xs text-slate-600">{it.count} pagos · Total {formatMoney(it.total, it.currency)}</div>
                    </div>
                    <a
                      href={it.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                      title="Abrir mensaje en WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      WhatsApp
                    </a>
                  </div>

                  <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
{it.text}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {orderedSettlements.length === 0 && paidHistory.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500 dark:border-slate-700/50">
            No hay liquidaciones pendientes.
          </div>
        ) : null}

        {/* Pagos pendientes */}
        {orderedSettlements.length > 0 ? (
          <div className="mt-4 space-y-3">
            {orderedSettlements.map((s) => {
              const methodLabel =
                s.payment_method === "bizum" ? "Bizum" : s.payment_method === "transfer" ? "Transferencia" : s.payment_method === "cash" ? "Efectivo" : null;
              return (
                <div key={s.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1E293B] dark:bg-[#080C14]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-slate-950 dark:text-white">{s.debtor_name}</span>{" "}
                        <span>debe a</span>{" "}
                        <span className="font-semibold text-slate-950 dark:text-white">{s.creditor_name}</span>
                      </div>
                      <div className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                        {formatMoney(s.amount, s.currency || displayCurrency)}
                      </div>
                      {methodLabel ? (
                        <div className="mt-2">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            Método: {methodLabel}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                      <Clock className="h-4 w-4" aria-hidden />
                      Pendiente
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmSettlement(s)}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200"
                    >
                      <CheckCircle2 className="mr-1.5 inline h-4 w-4" aria-hidden />
                      Marcar realizado
                    </button>
                    <a
                      href={createWhatsAppLink(s)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800/50 dark:bg-slate-900 dark:text-emerald-300"
                      title="Enviar aviso por WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      WhatsApp
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Historial de pagos realizados */}
        {paidHistory.length > 0 ? (
          <>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200 dark:border-slate-700/50" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Historial de pagos
              </span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-700/50" />
            </div>
            <div className="mt-3 space-y-2">
              {paidHistory.map((s, i) => {
                const methodLabel =
                  s.payment_method === "bizum"
                    ? "Bizum"
                    : s.payment_method === "transfer"
                    ? "Transferencia"
                    : s.payment_method === "cash"
                    ? "Efectivo"
                    : null;
                const paidDate = s.paid_at
                  ? new Date(s.paid_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : null;
                return (
                  <div
                    key={s.id || i}
                    className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/60 px-4 py-3 dark:border-emerald-800/30 dark:bg-emerald-950/20"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-white">{s.debtor_name}</span>
                        {" "}le pagó a{" "}
                        <span className="font-semibold text-slate-900 dark:text-white">{s.creditor_name}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                          {formatMoney(s.amount, s.currency || displayCurrency)}
                        </span>
                        {methodLabel ? (
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            {methodLabel}
                          </span>
                        ) : null}
                      </div>
                      {paidDate ? (
                        <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                          Realizado el {paidDate}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                      <button
                        type="button"
                        onClick={() => void onToggleSettlementStatus(s as unknown as SettlementSuggestion)}
                        className="text-[11px] font-semibold text-slate-400 underline hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                      >
                        Deshacer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
          </>
        ) : null}
      </div>

      <SettlementConfirmDialog
        open={Boolean(confirmSettlement)}
        debtorName={confirmSettlement?.debtor_name || ""}
        creditorName={confirmSettlement?.creditor_name || ""}
        amountLabel={
          confirmSettlement
            ? formatMoney(confirmSettlement.amount, confirmSettlement.currency || displayCurrency)
            : ""
        }
        confirming={confirmingSettlement}
        onCancel={() => {
          if (!confirmingSettlement) setConfirmSettlement(null);
        }}
        onConfirm={() => {
          if (!confirmSettlement) return;
          setConfirmingSettlement(true);
          void onToggleSettlementStatus(confirmSettlement)
            .then(() => setConfirmSettlement(null))
            .finally(() => setConfirmingSettlement(false));
        }}
      />
    </div>
  );
}
