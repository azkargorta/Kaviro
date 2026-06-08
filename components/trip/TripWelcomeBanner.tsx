"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_PREFIX = "kaviro-trip-welcome-";

export default function TripWelcomeBanner({ tripId, tripMode = "travel" }: { tripId: string; tripMode?: "travel" | "expenses" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const key = `${STORAGE_PREFIX}${tripId}`;
      if (!localStorage.getItem(key)) setVisible(true);
    } catch {
      /* */
    }
  }, [tripId]);

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
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-900/50 dark:bg-sky-950/40">
      <p className="flex-1 text-sm font-semibold text-sky-950 dark:text-sky-100">
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
