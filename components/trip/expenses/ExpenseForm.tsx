"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ALL_CURRENCIES } from "@/lib/currencies";
import type { ExpenseAnalysis, ExpenseFormInput } from "@/hooks/useTripExpenses";
import type { ExpenseDetectedData } from "@/components/trip/expenses/ExpenseAnalyzerPanel";
import { parseAmountsMap, validateCustomShares } from "@/lib/expense-split";
import { useIsMobile } from "@/hooks/useIsMobile";

type ExistingExpense = {
  id?: string;
  title?: string | null;
  category?: string | null;
  payer_name?: string | null;
  participant_names?: string[] | null;
  paid_by_names?: string[] | null;
  owed_by_names?: string[] | null;
  owed_amounts?: Record<string, number> | null;
  paid_amounts?: Record<string, number> | null;
  amount?: number | null;
  currency?: string | null;
  expense_date?: string | null;
  notes?: string | null;
  attachment_name?: string | null;
  analysis_data?: ExpenseAnalysis | null;
};

type Props = {
  saving?: boolean;
  existingParticipants: string[];
  registeredTravelers?: string[];
  baseCurrency?: string;
  editingExpense?: ExistingExpense | null;
  detectedData?: ExpenseDetectedData | null;
  onCancelEdit?: () => void;
  onSubmit: (input: ExpenseFormInput) => Promise<void>;
};

