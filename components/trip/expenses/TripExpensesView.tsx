"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ExpenseForm from "@/components/trip/expenses/ExpenseForm";
import ExpenseList from "@/components/trip/expenses/ExpenseList";
import ExpenseBalancePanel from "@/components/trip/expenses/ExpenseBalancePanel";
import CurrencyConverterCard from "@/components/trip/expenses/CurrencyConverterCard";
import ExpenseAnalyzerPanel, { type ExpenseDetectedData } from "@/components/trip/expenses/ExpenseAnalyzerPanel";
import ExpenseCharts from "@/components/trip/expenses/ExpenseCharts";
import { useIsDemoTrip } from "@/components/trip/TripDemoContext";
import { useTripExpenses } from "@/hooks/useTripExpenses";
import { useTripData } from "@/hooks/useTripData";
import { parseTripBudgetTarget } from "@/lib/parse-trip-budget";
import {
  BarChart3,
  ChevronDown,
  Clock,
  Download,
  HelpCircle,
  MoreHorizontal,
  Plus,
  ScanText,
  Wallet,
  X,
} from "lucide-react";
import PremiumUpsell from "@/components/premium/PremiumUpsell";
import TripReadOnlyBanner from "@/components/trip/common/TripReadOnlyBanner";
import { SkeletonCard } from "@/components/ui/Skeleton";
import Reveal from "@/components/ui/Reveal";
import MobileBottomSheet from "@/components/ui/MobileBottomSheet";
import ExpenseBalanceCompact from "@/components/trip/expenses/ExpenseBalanceCompact";
import { useIsMobile } from "@/hooks/useIsMobile";
export default function TripExpensesView({
  tripId,
  isPremium = true,
  canManageExpenses = true,
  budgetTarget: budgetTargetFromServer = null,
  isExpenseGroup = false,
}: {
  tripId: string;
  isPremium?: boolean;
  canManageExpenses?: boolean;
  /** Presupuesto cargado en servidor (Ajustes); evita depender solo del cliente. */
  budgetTarget?: number | null;
  /** True cuando el viaje es un grupo de gastos (trip_mode = 'expenses'). */
  isExpenseGroup?: boolean;
}) {
  const {
    expenses,
    settlements: rawSettlements,
    registeredTravelers,
    tripBaseCurrency,
    participants,
    balances,
    suggestedSettlements,
    settlementWarning,
    paymentPreferences,
    savePaymentPreference,
    paymentPairRules,
    savePaymentPairRule,
    resetPaymentPairRules,
    resetAllPaymentRules,
    strictPaymentMethods,
    setStrictPaymentMethods,
    balanceCurrency,
    setBalanceCurrency,
    loading,
    saving,
    error,
    reload,
    createExpense,
    updateExpense,
    deleteExpense,
    toggleSettlementStatus,
    convertAmount,
    createWhatsAppLink,
  } = useTripExpenses(tripId);

  const { trip: tripMeta } = useTripData(tripId);

  const budgetTarget = useMemo(() => {
    const fromClient = parseTripBudgetTarget(tripMeta?.budget_target);
    return fromClient ?? budgetTargetFromServer;
  }, [tripMeta?.budget_target, budgetTargetFromServer]);

  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [detectedData, setDetectedData] = useState<ExpenseDetectedData | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const isDemoTrip = useIsDemoTrip();

  const [isAnalyzeOpen, setIsAnalyzeOpen] = useState(false);
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const isMobile = useIsMobile();

  // Auto-open all sections for demo trip
  useEffect(() => {
    if (isDemoTrip) {
      setIsConverterOpen(true);
      setIsListOpen(true);
    }
  }, [isDemoTrip]);

  useEffect(() => {
    if (isMobile) setIsListOpen(true);
  }, [isMobile]);

  const [exportOpen, setExportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "charts">("list");
  type MobileExpensesPanel = null | "menu" | "analyze" | "converter" | "export" | "history" | "balances";
  const [mobilePanel, setMobilePanel] = useState<MobileExpensesPanel>(null);
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [myDisplayName, setMyDisplayName] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (isExpenseGroup) {
      const dismissed = localStorage.getItem(`kaviro_eg_ob_${tripId}`);
      if (!dismissed) setShowOnboarding(true);
    }
    // Recuperar nombre guardado de sesiones anteriores
    const stored = localStorage.getItem(`kaviro_myname_${tripId}`);
    if (stored) setMyDisplayName(stored);
  }, [isExpenseGroup, tripId]);

  function selectMyName(name: string) {
    localStorage.setItem(`kaviro_myname_${tripId}`, name);
    setMyDisplayName(name);
  }

  const myBalance: number | null = useMemo(() => {
    if (!myDisplayName) return null;
    const entry = (balances as any[]).find(
      (b: any) => (b.person ?? "").toLowerCase() === myDisplayName.toLowerCase()
    );
    return entry != null ? (entry.balance ?? null) : null;
  }, [balances, myDisplayName]);

  function dismissOnboarding() {
    localStorage.setItem(`kaviro_eg_ob_${tripId}`, "1");
    setShowOnboarding(false);
  }

  const shouldShowForm =
    canManageExpenses && (isAddOpen || !!editingExpense || !!detectedData);
  const showAnalyzePanel = canManageExpenses && isAnalyzeOpen;

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      if (!historyOpen) return;
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const resp = await fetch(
          `/api/trip-audit?tripId=${encodeURIComponent(tripId)}&entityType=expense&limit=40`,
          { cache: "no-store" }
        );
        const payload = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(payload?.error || "No se pudo cargar el historial.");
        if (!cancelled) setHistory(Array.isArray(payload?.logs) ? payload.logs : []);
      } catch (e) {
        if (!cancelled) setHistoryError(e instanceof Error ? e.message : "No se pudo cargar el historial.");
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }
    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [historyOpen, tripId]);

  function csvEscape(value: unknown, delimiter: string) {
    const text = String(value ?? "");
    const needsQuotes =
      text.includes('"') || text.includes("\n") || text.includes("\r") || text.includes(delimiter);
    const escaped = text.replaceAll(`"`, `""`);
    return needsQuotes ? `"${escaped}"` : escaped;
  }

  function downloadCsv(
    filename: string,
    rows: Array<Record<string, unknown>>,
    options?: { delimiter?: string }
  ) {
    const delimiter = options?.delimiter || ";";
    const headers = rows.length ? Object.keys(rows[0]) : [];
    const lines = [
      headers.map((h) => csvEscape(h, delimiter)).join(delimiter),
      ...rows.map((r) => headers.map((h) => csvEscape((r as any)[h], delimiter)).join(delimiter)),
    ].join("\r\n");

    // BOM UTF-8 para que Excel detecte bien acentos y separador
    const blob = new Blob(["\uFEFF", lines], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function closeMobilePanel() {
    setMobilePanel(null);
    setIsAnalyzeOpen(false);
    setIsConverterOpen(false);
    setExportOpen(false);
    setHistoryOpen(false);
  }

  function openMobilePanel(panel: Exclude<MobileExpensesPanel, null | "menu">) {
    setMobilePanel(panel);
    if (panel === "analyze") setIsAnalyzeOpen(true);
    if (panel === "converter") setIsConverterOpen(true);
    if (panel === "export") setExportOpen(true);
    if (panel === "history") setHistoryOpen(true);
  }

  const exportPanelBody = (
    <>
      <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
        Descarga un CSV para contabilidad o para compartir con el grupo.
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const rows = (expenses || []).map((e: any) => ({
              "Nombre del gasto": e.title || "",
              Fecha: e.expense_date || "",
              Cantidad: `${Number(e.amount || 0).toFixed(2)} ${String(e.currency || "").toUpperCase()}`.trim(),
              "Pagado por": e.payer_name || "",
              "Repartir pago entre": Array.isArray(e.owed_by_names) ? e.owed_by_names.join(" | ") : "",
              Categoría: e.category || "",
            }));
            downloadCsv(`trip-${tripId}-gastos.csv`, rows, { delimiter: ";" });
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          Descargar gastos.csv
        </button>
        <button
          type="button"
          onClick={() => {
            const rows = (suggestedSettlements || []).map((s: any) => ({
              id: s.id || "",
              deudor: s.debtor_name || "",
              acreedor: s.creditor_name || "",
              importe: Number(s.amount || 0),
              moneda: s.currency || "",
              estado: s.status || "pending",
              metodo: s.payment_method || "",
            }));
            downloadCsv(`trip-${tripId}-pagos.csv`, rows, { delimiter: ";" });
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          Descargar pagos.csv
        </button>
      </div>
    </>
  );

  const historyPanelBody = (
    <>
      <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
        Quién creó/editó/eliminó gastos recientemente.
      </div>
      {historyLoading ? (
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">Cargando historial…</div>
      ) : historyError ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {historyError}
        </div>
      ) : history.length ? (
        <div className="mt-4 space-y-2">
          {history.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-950 dark:text-white">
                    {item.summary || `${item.action} ${item.entity_type}`}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {(item.actor_email || "Alguien")} · {new Date(item.created_at).toLocaleString("es-ES")}
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {item.action}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">Todavía no hay cambios registrados.</div>
      )}
    </>
  );

  useEffect(() => {
    if (editingExpense || detectedData) {
      setIsAddOpen(true);
    }
  }, [editingExpense, detectedData]);

  useEffect(() => {
    if (editingExpense) {
      setIsAnalyzeOpen(false);
    }
  }, [editingExpense]);

  const topButtons = useMemo(() => {
    const base =
      "btn-press inline-flex min-w-0 max-w-full items-center justify-center gap-2 whitespace-normal rounded-full border bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-border)] sm:px-4";
    const primary = `${base} border-[var(--brand-border)] text-[var(--brand-text)] hover:border-[var(--brand)] hover:bg-[var(--brand-light)]`;
    const secondary = `${base} border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50`;

    return (
      <div data-tour="expenses-toolbar" className="flex min-w-0 max-w-full flex-wrap gap-2">
        <button
          type="button"
          className={secondary}
          onClick={() => setHistoryOpen((v) => !v)}
          title="Ver historial de cambios"
        >
          <Clock className="h-4 w-4" aria-hidden />
          Historial
        </button>
        <button
          type="button"
          className={secondary}
          onClick={() => setExportOpen((v) => !v)}
          title="Exportar gastos y pagos"
        >
          <Download className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Exportar</span> CSV
        </button>
        {canManageExpenses ? (
          <>
            <button
              type="button"
              className={`${primary} hidden md:inline-flex`}
              onClick={() => {
                setIsAddOpen((v) => !v);
                setIsAnalyzeOpen(false);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {shouldShowForm ? "Cerrar añadir" : "Añadir ticket"}
            </button>
            <button
              type="button"
              className={secondary}
              onClick={() => {
                if (!isPremium) return;
                setIsAnalyzeOpen((v) => !v);
                if (!isAnalyzeOpen) setIsAddOpen(false);
              }}
              disabled={!isPremium}
            >
              <ScanText className="h-4 w-4" aria-hidden />
              {isAnalyzeOpen ? "Cerrar análisis" : "Analizar ticket"}
            </button>
          </>
        ) : null}
      </div>
    );
  }, [canManageExpenses, isAnalyzeOpen, shouldShowForm, isPremium]);

  if (loading) {
    return (
      <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden" aria-busy="true" aria-label="Cargando gastos">
        <SkeletonCard rows={2} />
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonCard rows={4} />
          <SkeletonCard rows={3} />
        </div>
        <SkeletonCard rows={2} />
        <SkeletonCard rows={2} />
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden pb-20 md:pb-0">
      {!canManageExpenses ? <TripReadOnlyBanner moduleLabel="gastos" /> : null}

      {/* Panel de onboarding — solo grupos de gastos */}
      {isExpenseGroup && showOnboarding ? (
        <div className="rounded-2xl border border-[color:var(--brand-border)] bg-[var(--brand-light)] p-5 dark:border-[color:var(--brand-border)] dark:bg-[var(--brand-light)]/10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                ¿Cómo funciona tu grupo de gastos?
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Todo lo que puedes hacer desde esta sección
              </p>
            </div>
            <button
              type="button"
              onClick={dismissOnboarding}
              className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-white/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Cerrar guía"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "⚖️",
                title: "Balances automáticos",
                desc: "Kaviro calcula quién ha pagado más y quién debe dinero al registrar cada gasto.",
                pro: false,
                href: null,
              },
              {
                icon: "🔄",
                title: "Pagos sugeridos",
                desc: "Obtén la lista exacta de transferencias que saldan todas las deudas con el mínimo de movimientos.",
                pro: false,
                href: null,
              },
              {
                icon: "💬",
                title: "Compartir por WhatsApp",
                desc: "Envía el resumen de lo que cada persona debe directamente por WhatsApp con un clic.",
                pro: false,
                href: null,
              },
              {
                icon: "🤖",
                title: "Analizar ticket con IA",
                desc: "Sube una foto o PDF de un recibo y Kaviro rellena automáticamente el gasto.",
                pro: true,
                href: null,
              },
              {
                icon: "🗺️",
                title: "Convertir a viaje completo",
                desc: "¿Quieres planificar también el itinerario? Convierte este grupo en un viaje sin perder los gastos.",
                pro: false,
                href: null,
              },
              {
                icon: "👥",
                title: "Invitar personas",
                desc: "Comparte el grupo con tus compañeros para que puedan ver y añadir sus propios gastos.",
                pro: false,
                href: `/trip/${tripId}/participants`,
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="flex flex-col gap-1 rounded-xl border border-white/70 bg-white/60 p-3 dark:border-slate-700/50 dark:bg-slate-900/40"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{feat.icon}</span>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">
                    {feat.title}
                  </span>
                  {feat.pro && !isPremium ? (
                    <span className="ml-auto shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      PRO
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {feat.desc}
                </p>
                {feat.href ? (
                  <a
                    href={feat.href}
                    className="mt-auto pt-1 text-[11px] font-semibold text-[var(--brand-text)] hover:underline"
                  >
                    Ir a Personas →
                  </a>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Puedes volver a ver esta guía desde el botón <HelpCircle className="inline h-3 w-3" aria-hidden /> de la cabecera.
            </p>
            <button
              type="button"
              onClick={dismissOnboarding}
              className="shrink-0 text-[11px] font-semibold text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Ya lo entendí, cerrar
            </button>
          </div>
        </div>
      ) : isExpenseGroup ? (
        <div className="hidden md:flex justify-end">
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm transition hover:border-[color:var(--brand-border)] hover:text-[var(--brand-text)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden />
            ¿Cómo funciona?
          </button>
        </div>
      ) : null}

      {/* Cabecera: tabs + botones de acción (inline en escritorio) */}
      <div className="flex items-center gap-2">
        <div className="inline-flex flex-1 rounded-xl bg-slate-100 p-1 gap-1 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`inline-flex min-h-[34px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition sm:flex-none sm:px-4 ${
              activeTab === "list"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Lista
            {activeTab === "list" && expenses.length > 0 && (
              <span className="rounded-full bg-[var(--brand-light)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--brand-text)]">
                {expenses.length}
              </span>
            )}
          </button>
          <button
            data-tour="expenses-stats-btn"
            type="button"
            onClick={() => setActiveTab("charts")}
            className={`inline-flex min-h-[34px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition sm:flex-none sm:px-4 ${
              activeTab === "charts"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <span className="md:hidden">📊</span>
            <span className="hidden md:inline">📊 Estadísticas</span>
            <span className="md:hidden">Stats</span>
          </button>
        </div>

        {/* Botones de acción — solo escritorio, inline con los tabs */}
        <div className="hidden md:flex min-w-0 items-center gap-2 shrink-0">
          {topButtons}
        </div>

        {/* Menú móvil — solo móvil */}
        <button
          type="button"
          onClick={() => setMobilePanel("menu")}
          className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          aria-label="Más opciones"
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Franja de estadísticas — solo escritorio */}
      {expenses.length > 0 ? (() => {
        const currency = balanceCurrency || tripBaseCurrency || "EUR";
        let balanceValue = "";
        let balanceClass = "text-slate-900 dark:text-white";
        if (myBalance !== null) {
          try {
            const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 2 }).format(Math.abs(myBalance));
            balanceValue = myBalance >= 0 ? `+${fmt}` : `-${fmt}`;
          } catch {
            balanceValue = `${myBalance >= 0 ? "+" : ""}${myBalance.toFixed(2)} ${currency}`;
          }
          balanceClass = myBalance > 0 ? "text-emerald-700 dark:text-emerald-400" : myBalance < 0 ? "text-rose-700 dark:text-rose-400" : "text-slate-900 dark:text-white";
        }
        const totalAmt = (expenses as any[]).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
        return (
          <div className="hidden md:grid md:grid-cols-4 md:divide-x md:divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 dark:divide-slate-700/60 dark:border-slate-700/50">
            {/* Gastos registrados */}
            <div className="flex flex-col gap-0.5 bg-white px-5 py-3.5 dark:bg-[var(--surface-card)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">🧾 Gastos registrados</p>
              <p className="text-lg font-extrabold leading-tight text-slate-900 dark:text-white">{expenses.length}</p>
            </div>
            {/* Importe total */}
            <div className="flex flex-col gap-0.5 bg-white px-5 py-3.5 dark:bg-[var(--surface-card)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">💰 Importe total</p>
              <p className="text-lg font-extrabold leading-tight text-slate-900 dark:text-white">
                {totalAmt.toLocaleString("es-ES", { maximumFractionDigits: 2 })} {tripBaseCurrency || "EUR"}
              </p>
            </div>
            {/* Tu balance — con selector si aún no se sabe quién eres */}
            <div className="flex flex-col gap-0.5 bg-white px-5 py-3.5 dark:bg-[var(--surface-card)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                {myBalance === null ? "👤" : myBalance >= 0 ? "💚" : "🔴"} Tu balance
              </p>
              {myDisplayName === null ? (
                <select
                  defaultValue=""
                  onChange={(e) => { if (e.target.value) selectMyName(e.target.value); }}
                  className="mt-0.5 w-full rounded-lg border border-slate-200 bg-slate-50 py-1 pl-2 pr-6 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[var(--brand-border)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="" disabled>¿Cuál es tu nombre?</option>
                  {(participants as string[]).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-baseline gap-2">
                  <p className={`text-lg font-extrabold leading-tight ${balanceClass}`}>{balanceValue}</p>
                  <button
                    type="button"
                    onClick={() => { localStorage.removeItem(`kaviro_myname_${tripId}`); setMyDisplayName(null); }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    title="Cambiar persona"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            {/* Pagos sugeridos */}
            <div className="flex flex-col gap-0.5 bg-white px-5 py-3.5 dark:bg-[var(--surface-card)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">🔄 Pagos sugeridos</p>
              <p className="text-lg font-extrabold leading-tight text-slate-900 dark:text-white">{(suggestedSettlements as any[]).length}</p>
            </div>
          </div>
        );
      })() : null}

      {activeTab === "charts" ? (
        <div key="charts" className="step-enter">
          <ExpenseCharts expenses={expenses} baseCurrency={tripBaseCurrency || "EUR"} />
        </div>
      ) : null}

      <div key="list" className={`step-enter ${activeTab !== "list" ? "hidden" : ""}`}>
      {error ? (
        <div className="break-words rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="font-semibold">No se pudieron cargar bien los gastos.</div>
          <div className="mt-1">{error}</div>
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {expenses.length === 0 && !shouldShowForm && !isAnalyzeOpen ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 py-5 text-sm text-slate-600 backdrop-blur-sm dark:border-[color:var(--brand-border)] dark:bg-[var(--surface-page)]/35 dark:text-slate-300">
            <div className="font-semibold text-slate-800 dark:text-slate-50">Aún no hay gastos</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Añade el primer ticket para ver balances automáticos y quién debe a quién.
            </div>
            {canManageExpenses ? (
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(true);
                  setIsAnalyzeOpen(false);
                }}
                className="btn-press mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[var(--brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-border)]"
              >
                Añadir ticket
              </button>
            ) : null}
          </div>
        ) : null}

      {!isPremium ? <div className="hidden md:block"><PremiumUpsell feature="expenseOcr" /></div> : null}

      {exportOpen && !isMobile ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700/50 dark:bg-gradient-to-br dark:from-slate-950/70 dark:via-slate-900/55 dark:to-slate-950/70">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">Exportar</div>
            <button
              type="button"
              onClick={() => setExportOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
          {exportPanelBody}
        </div>
      ) : null}

      {historyOpen && !isMobile ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700/50 dark:bg-gradient-to-br dark:from-slate-950/70 dark:via-slate-900/55 dark:to-slate-950/70">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="text-sm font-semibold text-slate-950 dark:text-white">Historial de cambios</div>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
          {historyPanelBody}
        </div>
      ) : null}

      {/* Balance compacto — solo móvil; en escritorio el panel completo está en la columna derecha */}
      <div className="md:hidden">
        <ExpenseBalanceCompact
          balances={balances}
          settlements={suggestedSettlements}
          balanceCurrency={balanceCurrency}
          createWhatsAppLink={createWhatsAppLink}
          onOpenAdvanced={() => openMobilePanel("balances")}
        />
      </div>

      <div className="grid min-w-0 max-w-full gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.5fr)]">
        <div className="min-w-0 space-y-4">
          {canManageExpenses ? (
          <details
            className="hidden rounded-2xl border border-slate-200 bg-white shadow-sm open:shadow-md dark:border-slate-700/50 dark:bg-gradient-to-br dark:from-slate-950/70 dark:via-slate-900/55 dark:to-slate-950/70 md:block"
            open={showAnalyzePanel}
            onToggle={(e) => setIsAnalyzeOpen((e.currentTarget as HTMLDetailsElement).open)}
          >
            <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-4 hover:bg-violet-50/40 dark:hover:bg-slate-900/40 sm:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <ScanText className="h-4 w-4 shrink-0 text-slate-700" aria-hidden />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-950">Analizar ticket</div>
                  <div className="text-xs text-slate-600">Sube un PDF/imagen y rellena el gasto automáticamente.</div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" aria-hidden />
            </summary>
            <div className="border-t border-slate-200 px-5 py-5">
              {isPremium ? (
                <ExpenseAnalyzerPanel
                  tripBaseCurrency={tripBaseCurrency || "EUR"}
                  onUseDetectedData={(data) => {
                    setDetectedData(data);
                    setIsAnalyzeOpen(false);
                    setIsAddOpen(true);
                  }}
                />
              ) : (
                <PremiumUpsell feature="expenseOcr" showTripCoopHint={false} />
              )}
            </div>
          </details>
          ) : null}

          {canManageExpenses ? (
          <details
            className="hidden rounded-2xl border border-slate-200 bg-white shadow-sm open:shadow-md dark:border-slate-700/50 dark:bg-gradient-to-br dark:from-slate-950/70 dark:via-slate-900/55 dark:to-slate-950/70 md:block"
            open={shouldShowForm}
            onToggle={(e) => {
              const open = (e.currentTarget as HTMLDetailsElement).open;
              setIsAddOpen(open);
              if (!open) {
                setEditingExpense(null);
                setDetectedData(null);
              }
            }}
          >
            <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 sm:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Plus className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-950">{editingExpense ? "Editar gasto" : "Añadir gasto"}</div>
                  <div className="text-xs text-slate-600">Define importe, participantes, categoría y notas.</div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" aria-hidden />
            </summary>
            <div className="border-t border-slate-200 px-5 py-5">
              <ExpenseForm
                saving={saving}
                existingParticipants={participants}
                registeredTravelers={registeredTravelers}
                baseCurrency={tripBaseCurrency || "EUR"}
                isPremium={isPremium}
                editingExpense={editingExpense}
                detectedData={detectedData}
                onCancelEdit={() => {
                  setEditingExpense(null);
                  setDetectedData(null);
                  setIsAddOpen(false);
                }}
                onSubmit={async (input) => {
                  if (editingExpense?.id) {
                    await updateExpense(editingExpense.id, input, editingExpense);
                    setEditingExpense(null);
                  } else {
                    await createExpense(input);
                  }
                  setDetectedData(null);
                  setIsAddOpen(false);
                }}
              />
            </div>
          </details>
          ) : null}

          <details
            data-tour="expenses-currency-details"
            className="hidden rounded-2xl border border-slate-200 bg-white shadow-sm open:shadow-md dark:border-slate-700/50 dark:bg-gradient-to-br dark:from-slate-950/70 dark:via-slate-900/55 dark:to-slate-950/70 md:block"
            open={isConverterOpen}
            onToggle={(e) => setIsConverterOpen((e.currentTarget as HTMLDetailsElement).open)}
          >
            <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-4 hover:bg-violet-50/40 dark:hover:bg-slate-900/40 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-950">Convertidor de moneda</div>
                <div className="text-xs text-slate-600">Convierte importes y ajusta la moneda de balance.</div>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" aria-hidden />
            </summary>
            <div className="border-t border-slate-200 px-5 py-5">
              <CurrencyConverterCard
                onConvert={convertAmount}
                balanceCurrency={balanceCurrency}
                onChangeBalanceCurrency={setBalanceCurrency}
              />
            </div>
          </details>

          <div className="md:hidden" data-tour="expenses-list-mobile">
            <ExpenseList
              compact
              expenses={expenses as any}
              onEdit={
                canManageExpenses
                  ? (expense) => {
                      setEditingExpense(expense);
                      setDetectedData(null);
                      setIsAddOpen(true);
                    }
                  : undefined
              }
              onDuplicate={
                canManageExpenses
                  ? (expense) => {
                      setEditingExpense({
                        ...expense,
                        id: undefined,
                        attachment_name: null,
                      });
                      setDetectedData(null);
                      setIsAddOpen(true);
                    }
                  : undefined
              }
              onDelete={canManageExpenses ? deleteExpense : undefined}
            />
          </div>

          <details
            data-tour="expenses-list-details"
            className="group hidden rounded-2xl border border-slate-200 bg-white shadow-sm open:shadow-md dark:border-slate-700/50 dark:bg-gradient-to-br dark:from-slate-950/70 dark:via-slate-900/55 dark:to-slate-950/70 md:block"
            open={isListOpen}
            onToggle={(e) => setIsListOpen((e.currentTarget as HTMLDetailsElement).open)}
          >
            <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-4 hover:bg-violet-50/40 dark:hover:bg-slate-900/40 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-950">Listado de gastos</div>
                <div className="mt-1 text-xs text-slate-600">Edita, elimina y revisa todos los tickets registrados.</div>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" aria-hidden />
            </summary>
            <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
              <ExpenseList
                expenses={expenses as any}
                onEdit={
                  canManageExpenses
                    ? (expense) => {
                        setEditingExpense(expense);
                        setDetectedData(null);
                        setIsAddOpen(true);
                      }
                    : undefined
                }
                onDuplicate={
                  canManageExpenses
                    ? (expense) => {
                        setEditingExpense({
                          ...expense,
                          id: undefined,
                          attachment_name: null,
                        });
                        setDetectedData(null);
                        setIsAddOpen(true);
                      }
                    : undefined
                }
                onDelete={canManageExpenses ? deleteExpense : undefined}
              />
            </div>
          </details>
        </div>

        <div className="hidden min-w-0 space-y-4 md:block">
          <Reveal variant="fade" delay={1} data-tour="expenses-balance-panel" className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/50 dark:bg-gradient-to-br dark:from-slate-950/70 dark:via-slate-900/55 dark:to-slate-950/70">
            <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-4 dark:border-slate-700/50 dark:bg-slate-900/45">
              <div className="text-sm font-semibold text-slate-950">Balances y pagos</div>
              <div className="mt-1 text-xs text-slate-600">Quién debe a quién y enlaces rápidos por WhatsApp.</div>
            </div>
            <div className="px-4 py-4">
              <ExpenseBalancePanel
                tripId={tripId}
                balances={balances}
                settlements={suggestedSettlements}
                completedSettlements={rawSettlements}
                balanceCurrency={balanceCurrency}
                onChangeBalanceCurrency={setBalanceCurrency}
                onToggleSettlementStatus={toggleSettlementStatus}
                createWhatsAppLink={createWhatsAppLink}
                settlementWarning={settlementWarning}
                participants={participants}
                paymentPreferences={paymentPreferences}
                onSavePaymentPreference={savePaymentPreference}
                paymentPairRules={paymentPairRules}
                onSavePaymentPairRule={savePaymentPairRule}
                onResetPaymentPairRules={resetPaymentPairRules}
                budgetTarget={budgetTarget}
                onResetAllPaymentRules={() => resetAllPaymentRules(participants)}
                strictPaymentMethods={strictPaymentMethods}
                onChangeStrictPaymentMethods={setStrictPaymentMethods}
              />
            </div>
          </Reveal>
        </div>
      </div>

      </div>

      <MobileBottomSheet
        open={isMobile && mobilePanel === "menu"}
        onClose={() => setMobilePanel(null)}
        title="Más opciones"
      >
        <div className="space-y-1">
          {canManageExpenses ? (
            <button
              type="button"
              onClick={() => openMobilePanel("analyze")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
            >
              <ScanText className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
              Analizar ticket
              {!isPremium ? (
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">PRO</span>
              ) : null}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => openMobilePanel("converter")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
          >
            <Wallet className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
            Convertidor de moneda
          </button>
          <button
            type="button"
            onClick={() => openMobilePanel("history")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
          >
            <Clock className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
            Historial de cambios
          </button>
          <button
            type="button"
            onClick={() => openMobilePanel("export")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("charts");
              setMobilePanel(null);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
          >
            <BarChart3 className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
            Ver estadísticas
          </button>
          <button
            type="button"
            onClick={() => openMobilePanel("balances")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
          >
            <Wallet className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden />
            Balances y opciones avanzadas
          </button>
        </div>
      </MobileBottomSheet>

      <MobileBottomSheet
        open={isMobile && mobilePanel === "analyze"}
        onClose={closeMobilePanel}
        title="Analizar ticket"
      >
        {isPremium ? (
          <ExpenseAnalyzerPanel
            tripBaseCurrency={tripBaseCurrency || "EUR"}
            onUseDetectedData={(data) => {
              setDetectedData(data);
              closeMobilePanel();
              setIsAddOpen(true);
            }}
          />
        ) : (
          <PremiumUpsell feature="expenseOcr" showTripCoopHint={false} />
        )}
      </MobileBottomSheet>

      <MobileBottomSheet
        open={isMobile && mobilePanel === "converter"}
        onClose={closeMobilePanel}
        title="Convertidor de moneda"
      >
        <CurrencyConverterCard
          onConvert={convertAmount}
          balanceCurrency={balanceCurrency}
          onChangeBalanceCurrency={setBalanceCurrency}
        />
      </MobileBottomSheet>

      <MobileBottomSheet
        open={isMobile && mobilePanel === "export"}
        onClose={closeMobilePanel}
        title="Exportar"
      >
        {exportPanelBody}
      </MobileBottomSheet>

      <MobileBottomSheet
        open={isMobile && mobilePanel === "history"}
        onClose={closeMobilePanel}
        title="Historial de cambios"
      >
        {historyPanelBody}
      </MobileBottomSheet>

      <MobileBottomSheet
        open={isMobile && mobilePanel === "balances"}
        onClose={() => setMobilePanel(null)}
        title="Balances y opciones"
      >
        <ExpenseBalancePanel
          tripId={tripId}
          balances={balances}
          settlements={suggestedSettlements}
          completedSettlements={rawSettlements}
          balanceCurrency={balanceCurrency}
          onChangeBalanceCurrency={setBalanceCurrency}
          onToggleSettlementStatus={toggleSettlementStatus}
          createWhatsAppLink={createWhatsAppLink}
          settlementWarning={settlementWarning}
          participants={participants}
          paymentPreferences={paymentPreferences}
          onSavePaymentPreference={savePaymentPreference}
          paymentPairRules={paymentPairRules}
          onSavePaymentPairRule={savePaymentPairRule}
          onResetPaymentPairRules={resetPaymentPairRules}
          budgetTarget={budgetTarget}
          onResetAllPaymentRules={() => resetAllPaymentRules(participants)}
          strictPaymentMethods={strictPaymentMethods}
          onChangeStrictPaymentMethods={setStrictPaymentMethods}
        />
      </MobileBottomSheet>

      <MobileBottomSheet
        open={isMobile && shouldShowForm}
        onClose={() => {
          setIsAddOpen(false);
          setEditingExpense(null);
          setDetectedData(null);
        }}
        title={editingExpense?.id ? "Editar gasto" : "Nuevo gasto"}
      >
        <ExpenseForm
          saving={saving}
          existingParticipants={participants}
          registeredTravelers={registeredTravelers}
          baseCurrency={tripBaseCurrency || "EUR"}
          isPremium={isPremium}
          editingExpense={editingExpense}
          detectedData={detectedData}
          onCancelEdit={() => {
            setEditingExpense(null);
            setDetectedData(null);
            setIsAddOpen(false);
          }}
          onSubmit={async (input) => {
            if (editingExpense?.id) {
              await updateExpense(editingExpense.id, input, editingExpense);
              setEditingExpense(null);
            } else {
              await createExpense(input);
            }
            setDetectedData(null);
            setIsAddOpen(false);
          }}
        />
      </MobileBottomSheet>

      {canManageExpenses && !shouldShowForm && !editingExpense && mounted
        ? createPortal(
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(true);
                setIsAnalyzeOpen(false);
                setEditingExpense(null);
                setDetectedData(null);
              }}
              className="btn-press fixed bottom-[calc(max(env(safe-area-inset-bottom),8px)+84px)] right-[max(1rem,env(safe-area-inset-right))] z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-lg transition hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-light)] md:hidden"
              aria-label="Añadir gasto"
            >
              <Plus className="h-7 w-7" aria-hidden />
            </button>,
            document.body
          )
        : null}
    </div>
  );
}
