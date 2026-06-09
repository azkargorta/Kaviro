"use client";

import LongTextSheet from "@/components/ui/LongTextSheet";
import { useMemo, useState } from "react";
import { ChevronDown, Filter, RotateCcw } from "lucide-react";

type Expense = {
  id: string;
  title: string;
  category?: string | null;
  payer_name?: string | null;
  participant_names?: string[] | null;
  paid_by_names?: string[] | null;
  owed_by_names?: string[] | null;
  amount: number;
  currency: string;
  expense_date?: string | null;
  notes?: string | null;
  attachment_name?: string | null;
};

function normalizeParticipants(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

// G3 — Semantic colors per category
const CAT_META: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  transport:     { label: "Transporte",   bg: "bg-blue-100",   text: "text-blue-800",   icon: "🚌" },
  transportation:{ label: "Transporte",   bg: "bg-blue-100",   text: "text-blue-800",   icon: "🚌" },
  lodging:       { label: "Alojamiento",  bg: "bg-violet-100", text: "text-violet-800", icon: "🏨" },
  accommodation: { label: "Alojamiento",  bg: "bg-violet-100", text: "text-violet-800", icon: "🏨" },
  food:          { label: "Comida",       bg: "bg-orange-100", text: "text-orange-800", icon: "🍽️" },
  meals:         { label: "Comida",       bg: "bg-orange-100", text: "text-orange-800", icon: "🍽️" },
  restaurant:    { label: "Restaurante",  bg: "bg-orange-100", text: "text-orange-800", icon: "🍽️" },
  groceries:     { label: "Supermercado", bg: "bg-amber-100",  text: "text-amber-800",  icon: "🛒" },
  supermarket:   { label: "Supermercado", bg: "bg-amber-100",  text: "text-amber-800",  icon: "🛒" },
  activities:    { label: "Actividades",  bg: "bg-emerald-100",text: "text-emerald-800",icon: "🎟️" },
  activity:      { label: "Actividades",  bg: "bg-emerald-100",text: "text-emerald-800",icon: "🎟️" },
  tickets:       { label: "Tickets",      bg: "bg-emerald-100",text: "text-emerald-800",icon: "🎟️" },
  ticket:        { label: "Tickets",      bg: "bg-emerald-100",text: "text-emerald-800",icon: "🎟️" },
  shopping:      { label: "Compras",      bg: "bg-pink-100",   text: "text-pink-800",   icon: "🛍️" },
  misc:          { label: "Otros",        bg: "bg-slate-100",  text: "text-slate-700",  icon: "📌" },
  other:         { label: "Otros",        bg: "bg-slate-100",  text: "text-slate-700",  icon: "📌" },
  others:        { label: "Otros",        bg: "bg-slate-100",  text: "text-slate-700",  icon: "📌" },
};
function categoryMeta(raw: string | null | undefined) {
  const k = String(raw || "").trim().toLowerCase();
  const found = CAT_META[k];
  if (found) return found;
  const label = k ? k.replace(/_/g, " ").replace(/\w/g, (m) => m.toUpperCase()) : "Sin categoría";
  return { label, bg: "bg-slate-100", text: "text-slate-700", icon: "📌" };
}
function categoryLabelEs(raw: string | null | undefined): string {
  return categoryMeta(raw).label;
}

// G2 — Avatar initials with deterministic color
const AVATAR_COLORS = [
  "bg-violet-200 text-violet-900", "bg-blue-200 text-blue-900",
  "bg-emerald-200 text-emerald-900", "bg-amber-200 text-amber-900",
  "bg-pink-200 text-pink-900", "bg-orange-200 text-orange-900",
  "bg-sky-200 text-sky-900", "bg-indigo-200 text-indigo-900",
];
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function uniqSorted(list: string[]) {
  return Array.from(new Set(list.filter(Boolean))).sort((a, b) => a.localeCompare(b, "es"));
}

