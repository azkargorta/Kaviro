"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import type { PaymentInstallment } from "@/lib/agency/payment-schedule";
import { formatMoney } from "@/lib/agency/payments";
import { agencyBtnPrimaryClass, agencyBtnSecondaryClass, agencyInputClass, agencyLabelClass } from "@/lib/agency-theme";

type PlanRow = {
  id?: string;
  label: string;
  amount: string;
  dueAt: string;
  status?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  tripId: string;
  participantId: string;
  displayName: string;
  currency: string;
  schedule: PaymentInstallment[];
  onSaved: () => void | Promise<void>;
};

function rowsFromSchedule(schedule: PaymentInstallment[]): PlanRow[] {
  return schedule.map((inst) => ({
    id: inst.id,
    label: inst.label,
    amount: String(inst.amount),
    dueAt: inst.dueAt?.slice(0, 10) ?? "",
    status: inst.status,
  }));
}

export default function AgencyPaymentPlanDialog({
  open,
  onClose,
  tripId,
  participantId,
  displayName,
  currency,
  schedule,
  onSaved,
}: Props) {
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRows(
      schedule.length
        ? rowsFromSchedule(schedule)
        : [{ label: "Señal", amount: "", dueAt: "" }]
    );
    setError(null);
  }, [open, schedule]);

  const total = useMemo(() => {
    return rows.reduce((sum, row) => {
      const n = Number(row.amount);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [rows]);

  if (!open) return null;

  function updateRow(index: number, patch: Partial<PlanRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { label: `Cuota ${prev.length + 1}`, amount: "", dueAt: "" },
    ]);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    if (!rows.length) {
      setError("Añade al menos una cuota.");
      return;
    }

    let installments: Array<{ id?: string; label: string; amount: number; dueAt: string | null }>;
    try {
      installments = rows.map((row, index) => {
        const amount = Number(row.amount);
        if (!Number.isFinite(amount) || amount < 0) {
          throw new Error(`Importe no válido en «${row.label || `Cuota ${index + 1}`}».`);
        }
        return {
          id: row.id,
          label: row.label.trim() || `Cuota ${index + 1}`,
          amount,
          dueAt: row.dueAt || null,
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revisa los importes.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/payments/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, installments }),
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
        aria-labelledby="payment-plan-title"
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-[#0F1623]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="payment-plan-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
              Plan de cobro
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

        <p className="mt-3 text-xs text-slate-500">
          Define el total del viajero y las cuotas (importe y fecha de cada pago). Las cuotas ya cobradas
          conservan su estado; puedes cambiar importes y vencimientos de las pendientes.
        </p>

        {error ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
        ) : null}

        <div className="mt-4 space-y-2">
          {rows.map((row, index) => {
            const isPaid = row.status === "paid";
            return (
              <div
                key={row.id ?? `new-${index}`}
                className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/30 sm:grid-cols-[1fr_120px_140px_auto]"
              >
                <label className="block min-w-0">
                  <span className={agencyLabelClass}>Concepto</span>
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) => updateRow(index, { label: e.target.value })}
                    className={`${agencyInputClass} mt-1`}
                    disabled={isPaid}
                  />
                </label>
                <label className="block">
                  <span className={agencyLabelClass}>Importe</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.amount}
                    onChange={(e) => updateRow(index, { amount: e.target.value })}
                    className={`${agencyInputClass} mt-1`}
                  />
                </label>
                <label className="block">
                  <span className={agencyLabelClass}>Vencimiento</span>
                  <input
                    type="date"
                    value={row.dueAt}
                    onChange={(e) => updateRow(index, { dueAt: e.target.value })}
                    className={`${agencyInputClass} mt-1`}
                  />
                </label>
                <div className="flex items-end gap-1 pb-0.5">
                  {isPaid ? (
                    <span className="rounded bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-800">
                      Pagada
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={rows.length <= 1}
                      onClick={() => removeRow(index)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-white disabled:opacity-40 dark:border-slate-700"
                      aria-label="Eliminar cuota"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addRow}
          className={`${agencyBtnSecondaryClass} mt-3 gap-1 text-xs`}
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir cuota
        </button>

        <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
          Total del plan: {formatMoney(Math.round(total * 100) / 100, currency)}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => void save()} className={agencyBtnPrimaryClass}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar plan
          </button>
          <button type="button" disabled={busy} onClick={onClose} className={agencyBtnSecondaryClass}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
