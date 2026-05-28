"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, Map } from "lucide-react";
import type { SpotlightStep } from "./trip-tour-types";

const PAD = 10;
const TW = 320;
const MOBILE_MAX = 767;
/** Barra inferior del viaje + margen */
const MOBILE_BOTTOM_UI = 76;
/** Altura reservada para la tarjeta del tour en móvil */
const MOBILE_TIP_RESERVE = 260;
const MOBILE_TOP_SAFE = 64;

const TAB_ROUTES: Record<string, string> = {
  summary: "summary", plan: "plan", map: "map",
  expenses: "expenses", participants: "participants",
  resources: "resources", "ai-chat": "ai-chat", ai: "ai-chat",
};

const TAB_LABELS: Record<string, string> = {
  summary: "Resumen", plan: "Plan", map: "Rutas",
  expenses: "Gastos", participants: "Gente",
  resources: "Docs", "ai-chat": "Asistente IA", ai: "Asistente IA",
};

type Rect = { top: number; left: number; width: number; height: number };

function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth <= MOBILE_MAX;
}

function getRect(sel: string | null, alt?: string | null): Rect | null {
  for (const q of [sel, alt]) {
    if (!q) continue;
    try {
      const el = document.querySelector(q);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 && r.height < 2) continue;
      return {
        top: r.top + window.scrollY - PAD,
        left: r.left + window.scrollX - PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      };
    } catch {
      /* try next */
    }
  }
  return null;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(v, b));
}

function scrollTargetIntoTourSafeZone(sel: string | null, alt?: string | null) {
  for (const q of [sel, alt]) {
    if (!q) continue;
    const el = document.querySelector(q);
    if (!el) continue;

    if (!isMobileViewport()) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      return;
    }

    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const bottomLimit = vh - MOBILE_BOTTOM_UI - MOBILE_TIP_RESERVE - 12;
    const topLimit = MOBILE_TOP_SAFE;

    if (r.bottom > bottomLimit) {
      window.scrollBy({ top: r.bottom - bottomLimit + 16, behavior: "smooth" });
    } else if (r.top < topLimit) {
      window.scrollBy({ top: r.top - topLimit - 16, behavior: "smooth" });
    }
    return;
  }
}

function tipPosDesktop(rect: Rect | null, placement: SpotlightStep["placement"]) {
  const vw = window.innerWidth;
  const TH = 230;
  const GAP = 14;
  const SY = window.scrollY;
  if (!rect || placement === "center") {
    return { top: SY + window.innerHeight / 2 - TH / 2, left: vw / 2 - TW / 2 };
  }
  let top = 0;
  let left = 0;
  switch (placement) {
    case "bottom":
      top = rect.top + rect.height + GAP;
      left = rect.left + rect.width / 2 - TW / 2;
      break;
    case "top":
      top = rect.top - TH - GAP;
      left = rect.left + rect.width / 2 - TW / 2;
      break;
    case "right":
      top = rect.top + rect.height / 2 - TH / 2;
      left = rect.left + rect.width + GAP;
      break;
    case "left":
      top = rect.top + rect.height / 2 - TH / 2;
      left = rect.left - TW - GAP;
      break;
  }
  return {
    top: clamp(top, SY + 8, SY + window.innerHeight - TH - 8),
    left: clamp(left, 8, vw - TW - 8),
  };
}

