"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import CreateTripForm from "@/components/dashboard/CreateTripForm";
import Link from "next/link";
import { FREE_TRIP_LIMIT, freeTripLimitMessage } from "@/lib/premium-copy";
import type { CreateTripOpenMode } from "@/lib/open-create-trip";

type Props = {
  isPremium: boolean;
  tripCount: number;
};

export default function DashboardCreateTripOverlay({ isPremium, tripCount }: Props) {
  const locked = !isPremium && tripCount >= FREE_TRIP_LIMIT;
  const [open, setOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<CreateTripOpenMode>("travel");

  const close = useCallback(() => {
    setOpen(false);
    if (typeof window !== "undefined" && window.location.hash.startsWith("#create-trip")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const handleOpen = useCallback(
    (mode: CreateTripOpenMode) => {
      if (locked) return;
      setInitialMode(mode);
      setOpen(true);
    },
    [locked]
  );

  useEffect(() => {
    const onOpen = (event: Event) => {
      const mode = (event as CustomEvent<{ mode?: CreateTripOpenMode }>).detail?.mode;
      handleOpen(mode === "expenses" ? "expenses" : "travel");
    };
    window.addEventListener("kaviro:open-create-trip", onOpen);
    return () => window.removeEventListener("kaviro:open-create-trip", onOpen);
  }, [handleOpen]);

  useEffect(() => {
    const syncHash = () => {
      if (locked) return;
      const hash = window.location.hash;
      if (hash === "#create-trip-expenses") handleOpen("expenses");
      else if (hash === "#create-trip") handleOpen("travel");
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [handleOpen, locked]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open && !locked) return null;

  if (locked && open) {
    return (
      <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/50 p-4 sm:items-center">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 shadow-xl dark:border-amber-800/40 dark:bg-[#0F1623]">
          <p className="text-sm text-amber-950 dark:text-amber-100">{freeTripLimitMessage()}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/account?upgrade=premium&focus=premium#premium-plans"
              className="inline-flex rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white"
            >
              Mejorar a Premium
            </Link>
            <button
              type="button"
              onClick={close}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-trip-overlay-title"
        className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl dark:border-[#1E293B] dark:bg-[#0F1623]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="create-trip-overlay-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Nuevo viaje
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Plan, gastos y rutas en un solo lugar
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#1E293B]"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <CreateTripForm isPremium={isPremium} initialMode={initialMode} />
      </div>
    </div>
  );
}
