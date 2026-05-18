"use client";

import {
  useEffect, useLayoutEffect, useRef, useState, useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, Map } from "lucide-react";
import type { SpotlightStep } from "./trip-tour-types";

const PAD = 10;
const TOOLTIP_W = 320;

/** Map tour tab id → URL segment */
const TAB_ROUTES: Record<string, string> = {
  summary:      "summary",
  plan:         "plan",
  map:          "map",
  expenses:     "expenses",
  participants: "participants",
  resources:    "resources",
  "ai-chat":    "ai-chat",
  ai:           "ai-chat",
};

type Rect = { top: number; left: number; width: number; height: number };

function getRect(selector: string | null): Rect | null {
  if (!selector) return null;
  try {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top:    r.top    + window.scrollY - PAD,
      left:   r.left   + window.scrollX - PAD,
      width:  r.width  + PAD * 2,
      height: r.height + PAD * 2,
    };
  } catch { return null; }
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(v, max)); }

function tooltipPos(rect: Rect | null, placement: SpotlightStep["placement"]) {
  const vw = window.innerWidth;
  const TH = 220;
  const GAP = 14;
  const SY = window.scrollY;

  if (!rect || placement === "center") {
    return {
      top:  SY + window.innerHeight / 2 - TH / 2,
      left: vw / 2 - TOOLTIP_W / 2,
    };
  }

  let top = 0, left = 0;
  switch (placement) {
    case "bottom": top = rect.top + rect.height + GAP;         left = rect.left + rect.width / 2 - TOOLTIP_W / 2; break;
    case "top":    top = rect.top - TH - GAP;                  left = rect.left + rect.width / 2 - TOOLTIP_W / 2; break;
    case "right":  top = rect.top + rect.height / 2 - TH / 2; left = rect.left + rect.width + GAP;               break;
    case "left":   top = rect.top + rect.height / 2 - TH / 2; left = rect.left - TOOLTIP_W - GAP;                break;
  }

  return {
    top:  clamp(top,  SY + 12,  SY + window.innerHeight - TH - 12),
    left: clamp(left, 12,        vw - TOOLTIP_W - 12),
  };
}

type Props = {
  steps: SpotlightStep[];
  tripId: string;
  /** Current URL tab segment (e.g. "summary", "plan") */
  currentTab: string;
  onClose: () => void;
  onComplete: () => void;
};

