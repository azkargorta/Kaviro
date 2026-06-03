"use client";

import { Car, Bus, Bike, Footprints } from "lucide-react";
import {
  ROUTE_TRAVEL_MODE_OPTIONS,
  type TripRouteTravelMode,
} from "@/lib/route-travel-mode";

const ICONS: Record<TripRouteTravelMode, typeof Car> = {
  DRIVING: Car,
  TRANSIT: Bus,
  WALKING: Footprints,
  BICYCLING: Bike,
};

type Props = {
  value: TripRouteTravelMode;
  onChange: (mode: TripRouteTravelMode) => void;
  disabled?: boolean;
  compact?: boolean;
};

export default function RouteTravelModePicker({ value, onChange, disabled = false, compact = false }: Props) {
  return (
    <div
      className={compact ? "grid grid-cols-2 gap-2 sm:grid-cols-4" : "grid grid-cols-2 gap-2 sm:grid-cols-4"}
      role="radiogroup"
      aria-label="Modo de transporte de la ruta"
    >
      {ROUTE_TRAVEL_MODE_OPTIONS.map((opt) => {
        const active = value === opt.value;
        const Icon = ICONS[opt.value];
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`inline-flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-center transition disabled:opacity-50 ${
              active
                ? "border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand-text)] shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[var(--brand)]" : "text-slate-500"}`} aria-hidden />
            <span className="text-[11px] font-bold leading-tight">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
