"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { KAVIRO_TRIP_HELP_TOGGLE_EVENT } from "@/lib/trip-section-hints";

const STORAGE_PREFIX = "kaviro-trip-welcome-";

export default function TripWelcomeBanner({ tripId, tripMode = "travel" }: { tripId: string; tripMode?: "travel" | "expenses" }) {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isMobile) return;
    try {
      const key = `${STORAGE_PREFIX}${tripId}`;
      if (!localStorage.getItem(key)) setVisible(true);
    } catch {
      /* */
    }
  }, [tripId, isMobile]);

  useEffect(() => {
    if (!isMobile) return;
    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ open?: boolean }>).detail;
      const next = typeof detail?.open === "boolean" ? detail.open : true;
      if (!next) {
        setVisible(false);
        return;
      }
      try {
        const key = `${STORAGE_PREFIX}${tripId}`;
        if (!localStorage.getItem(key)) setVisible(true);
      } catch {
        setVisible(true);
      }
    };
    window.addEventListener(KAVIRO_TRIP_HELP_TOGGLE_EVENT, onToggle);
    return () => window.removeEventListener(KAVIRO_TRIP_HELP_TOGGLE_EVENT, onToggle);
  }, [isMobile, tripId]);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${tripId}`, "1");
    } catch {
      /* */
    }
    setVisible(false);
  }

  const planHref = `/trip/${tripId}/${tripMode === "expenses" ? "expenses" : "plan"}`;
  const message =
    tripMode === "expenses"
      ? "Grupo de gastos creado — añade el primer ticket y mira los balances."
      : "Eres nuevo aquí — empieza por el Plan o invita a tu grupo en Gente.";

  return (
    <div className="mb-2 flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2 shadow-sm dark:border-[#334155] dark:bg-[#0F1623]/80">
      <p className="flex-1 text-[11px] font-medium leading-snug text-slate-600 dark:text-slate-300">
        {message}{" "}
        <Link href={planHref} className="font-semibold text-[var(--brand)] hover:underline" onClick={dismiss}>
          Ir →
        </Link>
      </p>
      <button type="button" onClick={dismiss} className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B]" aria-label="Cerrar">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
