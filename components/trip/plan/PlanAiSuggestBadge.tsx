"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { PREMIUM_UPGRADE_HREF } from "@/lib/premium-copy";

type Props = {
  tripId: string;
  premiumEnabled: boolean;
  selectedDate?: string | null;
  onOpenAssistant?: (suggestion: string) => void;
};

type SuggestCache = {
  suggestions: string[];
  noMore: boolean;
};

function cacheKey(tripId: string, selectedDate?: string | null) {
  return `kaviro_plan_suggest:${tripId}:${selectedDate || "all"}`;
}

function readCache(key: string): SuggestCache | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SuggestCache;
    if (!parsed || !Array.isArray(parsed.suggestions)) return null;
    return {
      suggestions: parsed.suggestions.filter((item) => typeof item === "string" && item.trim()),
      noMore: Boolean(parsed.noMore),
    };
  } catch {
    return null;
  }
}

function writeCache(key: string, data: SuggestCache) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export default function PlanAiSuggestBadge({ tripId, premiumEnabled, selectedDate, onOpenAssistant }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [noMore, setNoMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  const currentSuggestion = suggestions.length > 0 ? suggestions[suggestions.length - 1] : null;
  const storageKey = cacheKey(tripId, selectedDate);

  const fetchSuggestion = useCallback(
    async (exclude: string[], mode: "initial" | "next") => {
      const setBusy = mode === "initial" ? setLoading : setLoadingNext;
      setBusy(true);
      try {
        const res = await fetch("/api/trip-ai/plan-suggestion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId,
            date: selectedDate || undefined,
            exclude,
          }),
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) throw new Error(payload?.error || "No disponible");

        const text = typeof payload?.suggestion === "string" ? payload.suggestion.trim() : "";
        if (text) {
          setSuggestions((prev) => {
            const next = [...prev, text];
            writeCache(storageKey, { suggestions: next, noMore: false });
            return next;
          });
          setNoMore(false);
          return true;
        }

        if (mode === "next" && exclude.length > 0) {
          setNoMore(true);
          writeCache(storageKey, { suggestions: exclude, noMore: true });
        }

        return false;
      } catch {
        if (mode === "next") {
          setNoMore(true);
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [tripId, selectedDate, storageKey]
  );

  useEffect(() => {
    if (!premiumEnabled || dismissed) return;

    setSuggestions([]);
    setNoMore(false);

    const cached = readCache(storageKey);
    if (cached && cached.suggestions.length > 0) {
      setSuggestions(cached.suggestions);
      setNoMore(cached.noMore);
      return;
    }

    let cancelled = false;
    void fetchSuggestion([], "initial");

    return () => {
      cancelled = true;
    };
  }, [tripId, premiumEnabled, selectedDate, dismissed, storageKey, fetchSuggestion]);

  async function handleNext() {
    if (loadingNext || noMore || suggestions.length === 0) return;
    const found = await fetchSuggestion(suggestions, "next");
    if (!found) setNoMore(true);
  }

  if (dismissed) return null;

  if (!premiumEnabled) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowUpsell(true)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-xl transition hover:border-[#F87171]/40 dark:border-[#1E293B] dark:bg-[#0F1623]"
        >
          <p className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
            <Sparkles className="h-3.5 w-3.5 text-[#F87171]" aria-hidden />
            IA sugiere
          </p>
          <p className="mt-0.5 max-w-[11rem] text-[10px] text-slate-500 dark:text-slate-400">Desbloquea sugerencias inteligentes con Premium</p>
        </button>
        {showUpsell ? (
          <div className="absolute bottom-full right-0 z-20 mb-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-[#1E293B] dark:bg-[#0F1623]">
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

  if (loading && !currentSuggestion) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-[#1E293B] dark:bg-[#0F1623]">
        <p className="text-xs font-bold text-slate-900 dark:text-white">✨ IA sugiere</p>
        <p className="mt-0.5 text-[10px] text-slate-400">Analizando tu plan…</p>
      </div>
    );
  }

  if (!currentSuggestion) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-[#1E293B] dark:bg-[#0F1623]">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-900 dark:text-white">✨ IA sugiere</p>
          <p className="mt-0.5 max-w-[12rem] text-[10px] leading-snug text-slate-500 dark:text-slate-400">{currentSuggestion}</p>
          {noMore ? (
            <p className="mt-1.5 max-w-[12rem] text-[10px] font-semibold leading-snug text-amber-600 dark:text-amber-400">
              No se encuentran nuevas propuestas.
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {onOpenAssistant ? (
              <button
                type="button"
                onClick={() => onOpenAssistant(currentSuggestion)}
                className="text-[10px] font-bold text-[#F87171] hover:underline"
              >
                Abrir asistente →
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void handleNext()}
              disabled={loadingNext || noMore}
              className="text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline dark:text-slate-400 dark:hover:text-slate-200"
            >
              {loadingNext ? "Buscando…" : "Siguiente →"}
            </button>
          </div>
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
  );
}
