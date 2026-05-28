"use client";

import { useEffect, useState } from "react";
import DashboardHeaderCopy from "@/components/dashboard/DashboardHeaderCopy";

type HeaderMeta = { tripCount: number; isPremium: boolean };

export default function DashboardRootBarPanel() {
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

  return (
    <div className="relative border-t border-white/10 pb-5 pt-4 md:pb-6">
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
      {meta ? (
        <DashboardHeaderCopy tripCount={meta.tripCount} isPremium={meta.isPremium} />
      ) : (
        <div className="relative z-10 animate-pulse space-y-2 pb-1" aria-hidden>
          <div className="h-3 w-28 rounded bg-white/20" />
          <div className="h-8 w-40 rounded bg-white/25" />
          <div className="h-4 w-64 max-w-full rounded bg-white/15" />
        </div>
      )}
    </div>
  );
}
