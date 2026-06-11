"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getTripTabIconSrc, tripTabDocsImageClass, type TripTabKey } from "@/lib/trip-tab-assets";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import { useTripWorkspace } from "@/components/trip/TripWorkspaceContext";
import { getTripNavItems, type TripNavItem } from "@/lib/kaviro-trips-trip-nav";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";

const NAV_GROUPS: { label: string; keys: TripTabKey[] }[] = [
  { label: "Viaje", keys: ["summary", "plan", "today", "map"] },
  { label: "Organización", keys: ["expenses", "resources", "participants"] },
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
  const isDark = useIsDarkMode();
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

  return (
    <div
      ref={anchorRef}
      className="hidden w-[200px] shrink-0 self-stretch lg:w-[224px] md:block"
      style={{ minHeight: dock ? panelHeight : undefined }}
    >
      <aside
        ref={panelRef}
        className="space-y-2 overscroll-contain md:overflow-y-auto"
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
            className={`shadow-sm ${
            useAgencyBranding || !isAgencyTrip
              ? "overflow-hidden rounded-2xl border border-slate-200/80 bg-[var(--surface-card)] shadow-[var(--shadow-card)] dark:border-[#1E293B]"
              : "overflow-visible rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
          }`}
        >
          <div
            className={`border-b px-4 py-3 ${
              useAgencyBranding
                ? "border-white/10 bg-[var(--brand)]"
                : isAgencyTrip
                  ? "border-slate-200 bg-[#0f2744] dark:border-slate-700"
                  : "border-[var(--border-default)]"
            }`}
          >
            <p
              className={`truncate text-[10px] font-bold uppercase leading-normal tracking-[0.18em] ${
                useAgencyBranding
                  ? "text-white/90"
                  : isAgencyTrip
                    ? "text-slate-300"
                    : "text-[var(--text-tertiary)]"
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
            className="space-y-3 p-2"
          >
            {NAV_GROUPS.map((group) => {
              const groupItems = visibleItems.filter((item) => group.keys.includes(item.key));
              if (!groupItems.length) return null;
              return (
                <div key={group.label}>
                  <p
                    className={`mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.16em] ${
                      useAgencyBranding
                        ? "text-white/60"
                        : isAgencyTrip
                          ? "text-slate-400"
                          : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {groupItems.map((item) => (
                      <SidebarLink
                        key={item.key}
                        item={item}
                        tripId={tripId}
                        active={isActivePath(pathname, item.href(tripId), item.key)}
                        isDark={isDark}
                        isAgencyTrip={isAgencyTrip}
                        useAgencyBranding={useAgencyBranding}
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
            className="group flex items-center gap-2.5 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-light)] px-3.5 py-3 transition hover:border-[var(--brand)] hover:shadow-sm"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] shadow-sm">
              <span className="text-sm">✦</span>
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[var(--brand-text)] truncate">Activar Premium</p>
              <p className="text-[10px] text-[var(--brand)] truncate">IA + funciones extra</p>
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
  isDark,
  isAgencyTrip,
  useAgencyBranding,
  showHoyBadge,
}: {
  item: TripNavItem;
  tripId: string;
  active: boolean;
  isDark: boolean;
  isAgencyTrip: boolean;
  useAgencyBranding: boolean;
  showHoyBadge: boolean;
}) {
  const href = item.href(tripId);
  const isAI = item.key === "chat";

  return (
    <Link
      href={href}
      prefetch
      title={item.label}
      className={`
        group relative flex min-h-[46px] items-center gap-2.5 rounded-xl px-2.5 py-2
        transition-all duration-150
        ${
          active
            ? useAgencyBranding || isAI
              ? "bg-[var(--brand)] text-white shadow-sm"
              : isAgencyTrip
                ? "bg-[#1e3a5f] text-white shadow-sm"
                : "border border-[var(--brand-border)] border-l-[3px] border-l-[var(--brand)] bg-[var(--brand-light)] text-slate-900 shadow-sm dark:bg-[#141c2b] dark:text-white"
            : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60"
        }
      `}
    >
      <span
        className={`
          relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg
          ${
            active
              ? useAgencyBranding || isAI || isAgencyTrip
                ? "bg-white/15 ring-1 ring-white/20"
                : "bg-white ring-1 ring-[var(--brand-border)] dark:bg-[#0F1623] dark:ring-[var(--brand-border)]"
              : "bg-slate-100 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-600"
          }
        `}
        aria-hidden
      >
        <Image
          src={getTripTabIconSrc(item.key, isDark)}
          alt=""
          width={28}
          height={28}
          sizes="28px"
          className={`h-7 w-7 object-contain ${item.key === "resources" ? tripTabDocsImageClass : ""} ${
            active && (useAgencyBranding || isAI || isAgencyTrip)
              ? "brightness-[2] saturate-0"
              : isAgencyTrip
                ? "opacity-80"
                : ""
          }`}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] font-semibold leading-snug truncate ${
            active
              ? useAgencyBranding || isAI || isAgencyTrip
                ? "text-white"
                : "text-slate-900 dark:text-white"
              : "text-slate-900 dark:text-slate-100"
          }`}
        >
          {item.label}
        </p>
        {item.sublabel ? (
          <p
            className={`mt-0.5 truncate text-[10px] font-medium leading-snug ${
              active
                ? useAgencyBranding || isAI || isAgencyTrip
                  ? "text-white/80"
                  : "text-slate-500 dark:text-slate-400"
                : "text-slate-500"
            }`}
          >
            {item.sublabel}
          </p>
        ) : null}
      </div>

      {showHoyBadge && !active ? (
        <span className="shrink-0 rounded-full bg-[var(--brand-light)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--brand-text)]">
          HOY
        </span>
      ) : null}
    </Link>
  );
}
