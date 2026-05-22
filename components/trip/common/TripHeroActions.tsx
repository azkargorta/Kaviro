"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, CreditCard, Link2, X } from "lucide-react";
import TripPageHelp from "@/components/trip/common/TripPageHelp";
import TripActivityFeedButton from "@/components/trip/common/TripActivityFeedButton";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import TripShareButton from "@/components/trip/common/TripShareButton";

export default function TripHeroActions({ tripId }: { tripId: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  return (
    <div className="flex items-center justify-between px-4 pt-safe-min pb-1 max-md:pl-[max(1rem,var(--safe-area-left))] max-md:pr-[max(1rem,var(--safe-area-right))]">
      {/* ← Volver al dashboard */}
      <Link
        href="/dashboard"
        data-tour="topbar-mis-viajes"
        className="inline-flex max-w-[42vw] items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/30 sm:max-w-none sm:gap-1.5 sm:px-3 sm:text-[12px]"
      >
        <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Mis viajes</span>
      </Link>

      {/* Right: utility + dropdown */}
      <div className="flex items-center gap-1">
        {/* Ayuda — ghost icon en hero */}
        <TripPageHelp heroMode />

        {/* Novedades — ghost icon en hero */}
        <span data-tour="topbar-novedades">
          <TripActivityFeedButton tripId={tripId} heroMode />
        </span>

        {/* Dark mode — ghost icon en hero */}
        <span data-tour="topbar-darkmode">
          <DarkModeToggle heroMode />
        </span>

        {/* Menú de usuario: perfil, suscripción, compartir */}
        <div className="relative ml-0.5" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menú de opciones"
            aria-expanded={menuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white transition hover:bg-white/30"
          >
            {menuOpen ? (
              <X className="h-4 w-4" aria-hidden />
            ) : (
              <User className="h-4 w-4" aria-hidden />
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-[200] mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#1E293B] dark:bg-[#0F1623]">
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#1E293B]"
              >
                <User className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                Mi perfil
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-[#1E293B] dark:text-slate-200 dark:hover:bg-[#1E293B]"
              >
                <CreditCard className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                Suscripción
              </Link>
              <div className="border-t border-slate-100 dark:border-[#1E293B]">
                <TripShareButton tripId={tripId} menuRow />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
