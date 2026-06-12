"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTripWorkspace } from "@/components/trip/TripWorkspaceContext";
import TripNavLink from "@/components/trip/nav/TripNavLink";
import { getTripNavItems } from "@/lib/kaviro-trips-trip-nav";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
import { TRIP_NAV_GROUPS, isTripNavActivePath } from "@/lib/trip-nav-groups";

type Props = {
  tripId: string;
  isPremium: boolean;
  startDate?: string | null;
  endDate?: string | null;
};

export default function DesktopTripSidebar({ tripId, isPremium, startDate, endDate }: Props) {
  const pathname = usePathname();
  const { isAgencyTrip, isAgencyManaged, useAgencyBranding, agencyBranding, tripMode } = useTripWorkspace();

  const visibleItems = getTripNavItems(isAgencyTrip, isAgencyManaged, tripMode).filter(
    (item) => !item.isPremiumGated || isPremium
  );

  const isTripActiveToday = (() => {
    if (!startDate || !endDate || isAgencyTrip) return false;
    const today = new Date().toISOString().slice(0, 10);
    return today >= startDate && today <= endDate;
  })();

  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [dock, setDock] = useState<{ left: number; width: number } | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  const syncDock = useCallback(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel || window.innerWidth < 768) {
      setDock(null);
      setPanelHeight(0);
      return;
    }
    const rect = anchor.getBoundingClientRect();
    setDock({ left: rect.left, width: rect.width });
    setPanelHeight(panel.offsetHeight);
  }, []);

  useEffect(() => {
    syncDock();
    const ro = new ResizeObserver(syncDock);
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (anchor) ro.observe(anchor);
    if (panel) ro.observe(panel);
    window.addEventListener("resize", syncDock);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncDock);
    };
  }, [syncDock, pathname, visibleItems.length, isPremium, isAgencyTrip, useAgencyBranding]);

  const isPersonalKaviro = !isAgencyTrip && !useAgencyBranding;

  return (
    <div
      ref={anchorRef}
      className="hidden w-[200px] shrink-0 self-stretch lg:w-[224px] md:block"
      style={{ minHeight: dock ? panelHeight : undefined }}
    >
      <aside
        ref={panelRef}
        className="space-y-2.5 overscroll-contain md:overflow-y-auto"
        style={
          dock
            ? {
                position: "fixed",
                top: "max(1.25rem, env(safe-area-inset-top, 0px))",
                left: dock.left,
                width: dock.width,
                maxHeight: "calc(100dvh - 2.5rem - env(safe-area-inset-top, 0px))",
                zIndex: 40,
              }
            : undefined
        }
      >
        <div
          className={
            isPersonalKaviro
              ? "overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.05)] dark:border-[#1E293B] dark:bg-[#0F1623] dark:shadow-[0_2px_16px_rgba(0,0,0,0.28)]"
              : useAgencyBranding
                ? "overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.05)] dark:border-[#1E293B] dark:bg-[#0F1623]"
                : "overflow-visible rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
          }
        >
          <div
            className={`border-b px-4 py-3.5 ${
              useAgencyBranding
                ? "border-white/10 bg-[var(--brand)]"
                : isAgencyTrip
                  ? "border-slate-200 bg-[#0f2744] dark:border-slate-700"
                  : "border-slate-100/90 bg-white dark:border-[#1E293B] dark:bg-[#0F1623]"
            }`}
          >
            <p
              className={`truncate text-[10px] font-bold uppercase leading-normal tracking-[0.22em] ${
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

          <nav
            aria-label="Navegación del viaje"
            data-tour="sidebar-nav"
            data-trip-sidebar-nav
            className="space-y-5 bg-white px-2.5 py-3 dark:bg-[#0F1623]"
          >
            {TRIP_NAV_GROUPS.map((group) => {
              const groupItems = visibleItems.filter((item) => group.keys.includes(item.key));
              if (!groupItems.length) return null;
              return (
                <div key={group.label}>
                  <p
                    className={`mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.22em] ${
                      useAgencyBranding
                        ? "text-white/60"
                        : isAgencyTrip
                          ? "text-slate-400"
                          : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
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
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {!isPremium && !isAgencyTrip ? (
          <Link
            href="/pricing"
            className="group flex items-center gap-2.5 rounded-[20px] border border-[var(--brand-border)]/70 bg-[var(--brand-light)]/60 px-3.5 py-3 transition hover:-translate-y-px hover:border-[var(--brand-border)] hover:shadow-[0_2px_10px_rgba(248,113,113,0.1)]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-border)]/50 bg-white text-[var(--brand)] shadow-sm">
              <span className="text-sm font-bold">✦</span>
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-[var(--brand-text)]">Activar Premium</p>
              <p className="truncate text-[10px] text-[var(--brand)]/90">IA + funciones extra</p>
            </div>
          </Link>
        ) : null}
      </aside>
    </div>
  );
}
