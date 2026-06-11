"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Home, Lightbulb, Share2, X } from "lucide-react";
import TripShareButton from "@/components/trip/common/TripShareButton";
import ShareTodayPlanButton from "@/components/trip/common/ShareTodayPlanButton";
import { mobileMenuRowBase, mobileMenuRowIconWrap } from "@/components/ui/mobileMenuStyles";
import { dispatchTripHelpToggle, KAVIRO_TRIP_HELP_TOGGLE_EVENT } from "@/lib/trip-section-hints";

type Props = {
  tripId: string;
  tripName: string;
  destination?: string | null;
};

export default function TripHeroMobileShareSheet({ tripId, tripName, destination }: Props) {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ open?: boolean }>).detail;
      setHelpOpen((prev) => (typeof detail?.open === "boolean" ? detail.open : !prev));
    };
    window.addEventListener(KAVIRO_TRIP_HELP_TOGGLE_EVENT, onToggle);
    return () => window.removeEventListener(KAVIRO_TRIP_HELP_TOGGLE_EVENT, onToggle);
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
            <button
              type="button"
              data-tour="trip-section-tips"
              onClick={(e) => {
                e.stopPropagation();
                setHelpOpen((prev) => {
                  const next = !prev;
                  dispatchTripHelpToggle(next);
                  return next;
                });
                setOpen(false);
              }}
              className={`${mobileMenuRowBase} ${
                helpOpen
                  ? "border-violet-300/80 bg-gradient-to-br from-violet-50/90 via-white to-white ring-violet-900/[0.08]"
                  : ""
              }`}
              aria-pressed={helpOpen}
              aria-label={helpOpen ? "Ocultar consejos de esta pantalla" : "Mostrar consejos de esta pantalla"}
            >
              <span
                className={
                  helpOpen
                    ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-inner"
                    : mobileMenuRowIconWrap
                }
              >
                <Lightbulb className={`h-5 w-5 ${helpOpen ? "" : "text-amber-500"}`} aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                <span>Consejos de esta pantalla</span>
                <span className="text-xs font-medium text-slate-500">
                  {helpOpen ? "Pulsa de nuevo para ocultarlos" : "Tips, checklist y guía rápida"}
                </span>
              </span>
            </button>
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
      {/* Solo visible en móvil; en desktop se usa la barra hidden md:flex de TripHeroShareBar */}
      <div className="md:hidden flex items-center justify-between border-t border-white/20 px-3 py-1.5 max-md:pl-[max(0.75rem,var(--safe-area-left))] max-md:pr-[max(0.75rem,var(--safe-area-right))]">
        <Link
          href="/dashboard"
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-white/35 bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm transition hover:bg-white/25"
          aria-label="Volver a Mis viajes"
        >
          <Home className="h-3.5 w-3.5" aria-hidden />
          Mis viajes
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-white/35 bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm transition hover:bg-white/25"
          aria-expanded={open}
          aria-label="Compartir viaje y más opciones"
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden />
          Compartir
        </button>
      </div>
      {sheet ? createPortal(sheet, document.body) : null}
    </>
  );
}
