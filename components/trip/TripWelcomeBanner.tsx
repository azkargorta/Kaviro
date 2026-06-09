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
    <div className="mb-2 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 md:mb-4 md:gap-3 md:rounded-2xl md:px-4 md:py-3 dark:border-sky-900/50 dark:bg-sky-950/40">
      <p className="flex-1 text-xs font-semibold leading-snug text-sky-950 md:text-sm dark:text-sky-100">
        {message}{" "}
        <Link href={planHref} className="font-bold text-[#0B5CFF] underline" onClick={dismiss}>
          Ir →
        </Link>
      </p>
      <button type="button" onClick={dismiss} className="shrink-0 rounded-lg p-1 text-sky-700 hover:bg-sky-100" aria-label="Cerrar">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
