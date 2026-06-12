"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Menu, User, X } from "lucide-react";
import { usePathname } from "next/navigation";
import TripScreenActions from "@/components/trip/common/TripScreenActions";
import TripPageHelp from "@/components/trip/common/TripPageHelp";
import TripActivityFeedButton from "@/components/trip/common/TripActivityFeedButton";
import SignOutButton from "@/components/auth/SignOutButton";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import TripNavLink from "@/components/trip/nav/TripNavLink";
import { useTripWorkspace } from "@/components/trip/TripWorkspaceContext";
import { getTripNavItems } from "@/lib/kaviro-trips-trip-nav";
import { TRIP_NAV_GROUPS, isTripNavActivePath } from "@/lib/trip-nav-groups";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
import { iconSlotFill40 } from "@/components/ui/iconTokens";

type Props = {
  tripId: string;
  isPremium?: boolean;
  startDate?: string | null;
  endDate?: string | null;
};

export default function TripBoardMobileMenu({
  tripId,
  isPremium = true,
  startDate = null,
  endDate = null,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isAgencyTrip, isAgencyManaged, useAgencyBranding, agencyBranding, tripMode } = useTripWorkspace();

  const visibleItems = getTripNavItems(isAgencyTrip, isAgencyManaged, tripMode).filter(
    (item) => !item.isPremiumGated || isPremium
  );

  const isTripActiveToday = (() => {
    if (!startDate || !endDate || isAgencyTrip) return false;
    const today = new Date().toISOString().slice(0, 10);
    return today >= startDate && today <= endDate;
  })();

  const isPersonalKaviro = !isAgencyTrip && !useAgencyBranding;
  const close = () => setOpen(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-border)] md:hidden ${iconSlotFill40}`}
        aria-label="Abrir menú"
        title="Menú"
      >
        <Menu strokeWidth={2.25} aria-hidden />
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[1150] md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Menú del viaje"
            >
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
                aria-label="Cerrar menú"
                onClick={close}
              />

              <div
                className="pointer-events-auto absolute right-0 top-0 flex h-full w-[min(92vw,420px)] flex-col overflow-y-auto border-l border-slate-200/80 bg-[#F6F7FB] shadow-2xl dark:border-[#1E293B] dark:bg-[#080C14]"
                style={{
                  paddingTop: "max(env(safe-area-inset-top), 12px)",
                  paddingBottom: "max(0.75rem, calc(5.5rem + env(safe-area-inset-bottom, 0px)))",
                }}
              >
                <div className="flex items-center justify-between gap-3 px-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Menú
                  </div>
                  <div className="flex items-center gap-2">
                    <DarkModeToggle />
                    <button
                      type="button"
                      onClick={close}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B] ${iconSlotFill40}`}
                      aria-label="Cerrar"
                    >
                      <X aria-hidden />
                    </button>
                  </div>
                </div>

                <div className="mt-4 px-4">
                  <div className="rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)] dark:border-[#1E293B] dark:bg-[#0F1623]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                      Acciones rápidas
                    </p>
                    <div className="mt-3">
                      <TripScreenActions tripId={tripId} showLabels variant="default" menuStack />
                      <div className="mt-2 space-y-2">
                        <TripActivityFeedButton tripId={tripId} />
                        <TripPageHelp />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex-1 px-4">
                  <div className="overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.05)] dark:border-[#1E293B] dark:bg-[#0F1623]">
                    <div
                      className={`border-b px-4 py-3.5 ${
                        useAgencyBranding
                          ? "border-white/10 bg-[var(--brand)]"
                          : isAgencyTrip
                            ? "border-slate-200 bg-[#0f2744] dark:border-slate-700"
                            : "border-slate-100/90 bg-white dark:border-[#1E293B]"
                      }`}
                    >
                      <p
                        className={`truncate text-[10px] font-bold uppercase tracking-[0.22em] ${
                          useAgencyBranding
                            ? "text-white/90"
                            : isAgencyTrip
                              ? "text-slate-300"
                              : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {useAgencyBranding && agencyBranding
                          ? agencyBranding.name
                          : isAgencyTrip
                            ? KAVIRO_TRIPS_PRODUCT_NAME
                            : "Tu viaje"}
                      </p>
                    </div>

                    <nav aria-label="Secciones del viaje" className="space-y-5 px-2.5 py-3">
                      {TRIP_NAV_GROUPS.map((group) => {
                        const groupItems = visibleItems.filter((item) => group.keys.includes(item.key));
                        if (!groupItems.length) return null;
                        return (
                          <div key={group.label}>
                            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                              {group.label}
                            </p>
                            <div className="space-y-1">
                              {groupItems.map((item) => (
                                <TripNavLink
                                  key={item.key}
                                  item={item}
                                  tripId={tripId}
                                  active={isTripNavActivePath(pathname, item.href(tripId), item.key)}
                                  isAgencyTrip={isAgencyTrip}
                                  useAgencyBranding={useAgencyBranding}
                                  isPersonalKaviro={isPersonalKaviro}
                                  showHoyBadge={item.key === "today" && isTripActiveToday}
                                  onNavigate={close}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </nav>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-200/80 px-4 pb-4 pt-4 dark:border-[#1E293B]">
                  <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    Cuenta
                  </p>
                  <div className="space-y-1">
                    <Link
                      href="/account"
                      onClick={close}
                      className="flex min-h-[52px] items-center gap-3 rounded-[14px] border border-transparent px-3 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-[#141c2b]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/90 text-slate-500">
                        <User className="h-5 w-5" strokeWidth={2} aria-hidden />
                      </span>
                      Cuenta
                    </Link>
                    <SignOutButton showIcon className="w-full rounded-[14px]" />
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
