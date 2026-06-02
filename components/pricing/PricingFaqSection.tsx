"use client";

import Reveal from "@/components/ui/Reveal";
import { PRICING_FAQ } from "@/lib/pricing-public";

export default function PricingFaqSection() {
  return (
    <Reveal variant="fade" className="mt-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] md:p-8">
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">Preguntas frecuentes</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {PRICING_FAQ.map(({ q, a }, idx) => (
            <Reveal key={q} variant="slide" delay={(idx % 4) as 0 | 1 | 2 | 3}>
              <div className="h-full rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-[#1E293B] dark:bg-[#080C14]">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{q}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