/** Execute a pre-step action: expand days, switch view mode, etc. */
function executeAction(action?: SpotlightStep["action"]) {
  if (!action) return;
  if (action === "expand-days") {
    document
      .querySelectorAll('[data-tour="plan-day-sections"] button[aria-expanded="false"]')
      .forEach((btn) => (btn as HTMLElement).click());
  }
  if (action === "calendar-mode") {
    const btn = document.querySelector('[data-tour="plan-calendar-mode"]') as HTMLElement | null;
    btn?.click();
  }
  if (action === "open-expenses-list") {
    const el = document.querySelector('[data-tour="expenses-list-details"]') as HTMLDetailsElement | null;
    if (el && !el.open) el.open = true;
  }
  if (action === "open-expenses-currency") {
    const el = document.querySelector('[data-tour="expenses-currency-details"]') as HTMLDetailsElement | null;
    if (el && !el.open) el.open = true;
  }
  if (action === "open-resources-lists") {
    const btn = document.querySelector('[data-tour="resources-lists-btn"]') as HTMLElement | null;
    const section = document.querySelector('[data-tour="resources-lists-section"]');
    if (btn && section && !section.querySelector('[data-tour="resources-lists-panel"]')) btn.click();
  }
  if (action === "open-expenses-stats") {
    const btn = document.querySelector('[data-tour="expenses-stats-btn"]') as HTMLElement | null;
    btn?.click();
  }
  if (action === "open-participants-invite") {
    const btn = document.querySelector('[data-tour="participants-invite-btn"]') as HTMLElement | null;
    btn?.click();
  }
  if (action === "open-participants-qr") {
    if (!document.querySelector('[data-tour="participants-qr"]')) {
      const btn = document.querySelector('[data-tour="participants-invite-btn"]') as HTMLElement | null;
      btn?.click();
    }
  }
  if (action === "open-summary-search") {
    const panel = document.querySelector('[data-tour="summary-search-travel"]');
    if (panel?.getAttribute("data-search-open") === "1") return;
    const toggle = document.querySelector('[data-tour="summary-search-toggle"]') as HTMLElement | null;
    toggle?.click();
  }
}

type Props = {
  steps: SpotlightStep[];
  tripId: string;
  currentTab: string;
  filterToTab?: boolean;
  onClose: () => void;
  onComplete: () => void;
};