export default function SpotlightTour({
  steps, tripId, currentTab, onClose, onComplete,
}: Props) {
  const router = useRouter();
  const [globalIdx, setGlobalIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const step = steps[globalIdx];
  const isLast = globalIdx >= steps.length - 1;
  const isFirst = globalIdx === 0;

  useEffect(() => { setMounted(true); }, []);

  // Navigate to correct tab if needed, then find element
  useEffect(() => {
    if (!step || !mounted) return;

    const targetTab = TAB_ROUTES[step.tab] ?? step.tab;
    const needsNav = targetTab !== currentTab;

    if (needsNav) {
      setNavigating(true);
      setRect(null);
      router.push(`/trip/${tripId}/${targetTab}`);
      // Wait for page to render, then try to find element
      const t = setTimeout(() => {
        setNavigating(false);
        if (step.target) {
          const el = document.querySelector(step.target);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        const t2 = setTimeout(() => setRect(getRect(step.target)), 600);
        return () => clearTimeout(t2);
      }, 1200);
      return () => clearTimeout(t);
    }

    // Same tab — find element immediately
    setNavigating(false);
    if (step.target) {
      const el = document.querySelector(step.target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const t = setTimeout(() => setRect(getRect(step.target)), 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalIdx, mounted]);

  // Update rect on resize/scroll
  useEffect(() => {
    const update = () => setRect(getRect(step?.target ?? null));
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update); };
  }, [step?.target]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); isLast ? onComplete() : setGlobalIdx((i) => i + 1); }
      if (e.key === "ArrowLeft" && !isFirst) { e.preventDefault(); setGlobalIdx((i) => i - 1); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFirst, isLast, onClose, onComplete]);

  if (!mounted || !step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const SY = window.scrollY;

  const maskPath = rect
    ? `M0 0H${vw}V${vh}H0Z M${rect.left} ${rect.top - SY}H${rect.left + rect.width}V${rect.top - SY + rect.height}H${rect.left}Z`
    : `M0 0H${vw}V${vh}H0Z`;

  const pos = tooltipPos(rect, step.placement);

  // Tab label for the navigation indicator
  const TAB_LABELS: Record<string, string> = {
    summary: "Resumen", plan: "Plan", map: "Rutas",
    expenses: "Gastos", participants: "Gente",
    resources: "Docs", "ai-chat": "Asistente IA", ai: "Asistente IA",
  };

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, pointerEvents: "none" }}>
      {/* Overlay with cutout */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: navigating ? "none" : "auto" }}
        onClick={onClose}
      >
        <path fillRule="evenodd" d={maskPath} fill="rgba(15,23,42,0.76)" />
      </svg>

      {/* Highlight ring */}
      {rect && !navigating && (
        <div style={{
          position: "absolute",
          top: rect.top - SY,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          borderRadius: 14,
          outline: "2.5px solid #F87171",
          boxShadow: "0 0 0 5px rgba(248,113,113,0.2), 0 0 20px rgba(248,113,113,0.15)",
          pointerEvents: "none",
          animation: "kaviro-pulse 2s ease-in-out infinite",
        }} />
      )}

      {/* Navigating spinner */}
      {navigating && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#fff",
          borderRadius: 16,
          padding: "20px 28px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          pointerEvents: "none",
        }}>
          <Map size={20} style={{ color: "#F87171" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
            Navegando a {TAB_LABELS[step.tab] ?? step.tab}...
          </span>
        </div>
      )}

      {/* Tooltip */}
      {!navigating && (
        <div style={{
          position: "absolute",
          top: pos.top - SY,
          left: pos.left,
          width: Math.min(TOOLTIP_W, vw - 24),
          pointerEvents: "auto",
          zIndex: 1201,
          borderRadius: 18,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.16)",
          overflow: "hidden",
        }}>
          {/* Top bar — tab indicator */}
          <div style={{ background: "#fef2f2", borderBottom: "1px solid #fee2e2", padding: "7px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#F87171", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {TAB_LABELS[step.tab] ?? step.tab} · {globalIdx + 1} de {steps.length}
            </span>
            <button type="button" onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 6, color: "#fca5a5" }}
              aria-label="Cerrar tour"
            >
              <X size={13} />
            </button>
          </div>

          {/* Header */}
          <div style={{ padding: "13px 16px 8px", display: "flex", alignItems: "center", gap: 9 }}>
            {step.emoji && <span style={{ fontSize: 22, lineHeight: 1 }}>{step.emoji}</span>}
            <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>{step.title}</span>
          </div>

          {/* Body */}
          <p style={{ margin: "0 16px 14px", fontSize: 12.5, lineHeight: 1.65, color: "#475569" }}>
            {step.body}
          </p>

          {/* Progress bar */}
          <div style={{ margin: "0 16px 12px", height: 3, borderRadius: 2, background: "#f1f5f9", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, background: "#F87171", width: `${((globalIdx + 1) / steps.length) * 100}%`, transition: "width 0.3s" }} />
          </div>

          {/* Footer nav */}
          <div style={{ borderTop: "1px solid #f8fafc", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Dots — only show nearby steps */}
            <div style={{ display: "flex", gap: 3 }}>
              {steps.map((_, i) => (
                <span key={i} style={{
                  height: 5, borderRadius: 3, display: "inline-block",
                  transition: "all 0.2s",
                  width: i === globalIdx ? 14 : 5,
                  background: i === globalIdx ? "#F87171" : i < globalIdx ? "#fca5a5" : "#e2e8f0",
                }} />
              ))}
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              {!isFirst && (
                <button type="button" onClick={() => setGlobalIdx((i) => i - 1)}
                  style={{ height: 32, width: 32, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}
                  aria-label="Anterior"
                >
                  <ChevronLeft size={14} />
                </button>
              )}
              <button type="button"
                onClick={() => isLast ? onComplete() : setGlobalIdx((i) => i + 1)}
                style={{ height: 32, padding: "0 14px", borderRadius: 10, border: "none", background: "#F87171", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
              >
                {isLast ? "¡Listo! ✓" : <><span>Siguiente</span><ChevronRight size={12} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes kaviro-pulse {
          0%, 100% { box-shadow: 0 0 0 5px rgba(248,113,113,0.2), 0 0 20px rgba(248,113,113,0.15); }
          50% { box-shadow: 0 0 0 8px rgba(248,113,113,0.1), 0 0 30px rgba(248,113,113,0.2); }
        }
      `}</style>
    </div>,
    document.body
  );
}
