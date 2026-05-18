"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { SpotlightStep } from "./trip-tour-types";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 12; // spotlight padding around target

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
  } catch {
    return null;
  }
}

function useRect(selector: string | null, open: boolean) {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => setRect(getTargetRect(selector));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [selector, open]);

  return rect;
}

type TooltipPos = { top: number; left: number; transformOrigin: string };

function calcTooltipPos(
  rect: Rect | null,
  placement: SpotlightStep["placement"],
  tooltipW: number,
  tooltipH: number
): TooltipPos {
  if (!rect || placement === "center") {
    return {
      top: window.innerHeight / 2 - tooltipH / 2,
      left: window.innerWidth / 2 - tooltipW / 2,
      transformOrigin: "center center",
    };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight + window.scrollY;
  const gap = 16;

  let top = 0;
  let left = 0;
  let transformOrigin = "top left";

  switch (placement) {
    case "bottom":
      top = rect.top + rect.height + gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      transformOrigin = "top center";
      break;
    case "top":
      top = rect.top - tooltipH - gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      transformOrigin = "bottom center";
      break;
    case "right":
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left + rect.width + gap;
      transformOrigin = "center left";
      break;
    case "left":
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - gap;
      transformOrigin = "center right";
      break;
  }

  // Clamp to viewport
  left = Math.max(12, Math.min(left, vw - tooltipW - 12));
  top = Math.max(12, Math.min(top, vh - tooltipH - 12));

  return { top, left, transformOrigin };
}

type Props = {
  steps: SpotlightStep[];
  currentTab: string;
  onClose: () => void;
  onComplete: () => void;
};

export default function SpotlightTour({ steps, currentTab, onClose, onComplete }: Props) {
  const tabSteps = steps.filter((s) => s.tab === currentTab);
  const [stepIdx, setStepIdx] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipSize, setTooltipSize] = useState({ w: 300, h: 160 });

  const step = tabSteps[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx >= tabSteps.length - 1;
  const totalSteps = tabSteps.length;

  const rect = useRect(step?.target ?? null, Boolean(step));

  // Measure tooltip
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const r = tooltipRef.current.getBoundingClientRect();
      setTooltipSize({ w: r.width || 300, h: r.height || 160 });
    }
  });

  // Scroll target into view
  useEffect(() => {
    if (!step?.target) return;
    const el = document.querySelector(step.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [step?.target]);

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (isLast) onComplete();
        else setStepIdx((i) => i + 1);
      }
      if (e.key === "ArrowLeft" && !isFirst) setStepIdx((i) => i - 1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFirst, isLast, onClose, onComplete]);

  if (!step || tabSteps.length === 0) return null;

  const tooltipPos = calcTooltipPos(
    rect,
    step.placement,
    tooltipSize.w,
    tooltipSize.h
  );

  // SVG spotlight mask
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;

  const maskPath = rect
    ? `M 0 0 H ${vw} V ${vh} H 0 Z M ${rect.left} ${rect.top - window.scrollY} H ${rect.left + rect.width} V ${rect.top - window.scrollY + rect.height} H ${rect.left} Z`
    : `M 0 0 H ${vw} V ${vh} H 0 Z`;

  return createPortal(
    <div className="fixed inset-0 z-[1200]" style={{ pointerEvents: "none" }}>
      {/* Overlay with cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "auto" }}
        onClick={onClose}
      >
        <defs>
          <clipPath id="spotlight-clip">
            <path fillRule="evenodd" d={maskPath} />
          </clipPath>
        </defs>
        <rect
          width={vw}
          height={vh}
          fill="rgba(15,23,42,0.75)"
          clipPath="url(#spotlight-clip)"
        />
      </svg>

      {/* Highlight border around target */}
      {rect && (
        <div
          className="absolute rounded-2xl ring-2 ring-[#F87171] ring-offset-0"
          style={{
            top: rect.top - window.scrollY,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            pointerEvents: "none",
            boxShadow: "0 0 0 4px rgba(248,113,113,0.2)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute w-[min(320px,calc(100vw-24px))] rounded-2xl border border-white/10 bg-white shadow-2xl dark:bg-[#0F1623]"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          pointerEvents: "auto",
          transformOrigin: tooltipPos.transformOrigin,
          zIndex: 1201,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            {step.emoji && <span className="text-xl">{step.emoji}</span>}
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {step.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition"
            aria-label="Cerrar tour"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <p className="px-4 pb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {step.body}
        </p>

        {/* Progress + nav */}
        <div className="border-t border-slate-100 dark:border-[#1E293B] px-4 py-3 flex items-center justify-between gap-2">
          {/* Dots */}
          <div className="flex gap-1">
            {tabSteps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIdx
                    ? "w-4 bg-[#F87171]"
                    : i < stepIdx
                    ? "w-1.5 bg-slate-300 dark:bg-slate-600"
                    : "w-1.5 bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>

          <span className="text-[10px] text-slate-400 font-semibold">
            {stepIdx + 1} / {totalSteps}
          </span>

          <div className="flex items-center gap-1.5">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStepIdx((i) => i - 1)}
                className="h-8 w-8 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0F1623] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isLast) onComplete();
                else setStepIdx((i) => i + 1);
              }}
              className="h-8 px-3 rounded-xl bg-[#F87171] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#EF4444] transition"
            >
              {isLast ? "¡Listo! ✓" : (
                <>Siguiente <ChevronRight className="h-3 w-3" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
