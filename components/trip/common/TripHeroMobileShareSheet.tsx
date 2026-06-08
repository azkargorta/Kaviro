"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Home, Share2, X } from "lucide-react";
import TripShareButton from "@/components/trip/common/TripShareButton";
import ShareTodayPlanButton from "@/components/trip/common/ShareTodayPlanButton";
import { mobileMenuRowBase, mobileMenuRowIconWrap } from "@/components/ui/mobileMenuStyles";

type Props = {
  tripId: string;
  tripName: string;
  destination?: string | null;
};

export default function TripHeroMobileShareSheet({ tripId, tripName, destination }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sheet =
    mounted && open ? (
      <div className="fixed inset-0 z-[1150] md:hidden" role="dialog" aria-modal="true" aria-label="Compartir viaje">
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
          aria-label="Cerrar"
          onClick={() => setOpen(false)}
        />
        <div
          className="pointer-events-auto absolute inset-x-0 bottom-0 rounded-t-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-[#1E293B] dark:bg-[#0B1220]"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-[#1E293B]">
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">Compartir y accesos</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 dark:border-[#334155] dark:text-slate-300"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 p-4" onClick={() => setOpen(false)}>
            <TripShareButton tripId={tripId} menuRow />
            <ShareTodayPlanButton tripId={tripId} tripName={tripName} destination={destination} menuRow />
            <Link href="/dashboard" className={mobileMenuRowBase} data-tour="topbar-mis-viajes">
              <span className={mobileMenuRowIconWrap}>
                <Home className="text-slate-800 dark:text-[#F87171]" aria-hidden />
              </span>
              Mis viajes
            </Link>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <div className="flex justify-end border-t border-white/20 px-3 py-1.5 max-md:pl-[max(0.75rem,var(--safe-area-left))] max-md:pr-[max(0.75rem,var(--safe-area-right))]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-white/35 bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm transition hover:bg-white/25"
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden />
          Compartir
        </button>
      </div>
      {sheet ? createPortal(sheet, document.body) : null}
    </>
  );
}
