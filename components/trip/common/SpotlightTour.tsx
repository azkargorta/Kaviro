"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, Map } from "lucide-react";
import type { SpotlightStep } from "./trip-tour-types";

const PAD = 10;
const TW = 320;

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

function getRect(sel: string | null): Rect | null {
  if (!sel) return null;
  try {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top + scrollY - PAD, left: r.left + scrollX - PAD, width: r.width + PAD*2, height: r.height + PAD*2 };
  } catch { return null; }
}

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(v, b)); }

function tipPos(rect: Rect | null, placement: SpotlightStep["placement"]) {
  const vw = window.innerWidth, TH = 230, GAP = 14, SY = scrollY;
  if (!rect || placement === "center") return { top: SY + window.innerHeight/2 - TH/2, left: vw/2 - TW/2 };
  let top = 0, left = 0;
  switch (placement) {
    case "bottom": top = rect.top + rect.height + GAP; left = rect.left + rect.width/2 - TW/2; break;
    case "top":    top = rect.top - TH - GAP;          left = rect.left + rect.width/2 - TW/2; break;
    case "right":  top = rect.top + rect.height/2 - TH/2; left = rect.left + rect.width + GAP; break;
    case "left":   top = rect.top + rect.height/2 - TH/2; left = rect.left - TW - GAP; break;
  }
  return { top: clamp(top, SY+8, SY+window.innerHeight-TH-8), left: clamp(left, 8, vw-TW-8) };
}

/** Execute a pre-step action: expand days, switch view mode, etc. */
function executeAction(action?: SpotlightStep["action"]) {
  if (!action) return;
  if (action === "expand-days") {
    // Click all collapsed day headers to expand them
    document.querySelectorAll('[data-tour="plan-day-sections"] button[aria-expanded="false"]')
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
    // Only click if lists are not already showing
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
    const btn = document.querySelector('[data-tour="participants-qr-btn"]') as HTMLElement | null;
    btn?.click();
  }
}

type Props = {
  steps: SpotlightStep[];
  tripId: string;
  currentTab: string;
  /** If true, only show steps for currentTab — no cross-tab navigation */
  filterToTab?: boolean;
  onClose: () => void;
  onComplete: () => void;
};

