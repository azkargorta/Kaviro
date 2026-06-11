"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

type Props = {
  open: boolean;
  debtorName: string;
  creditorName: string;
  amountLabel: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function SettlementConfirmDialog({
  open,
  debtorName,
  creditorName,
  amountLabel,
  confirming = false,
  onConfirm,
  onCancel,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="settlement-confirm-title">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-[#334155] dark:bg-[#0F1623]">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
        </div>

        <h2 id="settlement-confirm-title" className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">
          ¿Marcar como pagado?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">{debtorName}</span> pagó{" "}
          <span className="font-bold text-[var(--brand)]">{amountLabel}</span> a{" "}
          <span className="font-semibold text-slate-900 dark:text-white">{creditorName}</span>.
          Los balances se actualizarán.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="min-h-[44px] flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-[#334155] dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="min-h-[44px] flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {confirming ? "Guardando…" : "Confirmar pago"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