const CATEGORIES = [
  { value: "general", label: "General", icon: "💳" },
  { value: "food", label: "Comida", icon: "🍽️" },
  { value: "transport", label: "Transporte", icon: "🚆" },
  { value: "lodging", label: "Alojamiento", icon: "🏨" },
  { value: "tickets", label: "Entradas", icon: "🎟️" },
  { value: "shopping", label: "Compras", icon: "🛍️" },
];

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNameArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeName).filter(Boolean);
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function Chip({
  name,
  active,
  tone,
  onClick,
}: {
  name: string;
  active: boolean;
  tone: "paid" | "split";
  onClick: () => void;
}) {
  const activeClass =
    tone === "paid"
      ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
      : "border-sky-500 bg-sky-500 text-white shadow-sm";
  const idleClass =
    tone === "paid"
      ? "border-slate-200 bg-white text-slate-700 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200"
      : "border-slate-200 bg-slate-50 text-slate-600 dark:border-[#334155] dark:bg-[#080C14] dark:text-slate-300";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[40px] rounded-full border px-4 py-2 text-sm font-bold transition active:scale-95 ${
        active ? activeClass : idleClass
      }`}
    >
      {name}
    </button>
  );
}

export default function ExpenseForm({
  saving = false,
  existingParticipants,
  registeredTravelers = [],
  baseCurrency = "EUR",
  editingExpense = null,
  detectedData = null,
  onCancelEdit,
  onSubmit,
}: Props) {
  const isMobile = useIsMobile();
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);
  const [moreOpen, setMoreOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [payerName, setPayerName] = useState("");
  const [paidByNames, setPaidByNames] = useState<string[]>([]);
  const [owedByNames, setOwedByNames] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(baseCurrency);
  const [expenseDate, setExpenseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [keepExistingAttachment, setKeepExistingAttachment] = useState(true);
  const [analysisData, setAnalysisData] = useState<ExpenseAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unevenSplit, setUnevenSplit] = useState(false);
  const [owedAmountInputs, setOwedAmountInputs] = useState<Record<string, string>>({});
  const [paidAmountInputs, setPaidAmountInputs] = useState<Record<string, string>>({});

  const isEditing = Boolean(editingExpense?.id);
  const isDuplicating = Boolean(editingExpense && !editingExpense.id);

  const travelerOptions = useMemo(() => {
    const set = new Set<string>();
    [...registeredTravelers, ...existingParticipants].forEach((item) => {
      const clean = normalizeName(item);
      if (clean) set.add(clean);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [existingParticipants, registeredTravelers]);

  const numericAmount = useMemo(() => {
    const normalized = String(amount || "").trim().replace(/\s/g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const owedCustomSum = useMemo(() => {
    return owedByNames.reduce((sum, name) => {
      const n = Number(String(owedAmountInputs[name] || "").replace(",", "."));
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [owedByNames, owedAmountInputs]);

  const paidCustomSum = useMemo(() => {
    return paidByNames.reduce((sum, name) => {
      const n = Number(String(paidAmountInputs[name] || "").replace(",", "."));
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [paidByNames, paidAmountInputs]);

  const perPerson = useMemo(() => {
    if (numericAmount <= 0 || owedByNames.length === 0 || unevenSplit) return null;
    return Math.round((numericAmount / owedByNames.length) * 100) / 100;
  }, [numericAmount, owedByNames.length, unevenSplit]);

  const participantNames = useMemo(() => {
    const set = new Set([...paidByNames, ...owedByNames]);
    return Array.from(set);
  }, [paidByNames, owedByNames]);

  useEffect(() => {
    if (!editingExpense) {
      if (travelerOptions.length && owedByNames.length === 0 && !isEditing) {
        setOwedByNames([...travelerOptions]);
      }
      return;
    }
    setTitle(editingExpense.title || "");
    setCategory(editingExpense.category || "general");
    setPayerName(editingExpense.payer_name || "");
    const paid = normalizeNameArray(editingExpense.paid_by_names);
    const owed = normalizeNameArray(editingExpense.owed_by_names);
    setPaidByNames(paid.length ? paid : normalizeNameArray(editingExpense.participant_names));
    setOwedByNames(owed.length ? owed : normalizeNameArray(editingExpense.participant_names));
    const owedMap = parseAmountsMap(editingExpense.owed_amounts);
    const paidMap = parseAmountsMap(editingExpense.paid_amounts);
    setUnevenSplit(Boolean(owedMap));
    setOwedAmountInputs(
      owedMap
        ? Object.fromEntries(Object.entries(owedMap).map(([k, v]) => [k, String(v)]))
        : {}
    );
    setPaidAmountInputs(
      paidMap
        ? Object.fromEntries(Object.entries(paidMap).map(([k, v]) => [k, String(v)]))
        : {}
    );
    setAmount(editingExpense.amount != null ? String(editingExpense.amount) : "");
    setCurrency(editingExpense.currency || baseCurrency);
    setExpenseDate(editingExpense.expense_date || "");
    setNotes(editingExpense.notes || "");
    setKeepExistingAttachment(Boolean(editingExpense.attachment_name));
    setAnalysisData(editingExpense.analysis_data || null);
    setAttachment(null);
    setMobileStep(1);
  }, [editingExpense, baseCurrency, isEditing, travelerOptions]);

  useEffect(() => {
    if (!detectedData || isEditing) return;
    if (detectedData.title) setTitle(detectedData.title);
    if (detectedData.category) setCategory(detectedData.category);
    if (detectedData.amount != null) setAmount(String(detectedData.amount));
    const detectedCurrency =
      typeof detectedData.currency === "string" ? detectedData.currency.trim().toUpperCase() : "";
    const isSupported = Boolean(ALL_CURRENCIES.find((c) => c.code === detectedCurrency));
    setCurrency(isSupported ? detectedCurrency : baseCurrency);
    if (detectedData.expenseDate) setExpenseDate(detectedData.expenseDate);
    if (detectedData.file) setAttachment(detectedData.file);
    const { file: _file, ...safeAnalysis } = detectedData as ExpenseDetectedData & { file?: File };
    setAnalysisData(safeAnalysis as ExpenseAnalysis);
  }, [detectedData, isEditing, baseCurrency]);

  useEffect(() => {
    const clean = normalizeName(payerName);
    if (!clean) return;
    setPaidByNames((prev) => (prev.includes(clean) ? prev : [clean, ...prev.filter((n) => n !== clean)]));
    setOwedByNames((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
  }, [payerName]);

  function togglePaid(name: string) {
    setPaidByNames((current) =>
      current.includes(name) ? current.filter((n) => n !== name) : [...current, name]
    );
  }

  function toggleOwed(name: string) {
    setOwedByNames((current) =>
      current.includes(name) ? current.filter((n) => n !== name) : [...current, name]
    );
  }

  function selectAllOwed() {
    setOwedByNames([...travelerOptions]);
  }

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Introduce el concepto del gasto.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("El importe no es válido.");
      return;
    }
    if (!paidByNames.length) {
      setError("Indica quién ha pagado.");
      return;
    }
    if (!owedByNames.length) {
      setError("Indica entre quién se reparte.");
      return;
    }

    let owedAmounts: Record<string, number> | null = null;
    let paidAmounts: Record<string, number> | null = null;

    if (unevenSplit) {
      const map: Record<string, number> = {};
      for (const name of owedByNames) {
        const n = Number(String(owedAmountInputs[name] || "").replace(",", "."));
        if (!Number.isFinite(n) || n < 0) {
          setError(`Importe no válido para ${name}.`);
          return;
        }
        map[name] = n;
      }
      const check = validateCustomShares(owedByNames, map, numericAmount);
      if (!check.ok) {
        setError(`La suma del reparto (${check.sum.toFixed(2)}) debe coincidir con el total (${numericAmount.toFixed(2)}).`);
        return;
      }
      owedAmounts = map;
    }

    if (paidByNames.length > 1) {
      const map: Record<string, number> = {};
      let hasCustom = false;
      for (const name of paidByNames) {
        const raw = String(paidAmountInputs[name] || "").trim();
        if (raw) {
          hasCustom = true;
          const n = Number(raw.replace(",", "."));
          if (!Number.isFinite(n) || n < 0) {
            setError(`Importe pagado no válido para ${name}.`);
            return;
          }
          map[name] = n;
        }
      }
      if (hasCustom) {
        const check = validateCustomShares(paidByNames, map, numericAmount);
        if (!check.ok) {
          setError(`Lo pagado por persona (${check.sum.toFixed(2)}) debe sumar el total (${numericAmount.toFixed(2)}).`);
          return;
        }
        paidAmounts = map;
      }
    }

    try {
      await Promise.race([
        onSubmit({
          id: editingExpense?.id,
          title: title.trim(),
          category,
          payerName: payerName.trim() || paidByNames[0] || "",
          participantNames,
          paidByNames,
          owedByNames,
          owedAmounts,
          paidAmounts,
          amount: numericAmount,
          currency,
          expenseDate,
          notes,
          attachment,
          keepExistingAttachment,
          analysisData,
        }),
        new Promise<void>((_resolve, reject) =>
          window.setTimeout(() => reject(new Error("El guardado está tardando demasiado (timeout).")), 60000)
        ),
      ]);

      if (!isEditing) {
        setTitle("");
        setCategory("general");
        setPayerName("");
        setPaidByNames([]);
        setOwedByNames([...travelerOptions]);
        setAmount("");
        setCurrency(baseCurrency);
        setExpenseDate("");
        setNotes("");
        setAttachment(null);
        setKeepExistingAttachment(true);
        setAnalysisData(null);
        setMobileStep(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el gasto.");
    }
  }

  const chipsBlock = (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1E293B] dark:bg-[#080C14]">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Quién pagó</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {travelerOptions.map((name) => (
            <Chip key={`paid-${name}`} name={name} active={paidByNames.includes(name)} tone="paid" onClick={() => togglePaid(name)} />
          ))}
        </div>
      </div>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">Entre quién se reparte</p>
          <button type="button" onClick={selectAllOwed} className="text-xs font-bold text-[var(--brand)] underline">
            Todos
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {travelerOptions.map((name) => (
            <Chip key={`owed-${name}`} name={name} active={owedByNames.includes(name)} tone="split" onClick={() => toggleOwed(name)} />
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={unevenSplit}
          onChange={(e) => {
            setUnevenSplit(e.target.checked);
            if (!e.target.checked) setOwedAmountInputs({});
          }}
        />
        Reparto desigual (importe por persona)
      </label>
      {unevenSplit ? (
        <div className="space-y-2 rounded-xl border border-sky-200 bg-white p-3 dark:border-sky-900/40 dark:bg-[#0F1623]">
          {owedByNames.map((name) => (
            <label key={`owed-amt-${name}`} className="flex items-center justify-between gap-2 text-sm">
              <span className="font-semibold">{name}</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={owedAmountInputs[name] ?? ""}
                onChange={(e) =>
                  setOwedAmountInputs((prev) => ({ ...prev, [name]: e.target.value }))
                }
                className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-right font-bold dark:border-[#334155] dark:bg-[#080C14]"
                placeholder="0"
              />
            </label>
          ))}
          <p className={`text-xs font-bold ${Math.abs(owedCustomSum - numericAmount) < 0.02 ? "text-emerald-700" : "text-rose-700"}`}>
            Suma: {formatMoney(owedCustomSum, currency)} / {formatMoney(numericAmount, currency)}
          </p>
        </div>
      ) : perPerson != null ? (
        <p className="text-center text-sm font-extrabold text-slate-800 dark:text-slate-100">
          → {formatMoney(perPerson, currency)} por persona
        </p>
      ) : null}
      {paidByNames.length > 1 ? (
        <div className="space-y-2 rounded-xl border border-emerald-200 bg-white p-3 dark:border-emerald-900/40 dark:bg-[#0F1623]">
          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">Importe pagado por cada uno (opcional)</p>
          {paidByNames.map((name) => (
            <label key={`paid-amt-${name}`} className="flex items-center justify-between gap-2 text-sm">
              <span className="font-semibold">{name}</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={paidAmountInputs[name] ?? ""}
                onChange={(e) =>
                  setPaidAmountInputs((prev) => ({ ...prev, [name]: e.target.value }))
                }
                className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-right font-bold dark:border-[#334155] dark:bg-[#080C14]"
                placeholder="Igual"
              />
            </label>
          ))}
          {Object.values(paidAmountInputs).some((v) => v.trim()) ? (
            <p className={`text-xs font-bold ${Math.abs(paidCustomSum - numericAmount) < 0.02 ? "text-emerald-700" : "text-rose-700"}`}>
              Suma pagada: {formatMoney(paidCustomSum, currency)} / {formatMoney(numericAmount, currency)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const moreOptions = (
    <div className="space-y-3">
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-800">Categoría</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3">
          {CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>{item.icon} {item.label}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-800">Fecha</span>
        <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-800">Notas</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-xl border border-slate-300 px-4 py-3" />
      </label>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1E293B] dark:bg-[#080C14]">
        {isEditing && editingExpense?.attachment_name ? (
          <label className="mb-2 inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={keepExistingAttachment} onChange={(e) => setKeepExistingAttachment(e.target.checked)} />
            <span>Mantener: {editingExpense.attachment_name}</span>
          </label>
        ) : null}
        <input type="file" accept="image/*,.pdf" onChange={(e) => setAttachment(e.target.files?.[0] || null)} className="w-full text-sm" />
      </div>
    </div>
  );

  const step1Fields = (
    <>
      <label className="block text-center">
        <span className="text-sm font-semibold text-slate-600">Importe</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          className="mt-2 w-full border-0 bg-transparent text-center text-4xl font-black text-slate-900 outline-none dark:text-white"
          placeholder="0,00"
        />
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 mx-auto block rounded-lg border border-slate-200 px-2 py-1 text-sm font-bold">
          {ALL_CURRENCIES.map((item) => (
            <option key={item.code} value={item.code}>{item.code}</option>
          ))}
        </select>
      </label>
      {perPerson != null && owedByNames.length > 0 ? (
        <p className="text-center text-sm font-bold text-[var(--brand)]">
          {formatMoney(perPerson, currency)} / persona
        </p>
      ) : null}
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-800">Concepto</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Cena, taxi…" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-800">Quién ha pagado</span>
        <select value={payerName} onChange={(e) => setPayerName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3">
          <option value="">Seleccionar…</option>
          {travelerOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </label>
    </>
  );

  const confirmSummary = (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-[#1E293B] dark:bg-[#080C14]">
      <p><span className="font-bold">{formatMoney(numericAmount, currency)}</span> · {title || "Sin concepto"}</p>
      <p>Pagó: <span className="font-semibold">{paidByNames.join(", ") || "—"}</span></p>
      <p>Reparto: <span className="font-semibold">{owedByNames.join(", ") || "—"}</span></p>
      {perPerson != null ? <p className="font-bold text-[var(--brand)]">{formatMoney(perPerson, currency)} cada uno</p> : null}
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] md:rounded-2xl">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          <span>💸</span>
          <span>{isEditing ? "Editar gasto" : isDuplicating ? "Duplicar gasto" : "Nuevo gasto"}</span>
        </div>
        {isMobile && !isEditing ? (
          <p className="mt-2 text-xs font-bold text-slate-500">Paso {mobileStep} de 3</p>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          if (isMobile && !isEditing && mobileStep < 3) {
            e.preventDefault();
            if (mobileStep === 1) setMobileStep(2);
            else if (mobileStep === 2) setMobileStep(3);
            return;
          }
          void handleSubmit(e);
        }}
        className="mt-5 space-y-4"
      >
        {saving ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">Guardando…</div>
        ) : null}

        {isMobile && !isEditing ? (
          <>
            {mobileStep === 1 ? step1Fields : null}
            {mobileStep === 2 ? chipsBlock : null}
            {mobileStep === 3 ? (
              <>
                {confirmSummary}
                <button type="button" onClick={() => setMoreOpen((v) => !v)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">
                  Más opciones
                  {moreOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                {moreOpen ? moreOptions : null}
              </>
            ) : null}
          </>
        ) : (
          <>
            {step1Fields}
            <button type="button" onClick={selectAllOwed} className="w-full rounded-xl border border-dashed border-slate-300 py-2 text-sm font-bold text-slate-700">
              Repartir entre todos ({travelerOptions.length})
            </button>
            {chipsBlock}
            <button type="button" onClick={() => setMoreOpen((v) => !v)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              Más opciones (fecha, categoría, notas)
              {moreOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {moreOpen ? moreOptions : null}
          </>
        )}

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="flex flex-wrap gap-3">
          {isMobile && !isEditing && mobileStep > 1 ? (
            <button type="button" onClick={() => setMobileStep((s) => (s - 1) as 1 | 2)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold">
              Atrás
            </button>
          ) : null}
          <button type="submit" disabled={saving} className={`rounded-xl px-4 py-3 text-sm font-semibold ${saving ? "bg-slate-200 text-slate-500" : "bg-slate-950 text-white"}`}>
            {saving
              ? "Guardando..."
              : isMobile && !isEditing && mobileStep < 3
                ? mobileStep === 1
                  ? "Siguiente"
                  : "Revisar"
                : isEditing
                  ? "Guardar cambios"
                  : "Guardar gasto"}
          </button>
          {isEditing && onCancelEdit ? (
            <button type="button" onClick={onCancelEdit} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold">
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
