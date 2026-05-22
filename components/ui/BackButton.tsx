"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/**
 * BackButton — vuelve a la página anterior del historial.
 * Si no hay historial (acceso directo), va a /dashboard.
 */
export default function BackButton({ fallback = "/dashboard", label = "Volver" }: {
  fallback?: string;
  label?: string;
}) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-300 dark:hover:bg-[#1E293B]"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
