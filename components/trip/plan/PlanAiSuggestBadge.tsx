"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { PREMIUM_UPGRADE_HREF } from "@/lib/premium-copy";

type Props = {
  tripId: string;
  premiumEnabled: boolean;
  selectedDate?: string | null;
  onOpenAssistant?: () => void;
};

export default function PlanAiSuggestBadge({ tripId, premiumEnabled, selectedDate, onOpenAssistant }: Props) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  useEffect(() => {
    if (!premiumEnabled || dismissed) return;

    const cacheKey = `kaviro_plan_suggest:${tripId}:${selectedDate || "all"}`;
    try {
      const cached = window.sessionStorage.getItem(cacheKey);
      if (cached) {
        setSuggestion(cached === "none" ? null : cached);
        return;
      }
    } catch {
      // ignore
    }

    let cancelled = false;
    setLoading(true);
    void fetch("/api/trip-ai/plan-suggestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, date: selectedDate || undefined }),
    })
      .then(async (r) => {
        const payload = await r.json().catch(() => null);
        if (!r.ok) throw new Error(payload?.error || "No disponible");
        return payload;
      })
      .then((payload) => {
        if (cancelled) return;
        const text = typeof payload?.suggestion === "string" ? payload.suggestion.trim() : "";
        const value = text || null;
        try {
          window.sessionStorage.setItem(cacheKey, value ?? "none");
        } catch {
          // ignore
        }
        setSuggestion(value);
      })
      .catch(() => {
        if (!cancelled) setSuggestion(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tripId, premiumEnabled, selectedDate, dismissed]);

  if (dismissed) return null;

  if (!premiumEnabled) {
    return (
      <div className="pointer-events-none absolute -bottom-4 -right-2 z-10 sm:-right-4">
        <button
          type="button"
          onClick={() => setShowUpsell(true)}
          className="pointer-events-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-xl transition hover:border-[#F87171]/40 dark:border-[#1E293B] dark:bg-[#0F1623]"
        >
          <p className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
            <Sparkles className="h-3.5 w-3.5 text-[#F87171]" aria-hidden />
            IA sugiere
          </p>
          <p className="mt-0.5 max-w-[11rem] text-[10px] text-slate-500 dark:text-slate-400">Desbloquea sugerencias inteligentes con Premium</p>
        </button>
        {showUpsell ? (
          <div className="pointer-events-auto absolute bottom-full right-0 mb-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-[#1E293B] dark:bg-[#0F1623]">
            <p className="text-xs font-bold text-slate-900 dark:text-white">Sugerencias IA del plan</p>
            <p className="mt-1 text-[11px] text-slate-500">La IA detecta huecos, traslados y mejoras para tu itinerario.</p>
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

  if (loading && !suggestion) {
    return (
      <div className="pointer-events-none absolute -bottom-4 -right-2 z-10 sm:-right-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-[#1E293B] dark:bg-[#0F1623]">
          <p className="text-xs font-bold text-slate-900 dark:text-white">✨ IA sugiere</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Analizando tu plan…</p>
        </div>
      </div>
    );
  }

  if (!suggestion) return null;

  return (
    <div className="pointer-events-none absolute -bottom-4 -right-2 z-10 sm:-right-4">
      <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-[#1E293B] dark:bg-[#0F1623]">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white">✨ IA sugiere</p>
            <p className="mt-0.5 max-w-[12rem] text-[10px] leading-snug text-slate-500 dark:text-slate-400">{suggestion}</p>
            {onOpenAssistant ? (
              <button
                type="button"
                onClick={onOpenAssistant}
                className="mt-2 text-[10px] font-bold text-[#F87171] hover:underline"
              >
                Abrir asistente →
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar sugerencia"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
