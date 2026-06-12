"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTripWorkspace } from "@/components/trip/TripWorkspaceContext";
import { getTripNavItems, type TripNavItem } from "@/lib/kaviro-trips-trip-nav";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
import { TRIP_SIDEBAR_ICONS } from "@/lib/trip-sidebar-icons";
import type { TripTabKey } from "@/lib/trip-tab-assets";

const NAV_GROUPS: { label: string; keys: TripTabKey[] }[] = [
  { label: "Viaje", keys: ["summary", "plan", "map", "today"] },
  { label: "Organización", keys: ["expenses", "participants", "resources"] },
  {
    label: "Más",
    keys: ["chat", "recap", "announcements", "messages", "payments", "settings"],
  },
];

type Props = {
  tripId: string;
  isPremium: boolean;
  startDate?: string | null;
  endDate?: string | null;
};

function isActivePath(pathname: string, href: string, key: string) {
  if (pathname === href) return true;
  if (key === "map" && pathname.startsWith(`${href}/`)) return true;
  if (key === "settings" && pathname.startsWith(href)) return true;
  if (key === "announcements" && pathname.startsWith(href)) return true;
  if (key === "messages" && pathname.startsWith(href)) return true;
  if (key === "payments" && pathname.startsWith(href)) return true;
  return false;
}

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
            {NAV_GROUPS.map((group) => {
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
                      <SidebarLink
                        key={item.key}
                        item={item}
                        tripId={tripId}
                        active={isActivePath(pathname, item.href(tripId), item.key)}
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

function SidebarLink({
  item,
  tripId,
  active,
  isAgencyTrip,
  useAgencyBranding,
  isPersonalKaviro,
  showHoyBadge,
}: {
  item: TripNavItem;
  tripId: string;
  active: boolean;
  isAgencyTrip: boolean;
  useAgencyBranding: boolean;
  isPersonalKaviro: boolean;
  showHoyBadge: boolean;
}) {
  const href = item.href(tripId);
  const Icon = TRIP_SIDEBAR_ICONS[item.key];

  const useKaviroPremium = isPersonalKaviro;
  const useAgencyAccent = useAgencyBranding || (isAgencyTrip && !useAgencyBranding);

  return (
    <Link
      href={href}
      prefetch
      title={item.label}
      className={`
        group relative flex min-h-[58px] items-center gap-3 rounded-[14px] border px-3 py-2.5
        transition-all duration-200
        ${
          active
            ? useKaviroPremium
              ? "border-[var(--brand-border)]/70 bg-gradient-to-br from-[#FFF1F1] to-white text-slate-900 shadow-[0_2px_12px_rgba(248,113,113,0.1)] dark:from-[#1a1212]/80 dark:to-[#0F1623] dark:text-white"
              : useAgencyAccent
                ? "border-transparent bg-[var(--brand)] text-white shadow-sm"
                : "border-transparent bg-[#1e3a5f] text-white shadow-sm"
            : useKaviroPremium
              ? "border-transparent text-slate-800 hover:-translate-y-px hover:border-slate-200/80 hover:bg-slate-50/90 hover:shadow-[0_2px_8px_rgba(15,23,42,0.04)] dark:text-slate-100 dark:hover:border-[#334155] dark:hover:bg-[#141c2b]/80"
              : "border-transparent text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#141c2b]"
        }
      `}
    >
      {active && useKaviroPremium ? (
        <span
          className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-[var(--brand)]"
          aria-hidden
        />
      ) : null}

      <span
        className={`
          relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border
          ${
            active
              ? useKaviroPremium
                ? "border-[var(--brand-border)]/50 bg-white text-[var(--brand)] dark:bg-[#141c2b]"
                : "border-white/20 bg-white/15 text-white"
              : useKaviroPremium
                ? "border-slate-200/70 bg-slate-50/90 text-slate-500 group-hover:border-slate-200 group-hover:text-[var(--brand)] dark:border-[#334155] dark:bg-[#141c2b]/60 dark:text-slate-400 dark:group-hover:text-[var(--brand)]"
                : "border-slate-200/70 bg-slate-50/90 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }
        `}
        aria-hidden
      >
        {Icon ? <Icon className="h-5 w-5" strokeWidth={2} aria-hidden /> : null}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[13px] leading-snug ${
            active
              ? useKaviroPremium
                ? "font-bold text-slate-900 dark:text-white"
                : "font-semibold text-white"
              : "font-semibold text-slate-900 dark:text-slate-100"
          }`}
        >
          {item.label}
        </p>
        {item.sublabel ? (
          <p
            className={`mt-0.5 truncate text-[10px] font-medium leading-snug ${
              active
                ? useKaviroPremium
                  ? "text-slate-400 dark:text-slate-500"
                  : useAgencyAccent || isAgencyTrip
                    ? "text-white/75"
                    : "text-slate-500"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {item.sublabel}
          </p>
        ) : null}
      </div>

      {showHoyBadge && !active ? (
        <span className="shrink-0 rounded-md border border-[var(--brand-border)]/55 bg-[var(--brand-light)]/75 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[var(--brand-text)]">
          HOY
        </span>
      ) : null}
    </Link>
  );
}
