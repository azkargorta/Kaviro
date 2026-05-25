"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { PREMIUM_UPGRADE_HREF } from "@/lib/premium-copy";
import {
  buildPlanFullTripAnalysisChatPrompt,
  dispatchTripAssistantOpen,
} from "@/lib/trip-assistant-events";

type Props = {
  tripId: string;
  premiumEnabled: boolean;
  tripName?: string | null;
  selectedDate?: string | null;
};

export default function PlanAiSuggestBadge({ tripId, premiumEnabled, tripName, selectedDate }: Props) {
  const [showUpsell, setShowUpsell] = useState(false);

  function openPlanAnalysis() {
    dispatchTripAssistantOpen({
      tripId,
      initialMessage: buildPlanFullTripAnalysisChatPrompt({
        tripName,
        focusDate: selectedDate,
      }),
      mode: "optimizer",
    });
  }

  if (!premiumEnabled) {
    return (
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setShowUpsell(true)}
          className="inline-flex max-w-[min(100%,11rem)] items-center gap-1.5 rounded-xl border border-white/35 bg-white/15 px-2.5 py-1.5 text-left text-white shadow-sm transition hover:bg-white/25"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="text-[11px] font-bold leading-snug">IA sugiere</span>
        </button>
        {showUpsell ? (
          <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-[#1E293B] dark:bg-[#0F1623]">
            <p className="text-xs font-bold text-slate-900 dark:text-white">Análisis IA del plan</p>
            <p className="mt-1 text-[11px] text-slate-500">
              La IA revisa todos los días, detecta huecos y propone mejoras aplicables de una vez.
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                href={PREMIUM_UPGRADE_HREF}
                className="inline-flex min-h-[34px] flex-1 items-center justify-center rounded-xl bg-[var(--brand)] px-3 text-[11px] font-bold text-white hover:bg-[var(--brand-hover)]"
              >
                Premium
              </Link>
              <button
                type="button"
                onClick={() => setShowUpsell(false)}
                className="inline-flex min-h-[34px] items-center justify-center rounded-xl border border-slate-200 px-3 text-[11px] font-semibold text-slate-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={openPlanAnalysis}
      className="inline-flex max-w-[min(100%,11rem)] shrink-0 items-center gap-1.5 rounded-xl border border-white/35 bg-white/15 px-2.5 py-1.5 text-left text-white shadow-sm transition hover:bg-white/25"
      title="Analizar el plan completo del viaje con IA"
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="text-[11px] font-bold leading-snug">IA sugiere</span>
    </button>
  );
}
