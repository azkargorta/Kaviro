"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCopy, FileText, Loader2, Plus, Send } from "lucide-react";
import {
  agencyBtnPrimaryClass,
  agencyBtnSecondaryClass,
  agencyInputClass,
  agencyLabelClass,
} from "@/lib/agency-theme";
import {
  QUOTE_CATEGORY_LABELS,
  QUOTE_LINE_CATEGORIES,
  QUOTE_STATUS_LABELS,
  quoteAcceptPath,
  quotePdfPath,
  type QuoteLineCategory,
} from "@/lib/agency/quotes";
import { useToast } from "@/components/ui/toast";

type QuoteRow = { id: string; title: string; status: string; total_price: number | null; accept_token: string | null };
type LineRow = {
  id?: string;
  category: QuoteLineCategory;
  label: string;
  description: string | null;
  unit_amount: number;
  quantity: number;
};

export default function AgencyTripQuotesSection({ tripId }: { tripId: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [salesStatus, setSalesStatus] = useState("draft");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [lines, setLines] = useState<LineRow[]>([]);
  const [meta, setMeta] = useState({
    title: "",
    clientLabel: "",
    travelersCount: "",
    validUntil: "",
    discountPercent: "0",
    notes: "",
    status: "draft",
    acceptToken: null as string | null,
  });
  const [totals, setTotals] = useState({ subtotal: 0, discountAmount: 0, total: 0, pricePerPerson: null as number | null });
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/quotes`, { cache: "no-store" });
      const data = await res.json();
      if (data.needsMigration) {
        setNeedsMigration(true);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setQuotes(data.quotes ?? []);
      setSalesStatus(data.salesStatus ?? "draft");
      setSelectedId((prev) => prev ?? data.quotes?.[0]?.id ?? null);
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setLoading(false);
    }
  }, [tripId, toast]);

  const loadEditor = useCallback(
    async (quoteId: string) => {
      setEditorLoading(true);
      try {
        const res = await fetch(`/api/agencies/trips/${tripId}/quotes/${quoteId}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const q = data.quote;
        setMeta({
          title: q.title ?? "",
          clientLabel: q.client_label ?? "",
          travelersCount: q.travelers_count != null ? String(q.travelers_count) : "",
          validUntil: q.valid_until ?? "",
          discountPercent: String(q.discount_percent ?? 0),
          notes: q.notes ?? "",
          status: q.status,
          acceptToken: q.accept_token,
        });
        setLines(
          (data.lines ?? []).map((l: LineRow & { category: string }) => ({
            category: l.category as QuoteLineCategory,
            label: l.label,
            description: l.description,
            unit_amount: Number(l.unit_amount),
            quantity: Number(l.quantity),
          }))
        );
        setTotals(data.totals);
      } catch (e) {
        toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
      } finally {
        setEditorLoading(false);
      }
    },
    [tripId, toast]
  );

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) void loadEditor(selectedId);
  }, [selectedId, loadEditor]);

  async function createQuote() {
    setBusy(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedId(data.quoteId);
      await loadList();
      toast.push({ kind: "success", title: "Cotización creada" });
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function saveQuote(markSent = false) {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/quotes/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meta.title,
          clientLabel: meta.clientLabel,
          travelersCount: meta.travelersCount || null,
          validUntil: meta.validUntil || null,
          discountPercent: Number(meta.discountPercent),
          notes: meta.notes,
          lines,
          status: markSent ? "sent" : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMeta((m) => ({
        ...m,
        status: data.quote.status,
        acceptToken: data.quote.accept_token,
      }));
      setTotals(data.totals);
      await loadList();
      toast.push({ kind: "success", title: markSent ? "Cotización enviada" : "Guardado" });
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  }

  async function copyAcceptLink() {
    if (!meta.acceptToken) return;
    const url = `${window.location.origin}${quoteAcceptPath(meta.acceptToken)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.push({ kind: "success", title: "Enlace copiado" });
    } catch {
      toast.push({ kind: "error", title: "No se pudo copiar" });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (needsMigration) {
    return (
      <p className="text-sm text-amber-800 dark:text-amber-200">
        Ejecuta <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">docs/kaviro_agency_quotes.sql</code>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Estado comercial del viaje: <strong className="text-slate-700 dark:text-slate-300">{salesStatus}</strong>
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void createQuote()} className={`${agencyBtnPrimaryClass} gap-1 text-xs`}>
          <Plus className="h-3.5 w-3.5" />
          Nueva cotización
        </button>
      </div>

      {quotes.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {quotes.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setSelectedId(q.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                selectedId === q.id
                  ? "bg-[#1e3a5f] text-white"
                  : "border border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900"
              }`}
            >
              {q.title.slice(0, 28)}
              {q.title.length > 28 ? "…" : ""} · {QUOTE_STATUS_LABELS[q.status as keyof typeof QUOTE_STATUS_LABELS] ?? q.status}
            </button>
          ))}
        </div>
      ) : null}

      {selectedId && !editorLoading ? (
        <div className="space-y-3 rounded-lg border border-slate-100 p-4 dark:border-slate-800">
          <label className="block">
            <span className={agencyLabelClass}>Título</span>
            <input className={`${agencyInputClass} mt-1`} value={meta.title} onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={agencyLabelClass}>Cliente / grupo</span>
              <input className={`${agencyInputClass} mt-1`} value={meta.clientLabel} onChange={(e) => setMeta((m) => ({ ...m, clientLabel: e.target.value }))} />
            </label>
            <label className="block">
              <span className={agencyLabelClass}>Viajeros (para €/persona)</span>
              <input type="number" min={1} className={`${agencyInputClass} mt-1`} value={meta.travelersCount} onChange={(e) => setMeta((m) => ({ ...m, travelersCount: e.target.value }))} />
            </label>
            <label className="block">
              <span className={agencyLabelClass}>Válida hasta</span>
              <input type="date" className={`${agencyInputClass} mt-1`} value={meta.validUntil} onChange={(e) => setMeta((m) => ({ ...m, validUntil: e.target.value }))} />
            </label>
            <label className="block">
              <span className={agencyLabelClass}>Descuento %</span>
              <input type="number" min={0} max={100} className={`${agencyInputClass} mt-1`} value={meta.discountPercent} onChange={(e) => setMeta((m) => ({ ...m, discountPercent: e.target.value }))} />
            </label>
          </div>

          <div className="space-y-2">
            <p className={agencyLabelClass}>Conceptos</p>
            {lines.map((line, i) => (
              <div key={i} className="grid gap-2 rounded-md bg-slate-50 p-2 dark:bg-slate-900/50 sm:grid-cols-6">
                <select
                  value={line.category}
                  onChange={(e) => {
                    const cat = e.target.value as QuoteLineCategory;
                    setLines((prev) => prev.map((l, j) => (j === i ? { ...l, category: cat } : l)));
                  }}
                  className={`${agencyInputClass} sm:col-span-1 text-xs`}
                >
                  {QUOTE_LINE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {QUOTE_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
                <input
                  className={`${agencyInputClass} sm:col-span-2 text-xs`}
                  value={line.label}
                  onChange={(e) => setLines((prev) => prev.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)))}
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={`${agencyInputClass} sm:col-span-1 text-xs`}
                  value={line.unit_amount}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l, j) => (j === i ? { ...l, unit_amount: Number(e.target.value) } : l))
                    )
                  }
                />
                <input
                  type="number"
                  min={1}
                  className={`${agencyInputClass} sm:col-span-1 text-xs`}
                  value={line.quantity}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l, j) => (j === i ? { ...l, quantity: Number(e.target.value) } : l))
                    )
                  }
                />
              </div>
            ))}
          </div>

          <p className="text-right text-sm font-bold text-slate-900 dark:text-white">
            Total: {totals.total.toFixed(2)} €
            {totals.pricePerPerson != null ? ` · ${totals.pricePerPerson.toFixed(2)} €/persona` : ""}
          </p>

          <textarea
            className={`${agencyInputClass} min-h-[4rem] text-xs`}
            placeholder="Notas para el cliente"
            value={meta.notes}
            onChange={(e) => setMeta((m) => ({ ...m, notes: e.target.value }))}
          />

          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void saveQuote(false)} className={agencyBtnSecondaryClass}>
              Guardar
            </button>
            <button type="button" disabled={busy} onClick={() => void saveQuote(true)} className={`${agencyBtnPrimaryClass} gap-1 text-xs`}>
              <Send className="h-3.5 w-3.5" />
              Marcar enviada
            </button>
            {meta.acceptToken ? (
              <>
                <button type="button" onClick={() => void copyAcceptLink()} className={`${agencyBtnSecondaryClass} gap-1 text-xs`}>
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  Copiar enlace
                </button>
                <Link href={quotePdfPath(meta.acceptToken)} target="_blank" className={`${agencyBtnSecondaryClass} gap-1 text-xs`}>
                  <FileText className="h-3.5 w-3.5" />
                  PDF
                </Link>
              </>
            ) : null}
          </div>
        </div>
      ) : editorLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      ) : null}
    </div>
  );
}