export default function SpotlightTour({
  steps,
  tripId,
  currentTab,
  filterToTab = false,
  onClose,
  onComplete,
}: Props) {
  const effectiveSteps = filterToTab
    ? steps.filter((s) => (TAB_ROUTES[s.tab] ?? s.tab) === currentTab)
    : steps;
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const step = effectiveSteps[idx];
  const isLast = idx >= effectiveSteps.length - 1;
  const isFirst = idx === 0;

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!step || !mounted) return;
    const targetTab = TAB_ROUTES[step.tab] ?? step.tab;
    const needsNav = targetTab !== currentTab;

    let tMain: ReturnType<typeof setTimeout>;
    let tMeasure: ReturnType<typeof setTimeout>;
    let tRect: ReturnType<typeof setTimeout>;

    const measure = () => {
      scrollTargetIntoTourSafeZone(step.target, step.targetAlt);
      const delay = isMobileViewport() ? 450 : 350;
      tRect = setTimeout(() => setRect(getRect(step.target, step.targetAlt)), delay);
    };

    if (needsNav) {
      setNavigating(true);
      setRect(null);
      router.push(`/trip/${tripId}/${targetTab}`);
      tMain = setTimeout(() => {
        setNavigating(false);
        executeAction(step.action);
        tMeasure = setTimeout(measure, 400);
      }, 1200);
      return () => {
        clearTimeout(tMain);
        clearTimeout(tMeasure);
        clearTimeout(tRect);
      };
    }

    setNavigating(false);
    executeAction(step.action);
    tMain = setTimeout(measure, step.action ? 400 : 80);
    return () => {
      clearTimeout(tMain);
      clearTimeout(tRect);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, mounted, currentTab]);

  useEffect(() => {
    const u = () => setRect(getRect(step?.target ?? null, step?.targetAlt ?? null));
    window.addEventListener("resize", u);
    window.addEventListener("scroll", u, { passive: true });
    return () => {
      window.removeEventListener("resize", u);
      window.removeEventListener("scroll", u);
    };
  }, [step?.target, step?.targetAlt]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        if (isLast) onComplete();
        else setIdx((i) => i + 1);
      }
      if (e.key === "ArrowLeft" && !isFirst) {
        e.preventDefault();
        setIdx((i) => i - 1);
      }
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [isFirst, isLast, onClose, onComplete]);

  if (!mounted || !step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const SY = window.scrollY;
  /** En móvil la tarjeta va siempre abajo (encima del nav) para no tapar el foco. */
  const useMobileSheet = isMobile;

  const mask = rect
    ? `M0 0H${vw}V${vh}H0Z M${rect.left} ${rect.top - SY}H${rect.left + rect.width}V${rect.top - SY + rect.height}H${rect.left}Z`
    : `M0 0H${vw}V${vh}H0Z`;

  const pos = useMobileSheet ? null : tipPosDesktop(rect, step.placement);
  const tw = Math.min(TW, vw - 24);

  const tipCard = (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-[#fee2e2] bg-[#fef2f2] px-3.5 py-2 dark:border-[#F87171]/20 dark:bg-[#F87171]/10">
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#F87171]">
          {TAB_LABELS[step.tab] ?? step.tab} · {idx + 1} de {effectiveSteps.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-[#fca5a5] transition hover:bg-[#fee2e2] dark:hover:bg-[#F87171]/20"
          aria-label="Cerrar tour"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 pb-2 pt-3">
        {step.emoji ? <span className="text-xl leading-none">{step.emoji}</span> : null}
        <span className="text-sm font-extrabold text-slate-900 dark:text-white">{step.title}</span>
      </div>

      <p className="px-4 pb-3 text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">{step.body}</p>

      <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-[#F87171] transition-all duration-300"
            style={{ width: `${((idx + 1) / effectiveSteps.length) * 100}%` }}
          />
        </div>
        <div className="flex shrink-0 gap-1.5">
          {!isFirst ? (
            <button
              type="button"
              onClick={() => setIdx((i) => i - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              aria-label="Anterior"
            >
              <ChevronLeft size={15} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => (isLast ? onComplete() : setIdx((i) => i + 1))}
            className="flex h-9 items-center gap-1 rounded-xl bg-[#F87171] px-3.5 text-xs font-bold text-white"
          >
            {isLast ? "¡Listo! ✓" : (
              <>
                <span>Siguiente</span>
                <ChevronRight size={12} />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(
    <div className="fixed inset-0 z-[1200] pointer-events-none" role="dialog" aria-modal="true" aria-label="Visita guiada">
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ pointerEvents: navigating ? "none" : "auto" }}
        onClick={onClose}
        aria-hidden
      >
        <path fillRule="evenodd" d={mask} fill="rgba(15,23,42,0.78)" />
      </svg>

      {rect && !navigating && (
        <div
          className="pointer-events-none absolute rounded-[14px] outline outline-[2.5px] outline-[#F87171]"
          style={{
            top: rect.top - SY,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 5px rgba(248,113,113,0.22)",
            animation: "kaviro-pulse 2s ease-in-out infinite",
          }}
        />
      )}

      {navigating && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-xl dark:bg-[#0F1623]">
          <Map size={20} className="text-[#F87171]" />
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Navegando a {TAB_LABELS[step.tab] ?? step.tab}…
          </span>
        </div>
      )}

      {!navigating && useMobileSheet ? (
        <div
          className="pointer-events-auto fixed left-3 right-3 z-[1201] max-h-[min(42dvh,280px)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200/90 bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-[#0F1623]"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {tipCard}
        </div>
      ) : null}

      {!navigating && !useMobileSheet ? (
        <div
          className="pointer-events-auto absolute z-[1201] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-[#0F1623]"
          style={{
            top: (pos?.top ?? SY + vh / 2 - 115) - SY,
            left: pos?.left ?? vw / 2 - tw / 2,
            width: tw,
          }}
        >
          {tipCard}
        </div>
      ) : null}

      <style>{`@keyframes kaviro-pulse { 0%,100% { box-shadow: 0 0 0 5px rgba(248,113,113,0.22); } 50% { box-shadow: 0 0 0 8px rgba(248,113,113,0.08); } }`}</style>
    </div>,
    document.body
  );
}
