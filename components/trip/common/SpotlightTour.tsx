"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { SpotlightStep } from "./trip-tour-types";

const PAD = 10;

type Rect = { top: number; left: number; width: number; height: number };

function getTargetRect(selector: string | null): Rect | null {
  if (!selector) return null;
  try {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: r.top + window.scrollY - PAD,
      left: r.left + window.scrollX - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    };
  } catch { return null; }
}

type TooltipPos = { top: number; left: number };

function calcPos(rect: Rect | null, placement: SpotlightStep["placement"]): TooltipPos {
  const vw = window.innerWidth;
  const vh = window.scrollY + window.innerHeight;
  const TW = Math.min(300, vw - 24);
  const TH = 180;
  const GAP = 14;

  if (!rect || placement === "center") {
    return { top: window.scrollY + window.innerHeight / 2 - TH / 2, left: vw / 2 - TW / 2 };
  }

  let top = 0, left = 0;

  switch (placement) {
    case "bottom": top = rect.top + rect.height + GAP; left = rect.left + rect.width / 2 - TW / 2; break;
    case "top":    top = rect.top - TH - GAP;           left = rect.left + rect.width / 2 - TW / 2; break;
    case "right":  top = rect.top + rect.height / 2 - TH / 2; left = rect.left + rect.width + GAP; break;
    case "left":   top = rect.top + rect.height / 2 - TH / 2; left = rect.left - TW - GAP; break;
  }

  left = Math.max(12, Math.min(left, vw - TW - 12));
  top  = Math.max(window.scrollY + 12, Math.min(top, vh - TH - 12));
  return { top, left };
}

type Props = {
  steps: SpotlightStep[];
  currentTab: string;
  onClose: () => void;
  onComplete: () => void;
};

export default function SpotlightTour({ steps, currentTab, onClose, onComplete }: Props) {
  const tabSteps = steps.filter((s) => s.tab === currentTab);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);

  const step = tabSteps[idx];
  const isLast = idx >= tabSteps.length - 1;

  useEffect(() => { setMounted(true); }, []);

  // Scroll target into view + measure
  useEffect(() => {
    if (!step?.target) { setRect(null); return; }
    const el = document.querySelector(step.target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setRect(getTargetRect(step.target)), 350);
    return () => clearTimeout(t);
  }, [step?.target]);

  // Update rect on resize/scroll
  useEffect(() => {
    if (!step?.target) return;
    const update = () => setRect(getTargetRect(step.target));
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update); };
  }, [step?.target]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); isLast ? onComplete() : setIdx((i) => i + 1); }
      if (e.key === "ArrowLeft" && idx > 0) { e.preventDefault(); setIdx((i) => i - 1); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [idx, isLast, onClose, onComplete]);

  if (!mounted || !step || tabSteps.length === 0) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const TW = Math.min(300, vw - 24);
  const scrollY = window.scrollY;

  // Build SVG cutout path
  const maskPath = rect
    ? [
        `M0 0 H${vw} V${vh} H0 Z`,
        `M${rect.left} ${rect.top - scrollY}`,
        `H${rect.left + rect.width}`,
        `V${rect.top - scrollY + rect.height}`,
        `H${rect.left} Z`,
      ].join(" ")
    : `M0 0 H${vw} V${vh} H0 Z`;

  const pos = calcPos(rect, step.placement);

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, pointerEvents: "none" }}>
      {/* Overlay */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "auto" }}
        onClick={onClose}
      >
        <path fillRule="evenodd" d={maskPath} fill="rgba(15,23,42,0.72)" />
      </svg>

      {/* Highlight ring */}
      {rect && (
        <div style={{
          position: "absolute",
          top: rect.top - scrollY,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          borderRadius: 14,
          outline: "2px solid #F87171",
          outlineOffset: 0,
          boxShadow: "0 0 0 4px rgba(248,113,113,0.25)",
          pointerEvents: "none",
        }} />
      )}

      {/* Tooltip */}
      <div style={{
        position: "absolute",
        top: pos.top - scrollY,
        left: pos.left,
        width: TW,
        pointerEvents: "auto",
        zIndex: 1201,
        borderRadius: 16,
        background: "var(--tooltip-bg, #fff)",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {step.emoji && <span style={{ fontSize: 20 }}>{step.emoji}</span>}
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{step.title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8, color: "#94a3b8", flexShrink: 0 }}
            aria-label="Cerrar tour"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <p style={{ margin: "0 16px 14px", fontSize: 12, lineHeight: 1.6, color: "#475569" }}>
          {step.body}
        </p>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #f1f5f9", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Progress dots */}
          <div style={{ display: "flex", gap: 4 }}>
            {tabSteps.map((_, i) => (
              <span key={i} style={{
                height: 6, borderRadius: 3, transition: "width 0.2s",
                width: i === idx ? 16 : 6,
                background: i === idx ? "#F87171" : i < idx ? "#cbd5e1" : "#e2e8f0",
                display: "inline-block",
              }} />
            ))}
          </div>

          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>
            {idx + 1} / {tabSteps.length}
          </span>

          <div style={{ display: "flex", gap: 6 }}>
            {idx > 0 && (
              <button type="button" onClick={() => setIdx((i) => i - 1)}
                style={{ height: 32, width: 32, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}
                aria-label="Anterior"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            <button type="button"
              onClick={() => isLast ? onComplete() : setIdx((i) => i + 1)}
              style={{ height: 32, padding: "0 12px", borderRadius: 10, border: "none", background: "#F87171", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              {isLast ? "¡Listo! ✓" : <><span>Siguiente</span><ChevronRight size={12} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
