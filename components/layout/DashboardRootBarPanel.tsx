"use client";

import { useEffect, useState } from "react";
import DashboardHeaderCopy from "@/components/dashboard/DashboardHeaderCopy";

type HeaderMeta = { tripCount: number; isPremium: boolean };

type Props = {
  /** Escritorio: texto entre logo y controles; móvil: bloque debajo como antes */
  variant?: "stacked" | "inline";
  neutral?: boolean;
};

export default function DashboardRootBarPanel({ variant = "stacked", neutral = false }: Props) {
  const [meta, setMeta] = useState<HeaderMeta | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/header-meta", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HeaderMeta | null) => {
        if (!cancelled && data && typeof data.tripCount === "number") {
          setMeta({ tripCount: data.tripCount, isPremium: Boolean(data.isPremium) });
        }
      })
      .catch(() => {
        if (!cancelled) setMeta({ tripCount: 0, isPremium: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isInline = variant === "inline";

  return (
    <div
      className={
        isInline
          ? "relative min-w-0 flex-1 px-1"
          : neutral
            ? "relative z-0 pb-4 pt-1"
            : "relative z-0 border-t border-white/10 pb-5 pt-4"
      }
    >
      {!isInline && !neutral ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <span
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
          <span
            className="absolute -bottom-8 left-1/4 h-28 w-28 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
        </div>
      ) : null}
      {meta ? (
        <DashboardHeaderCopy
          tripCount={meta.tripCount}
          isPremium={meta.isPremium}
          compact={isInline}
          neutral={neutral}
        />
      ) : (
        <div
          className={`relative z-10 animate-pulse space-y-2 ${isInline ? "py-0.5" : "pb-1"}`}
          aria-hidden
        >
          <div className={`rounded bg-white/20 ${isInline ? "h-2.5 w-24" : "h-3 w-28"}`} />
          <div className={`rounded bg-white/25 ${isInline ? "h-5 w-32" : "h-8 w-40"}`} />
          {!isInline ? <div className="h-4 w-64 max-w-full rounded bg-white/15" /> : null}
        </div>
      )}
    </div>
  );
}