export default function ExpenseList({
  expenses,
  onEdit,
  onDuplicate,
  onDelete,
  compact = false,
}: {
  expenses: Expense[];
  onEdit?: (expense: Expense) => void;
  onDuplicate?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => Promise<void>;
  /** Filas densas para móvil */
  compact?: boolean;
}) {
  const canMutate = Boolean(onEdit && onDelete);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [groupByDate, setGroupByDate] = useState(compact);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [payerFilter, setPayerFilter] = useState<string>("all");
  const [owedByFilter, setOwedByFilter] = useState<string>("all");

  const filterOptions = useMemo(() => {
    const categories = uniqSorted(expenses.map((e) => String(e.category || "").trim()).filter(Boolean));
    const dates = uniqSorted(expenses.map((e) => String(e.expense_date || "").trim()).filter(Boolean));
    const payers = uniqSorted(expenses.map((e) => String(e.payer_name || "").trim()).filter(Boolean));
    const owedPeople = uniqSorted(expenses.flatMap((e) => normalizeParticipants(e.owed_by_names)));
    return { categories, dates, payers, owedPeople };
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter !== "all" && String(e.category || "").trim() !== categoryFilter) return false;
      if (dateFilter !== "all" && String(e.expense_date || "").trim() !== dateFilter) return false;
      if (payerFilter !== "all" && String(e.payer_name || "").trim() !== payerFilter) return false;
      if (owedByFilter !== "all") {
        const owed = normalizeParticipants(e.owed_by_names);
        if (!owed.includes(owedByFilter)) return false;
      }
      return true;
    });
  }, [expenses, categoryFilter, dateFilter, payerFilter, owedByFilter]);

  const groupedByDate = useMemo(() => {
    if (!groupByDate) return null;
    const map = new Map<string, Expense[]>();
    for (const e of filtered) {
      const day = String(e.expense_date || "").trim() || "Sin fecha";
      const list = map.get(day) || [];
      list.push(e);
      map.set(day, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered, groupByDate]);

  function renderExpenseCompactRow(expense: Expense) {
    const owedBy = normalizeParticipants(expense.owed_by_names);
    const cat = categoryMeta(expense.category);
    const amount = Number(expense.amount || 0);
    const perPerson = owedBy.length > 0 ? amount / owedBy.length : amount;

    return (
      <div
        key={expense.id}
        className="motion-stagger-item flex items-center gap-2.5 border-b border-slate-100 py-2.5 last:border-0 dark:border-[#1E293B]"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center text-lg" aria-hidden>
          {cat.icon}
        </span>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onEdit?.(expense)}
          disabled={!canMutate}
        >
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {expense.title || "Gasto sin título"}
          </p>
          <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
            {expense.payer_name ? `Pagó ${expense.payer_name}` : "Sin pagador"}
            {owedBy.length > 0 ? ` · ${owedBy.length} pers.` : ""}
          </p>
        </button>
        <div className="shrink-0 text-right">
          <p className="text-sm font-extrabold tabular-nums text-slate-950 dark:text-white">
            {formatMoney(amount, expense.currency)}
          </p>
          {owedBy.length > 1 ? (
            <p className="text-[10px] tabular-nums text-slate-500">{formatMoney(perPerson, expense.currency)}/pp</p>
          ) : null}
        </div>
      </div>
    );
  }

  function renderExpenseCard(expense: Expense) {
    const owedBy = normalizeParticipants(expense.owed_by_names);

    return (
      <div key={expense.id} className="motion-stagger-item trip-card-hover min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 px-4 py-3.5">
          {expense.payer_name ? (
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold mt-0.5 ${avatarColor(expense.payer_name)}`}>
              {initials(expense.payer_name)}
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 text-xs mt-0.5">?</div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <div className="flex-1 min-w-0 text-sm font-semibold text-slate-900 leading-snug">
                <LongTextSheet text={expense.title || "Gasto sin título"} modalTitle="Gasto" minLength={40} lineClamp={2} className="font-semibold text-slate-900" />
              </div>
              {expense.category && (() => {
                const cat = categoryMeta(expense.category);
                return (
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cat.bg} ${cat.text}`}>
                    <span>{cat.icon}</span>{cat.label}
                  </span>
                );
              })()}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
              {expense.payer_name && <span>Pagado por <span className="font-semibold text-slate-700">{expense.payer_name}</span></span>}
              {owedBy.length > 0 && <span>Entre {owedBy.length} persona{owedBy.length !== 1 ? "s" : ""}</span>}
              {expense.expense_date && !groupByDate && <span>{expense.expense_date}</span>}
            </div>
            {expense.notes ? (
              <p className="mt-1.5 text-xs text-slate-400 line-clamp-1">{expense.notes}</p>
            ) : null}
          </div>
          <div className="shrink-0 text-right ml-2">
            <div className="text-base font-extrabold text-slate-950 tabular-nums">
              {formatMoney(Number(expense.amount || 0), expense.currency)}
            </div>
            {expense.attachment_name ? <p className="mt-0.5 text-[10px] text-slate-400">📎</p> : null}
          </div>
        </div>
        {canMutate ? (
          <div className="border-t border-slate-100 dark:border-[#1E293B] px-4 py-3 flex gap-2">
            <button type="button" onClick={() => onEdit!(expense)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] min-h-[36px]">Editar</button>
            {onDuplicate ? (
              <button type="button" onClick={() => onDuplicate(expense)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 min-h-[36px]">Duplicar</button>
            ) : null}
            <button type="button" onClick={() => void onDelete!(expense.id)} className="ml-auto rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 min-h-[36px]">Eliminar</button>
          </div>
        ) : null}
      </div>
    );
  }

  const renderItem = compact ? renderExpenseCompactRow : renderExpenseCard;

  return (
    <div
      className={
        compact
          ? "min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]"
          : "min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      }
    >
      {filterOptions.categories.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              categoryFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            Todas
          </button>
          {filterOptions.categories.map((c) => {
            const meta = categoryMeta(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  categoryFilter === c ? "bg-slate-900 text-white" : `${meta.bg} ${meta.text}`
                }`}
              >
                {meta.icon} {meta.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className={`flex flex-wrap items-start justify-between gap-3 ${compact ? "px-1 pt-2" : ""}`}>
        <div>
          <h3 className={`font-semibold text-slate-900 ${compact ? "text-sm" : "text-lg"}`}>Gastos registrados</h3>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            {filtered.length} de {expenses.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGroupByDate((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
              groupByDate
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            Por fecha
          </button>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            aria-expanded={filtersOpen}
          >
            <Filter className="h-4 w-4" aria-hidden />
            Filtros
            <ChevronDown className={`h-4 w-4 transition ${filtersOpen ? "rotate-180" : ""}`} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter("all");
              setDateFilter("all");
              setPayerFilter("all");
              setOwedByFilter("all");
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            title="Limpiar filtros"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Limpiar
          </button>
        </div>
      </div>

      {filtersOpen ? (
        <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            <span>Categoría</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] px-3 py-2 text-sm font-semibold text-slate-900"
            >
              <option value="all">Todas</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabelEs(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            <span>Día</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] px-3 py-2 text-sm font-semibold text-slate-900"
            >
              <option value="all">Todos</option>
              {filterOptions.dates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            <span>Pagador</span>
            <select
              value={payerFilter}
              onChange={(e) => setPayerFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] px-3 py-2 text-sm font-semibold text-slate-900"
            >
              <option value="all">Todos</option>
              {filterOptions.payers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            <span>Quién tiene que pagar</span>
            <select
              value={owedByFilter}
              onChange={(e) => setOwedByFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] px-3 py-2 text-sm font-semibold text-slate-900"
            >
              <option value="all">Todos</option>
              {filterOptions.owedPeople.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <div className="mt-4 space-y-4 motion-stagger-list">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">💸</div>
              <p className="text-sm font-extrabold text-slate-800">Sin gastos</p>
              <p className="mt-1 text-xs text-slate-500">
                {categoryFilter !== "all" || dateFilter !== "all" || payerFilter !== "all" || owedByFilter !== "all"
                  ? "Prueba a quitar los filtros."
                  : "Registra el primer gasto para ver el balance del grupo."}
              </p>
            </div>
        ) : groupByDate && groupedByDate ? (
          groupedByDate.map(([day, items]) => {
            const subtotal = items.reduce((s, e) => s + Number(e.amount || 0), 0);
            const cur = items[0]?.currency || "EUR";
            return (
              <div key={day} className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1 pt-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{day}</h4>
                  <span className="text-xs font-bold text-slate-700 tabular-nums">
                    {formatMoney(subtotal, cur)}
                  </span>
                </div>
                {items.map((expense) => renderItem(expense))}
              </div>
            );
          })
        ) : (
          filtered.map((expense) => renderItem(expense))
        )}
      </div>
    </div>
  );
}