export default function SpotlightTour({ steps, tripId, currentTab, filterToTab = false, onClose, onComplete }: Props) {
  // Filter to current tab only when requested (non-demo trips)
  const effectiveSteps = filterToTab ? steps.filter((s) => (TAB_ROUTES[s.tab] ?? s.tab) === currentTab) : steps;
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const step = effectiveSteps[idx];
  const isLast = idx >= effectiveSteps.length - 1;
  const isFirst = idx === 0;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!step || !mounted) return;
    const targetTab = TAB_ROUTES[step.tab] ?? step.tab;
    const needsNav = targetTab !== currentTab;

    if (needsNav) {
      setNavigating(true);
      setRect(null);
      router.push(`/trip/${tripId}/${targetTab}`);
      const t = setTimeout(() => {
        setNavigating(false);
        executeAction(step.action);
        const t2 = setTimeout(() => {
          if (step.target) document.querySelector(step.target)?.scrollIntoView({ behavior: "smooth", block: "center" });
          const t3 = setTimeout(() => setRect(getRect(step.target)), 400);
          return () => clearTimeout(t3);
        }, 400);
        return () => clearTimeout(t2);
      }, 1200);
      return () => clearTimeout(t);
    }

    setNavigating(false);
    executeAction(step.action);
    const t = setTimeout(() => {
      if (step.target) document.querySelector(step.target)?.scrollIntoView({ behavior: "smooth", block: "center" });
      const t2 = setTimeout(() => setRect(getRect(step.target)), 350);
      return () => clearTimeout(t2);
    }, step.action ? 400 : 0);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, mounted]);

  useEffect(() => {
    const u = () => setRect(getRect(step?.target ?? null));
    window.addEventListener("resize", u);
    window.addEventListener("scroll", u, { passive: true });
    return () => { window.removeEventListener("resize", u); window.removeEventListener("scroll", u); };
  }, [step?.target]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); isLast ? onComplete() : setIdx(i => i+1); }
      if (e.key === "ArrowLeft" && !isFirst) { e.preventDefault(); setIdx(i => i-1); }
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [isFirst, isLast, onClose, onComplete]);

  if (!mounted || !step) return null;

  const vw = window.innerWidth, vh = window.innerHeight, SY = scrollY;

  const mask = rect
    ? `M0 0H${vw}V${vh}H0Z M${rect.left} ${rect.top-SY}H${rect.left+rect.width}V${rect.top-SY+rect.height}H${rect.left}Z`
    : `M0 0H${vw}V${vh}H0Z`;

  const pos = tipPos(rect, step.placement);
  const tw = Math.min(TW, vw - 24);

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, pointerEvents: "none" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: navigating ? "none" : "auto" }} onClick={onClose}>
        <path fillRule="evenodd" d={mask} fill="rgba(15,23,42,0.76)" />
      </svg>

      {rect && !navigating && (
        <div style={{ position: "absolute", top: rect.top-SY, left: rect.left, width: rect.width, height: rect.height, borderRadius: 14, outline: "2.5px solid #F87171", boxShadow: "0 0 0 5px rgba(248,113,113,0.2)", pointerEvents: "none", animation: "kaviro-pulse 2s ease-in-out infinite" }} />
      )}

      {navigating && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", borderRadius: 16, padding: "20px 28px", boxShadow: "0 8px 40px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 12, pointerEvents: "none" }}>
          <Map size={20} style={{ color: "#F87171" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Navegando a {TAB_LABELS[step.tab] ?? step.tab}...</span>
        </div>
      )}

      {!navigating && (
        <div style={{ position: "absolute", top: pos.top - SY, left: pos.left, width: tw, pointerEvents: "auto", zIndex: 1201, borderRadius: 18, background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 8px 40px rgba(0,0,0,0.16)", overflow: "hidden" }}>
          {/* Tab label bar */}
          <div style={{ background: "#fef2f2", borderBottom: "1px solid #fee2e2", padding: "7px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#F87171", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {TAB_LABELS[step.tab] ?? step.tab} · {idx+1} de {effectiveSteps.length}
            </span>
            <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 6, color: "#fca5a5" }} aria-label="Cerrar tour">
              <X size={13} />
            </button>
          </div>

          {/* Title */}
          <div style={{ padding: "13px 16px 8px", display: "flex", alignItems: "center", gap: 9 }}>
            {step.emoji && <span style={{ fontSize: 22 }}>{step.emoji}</span>}
            <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{step.title}</span>
          </div>

          {/* Body */}
          <p style={{ margin: "0 16px 14px", fontSize: 12.5, lineHeight: 1.65, color: "#475569" }}>{step.body}</p>



          {/* Nav footer */}
          <div style={{ borderTop: "1px solid #f8fafc", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 3, background: "#F87171", width: `${((idx + 1) / effectiveSteps.length) * 100}%`, transition: "width 0.35s ease" }} /></div>
            <div style={{ display: "flex", gap: 6 }}>
              {!isFirst && (
                <button type="button" onClick={() => setIdx(i => i-1)} style={{ height: 32, width: 32, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }} aria-label="Anterior">
                  <ChevronLeft size={14} />
                </button>
              )}
              <button type="button" onClick={() => isLast ? onComplete() : setIdx(i => i+1)}
                style={{ height: 32, padding: "0 14px", borderRadius: 10, border: "none", background: "#F87171", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                {isLast ? "¡Listo! ✓" : <><span>Siguiente</span><ChevronRight size={12} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes kaviro-pulse { 0%,100% { box-shadow: 0 0 0 5px rgba(248,113,113,0.2); } 50% { box-shadow: 0 0 0 8px rgba(248,113,113,0.08); } }`}</style>
    </div>,
    document.body
  );
}
