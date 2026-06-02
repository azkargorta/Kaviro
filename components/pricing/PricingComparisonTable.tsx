"use client";

import { Check, X } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { PRICING_COMPARISON_ROWS } from "@/lib/pricing-public";

function Cell({ value, premium = false }: { value: boolean | string; premium?: boolean }) {
  if (typeof value === "string") {
    return (
      <span
        className={`text-center text-[11px] font-semibold leading-tight ${
          premium ? "text-[var(--brand)]" : "text-slate-600 dark:text-slate-400"
        }`}
      >
        {value}
      </span>
    );
  }
  return (
    <span className="flex justify-center">
      {value ? (
        <Check className={`h-4 w-4 ${premium ? "text-[var(--brand)]" : "text-emerald-500"}`} />
      ) : (
        <X className="h-4 w-4 text-slate-300 dark:text-slate-600" />
      )}
    </span>
  );
}

export default function PricingComparisonTable() {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-[#1E293B]">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Comparativa de planes</h3>
        </div>
        <div className="grid grid-cols-[1fr_88px_88px] items-center border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-[#1E293B] dark:bg-[#080C14]">
          <span>Función</span>
          <span className="text-center">Gratis</span>
          <span className="text-center text-[var(--brand)]">Premium</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-[#1E293B]">
          {PRICING_COMPARISON_ROWS.map((row, idx) => (
            <Reveal key={row.feature} variant="fade" delay={(idx % 4) as 0 | 1 | 2 | 3}>
              <div className="grid grid-cols-[1fr_88px_88px] items-center px-6 py-3">
                <span className="text-sm text-slate-700 dark:text-slate-300">{row.feature}</span>
                <Cell value={row.free} />
                <Cell value={row.premium} premium />
              </div>
            </Reveal>
          ))}
        </div>
    </div>
  );
}
