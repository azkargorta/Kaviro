"use client";

import { Plus } from "lucide-react";
import { openCreateTripForm } from "@/lib/open-create-trip";

type Props = {
  /** Botón claro sobre header coral (legacy) */
  heroMode?: boolean;
  disabled?: boolean;
  className?: string;
};

export default function DashboardNewTripButton({ heroMode = false, disabled = false, className = "" }: Props) {
  const base = heroMode
    ? "inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[var(--brand-text)] shadow-sm transition hover:bg-white/95 disabled:opacity-50 sm:text-sm"
    : "inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--brand-hover)] disabled:opacity-50 sm:text-sm";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => openCreateTripForm()}
      className={`${base} ${className}`}
    >
      <Plus className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Nuevo viaje</span>
      <span className="sm:hidden">Nuevo</span>
    </button>
  );
}
