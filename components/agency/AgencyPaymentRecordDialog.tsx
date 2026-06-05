"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, X } from "lucide-react";
import {
  AGENCY_PAYMENT_METHOD_LABELS,
  type AgencyPaymentMethod,
} from "@/lib/agency/payment-record";
import type { AgencyPaymentReceiptInfo } from "@/lib/agency/payment-record";
import { formatMoney } from "@/lib/agency/payments";
import { agencyBtnPrimaryClass, agencyBtnSecondaryClass, agencyInputClass, agencyLabelClass } from "@/lib/agency-theme";

type Props = {
  open: boolean;
  onClose: () => void;
  tripId: string;
  participantId: string;
  displayName: string;
  installmentId: string;
  label: string;
  amount: number;
  dueAt: string | null;
  currency: string;
  currentStatus: string;
  receipt: AgencyPaymentReceiptInfo;
  onSaved: () => void | Promise<void>;
};

const METHOD_OPTIONS: AgencyPaymentMethod[] = ["transfer", "cash", "bizum", "other"];

export default function AgencyPaymentRecordDialog({
  open,
  onClose,
  tripId,
  participantId,
  displayName,
  installmentId,
  label,
  amount: initialAmount,
  dueAt: initialDueAt,
  currency,
  currentStatus,
  receipt,
  onSaved,
}: Props) {
  const [amountInput, setAmountInput] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<AgencyPaymentMethod>("transfer");
  const [paidAt, setPaidAt] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmountInput(String(initialAmount));
    setDueAt(initialDueAt?.slice(0, 10) ?? "");
    setPaymentMethod(
      receipt.paymentMethod && receipt.paymentMethod !== "stripe"
        ? receipt.paymentMethod
        : "transfer"
    );
    setPaidAt(receipt.paidAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
    setNotes(receipt.manualNotes ?? "");
    setFile(null);
    setError(null);
  }, [open, receipt, initialAmount, initialDueAt]);

  if (!open) return null;

  const isPaid = currentStatus === "paid";

  async function submit(status: "paid" | "pending") {
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Indica un importe válido.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("participantId", participantId);
      form.set("installmentId", installmentId);
      form.set("status", status);
      form.set("amount", String(amount));
      if (dueAt) form.set("dueAt", dueAt);
      form.set("paymentMethod", paymentMethod);
      if (paidAt) form.set("paidAt", `${paidAt}T12:00:00.000Z`);
      if (notes.trim()) form.set("notes", notes.trim());
      if (file && status === "paid") form.set("receipt", file);

      const res = await fetch(`/api/agencies/trips/${tripId}/payments/record`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-record-title"
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-[#0F1623]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="payment-record-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
              Registrar cobro — {label}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{displayName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
        ) : null}

        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={agencyLabelClass}>Importe cobrado ({currency})</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className={`${agencyInputClass} mt-1`}
              />
              <p className="mt-0.5 text-[10px] text-slate-500">
                Puedes ajustar si pagó más o menos que lo previsto.
              </p>
            </label>
            <label className="block">
              <span className={agencyLabelClass}>Vencimiento de la cuota</span>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className={`${agencyInputClass} mt-1`}
              />
            </label>
          </div>

          <label className="block">
            <span className={agencyLabelClass}>Forma de pago</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as AgencyPaymentMethod)}
              className={`${agencyInputClass} mt-1`}
              disabled={receipt.paymentMethod === "stripe"}
            >
              {METHOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {AGENCY_PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </select>
            {receipt.paymentMethod === "stripe" ? (
              <p className="mt-0.5 text-[10px] text-slate-500">Pagado con Stripe; el método no se puede cambiar.</p>
            ) : null}
          </label>

          <label className="block">
            <span className={agencyLabelClass}>Fecha del cobro</span>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className={`${agencyInputClass} mt-1`}
            />
          </label>

          <label className="block">
            <span className={agencyLabelClass}>Justificante (PDF o imagen)</span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-slate-600"
            />
            {receipt.receiptUrl && !file ? (
              <a
                href={receipt.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#0B5CFF] hover:underline"
              >
                <FileText className="h-3.5 w-3.5" />
                Ver justificante actual{receipt.receiptName ? `: ${receipt.receiptName}` : ""}
              </a>
            ) : null}
          </label>

          <label className="block">
            <span className={agencyLabelClass}>Notas</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ej. Transferencia recibida en cuenta ES12…"
              className={`${agencyInputClass} mt-1`}
            />
          </label>

          {amountInput ? (
            <p className="text-xs text-slate-500">
              Total de esta cuota: <strong>{formatMoney(Number(amountInput) || 0, currency)}</strong>
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || receipt.paymentMethod === "stripe"}
            onClick={() => void submit("paid")}
            className={agencyBtnPrimaryClass}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPaid ? "Actualizar cobro" : "Marcar como pagado"}
          </button>
          {isPaid && receipt.paymentMethod !== "stripe" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit("pending")}
              className={agencyBtnSecondaryClass}
            >
              Volver a pendiente
            </button>
          ) : null}
          <button type="button" disabled={busy} onClick={onClose} className={agencyBtnSecondaryClass}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
