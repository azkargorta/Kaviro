"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X, Settings, Map, Users, FileText, Star } from "lucide-react";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import { iconSlotNavBottom } from "@/components/ui/iconTokens";
import { getTripTabIconSrc, tripTabDocsImageClass, tripTabIconCoralFilterDark, type TripTabKey } from "@/lib/trip-tab-assets";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";

type Props = {
  tripId: string;
  isPremium: boolean;
  startDate?: string | null;
  endDate?: string | null;
  unseenCount?: number;
  newParticipantCount?: number;
};

// Primary items — always visible (5 max)
const PRIMARY_ITEMS: Array<{ key: TripTabKey; label: string; href: (id: string) => string; isAI?: boolean }> = [
  { key: "summary",  label: "Inicio", href: (id) => `/trip/${id}/summary` },
  { key: "plan",     label: "Plan",   href: (id) => `/trip/${id}/plan` },
  { key: "expenses", label: "Gastos", href: (id) => `/trip/${id}/expenses` },
  { key: "chat",     label: "IA",     href: (id) => `/trip/${id}/ai-chat`, isAI: true },
];

// Secondary items — in "Más" sheet
const SECONDARY_ITEMS: Array<{ key: string; label: string; href: (id: string) => string; icon: React.ReactNode }> = [
  { key: "map",          label: "Rutas",         href: (id) => `/trip/${id}/map`,          icon: <Map className="h-5 w-5" /> },
  { key: "participants", label: "Participantes",  href: (id) => `/trip/${id}/participants`, icon: <Users className="h-5 w-5" /> },
  { key: "resources",    label: "Documentos",     href: (id) => `/trip/${id}/resources`,    icon: <FileText className="h-5 w-5" /> },
  { key: "settings",     label: "Ajustes",        href: (id) => `/trip/${id}/settings`,     icon: <Settings className="h-5 w-5" /> },
  { key: "recap",        label: "Recap",          href: (id) => `/trip/${id}/recap`,        icon: <Star className="h-5 w-5" /> },
];

export default function MobileBottomNav({
  tripId,
  isPremium,
  startDate,
  endDate,
  unseenCount = 0,
  newParticipantCount = 0,
}: Props) {
  const pathname = usePathname();
  const isDark = useIsDarkMode();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isTripActiveToday = (() => {
    if (!startDate || !endDate) return false;
    const today = new Date().toISOString().slice(0, 10);
    return today >= startDate && today <= endDate;
  })();

  const primaryItems = isPremium
    ? PRIMARY_ITEMS
    : PRIMARY_ITEMS.filter((i) => i.key !== "chat");

  function isActivePath(href: string, key: string) {
    if (pathname === href) return true;
    if (key === "map" && pathname.startsWith(`${href}/`)) return true;
    return false;
  }

  // Check if current page is a secondary item
  const isSecondaryActive = SECONDARY_ITEMS.some((i) =>
    isActivePath(i.href(tripId), i.key)
  );

  return (
    <>
      {/* ── More sheet backdrop ───────────────────────────────────────── */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* ── More sheet ───────────────────────────────────────────────── */}
      {sheetOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-[var(--border-default)] bg-[var(--surface-card)] pb-safe shadow-2xl dark:border-[#1E293B]">
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-slate-200 dark:bg-[#334155]" />

          {/* Sheet header */}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm font-extrabold text-[var(--text-primary)]">Más secciones</span>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="rounded-full p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-page)] transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Sheet items */}
          <div className="grid grid-cols-2 gap-2 px-4 pb-6">
            {SECONDARY_ITEMS.map((item) => {
              const href = item.href(tripId);
              const active = isActivePath(href, item.key);
              return (
                <Link
                  key={item.key}
                  href={href}
                  onClick={() => setSheetOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
                    active
                      ? "border-[var(--brand-border)] bg-[var(--brand-light)] text-[var(--brand)]"
                      : "border-[var(--border-default)] bg-[var(--surface-page)] text-[var(--text-secondary)] hover:bg-[var(--surface-card)]"
                  }`}
                >
                  <span className={active ? "text-[var(--brand)]" : "text-[var(--text-tertiary)]"}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-semibold">{item.label}</span>
                  {item.key === "participants" && newParticipantCount > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#F87171] text-[10px] font-bold text-white">
                      {newParticipantCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Dark mode toggle inside sheet */}
          <div className="flex items-center justify-between px-5 pb-6 border-t border-[var(--border-default)] dark:border-[#1E293B] pt-4">
            <span className="text-sm font-semibold text-[var(--text-secondary)]">Modo oscuro</span>
            <DarkModeToggle />
          </div>
        </div>
      )}

      {/* ── Bottom nav bar ───────────────────────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 6px)" }}
        aria-label="Navegación del viaje"
      >
        <div className="mx-2 mb-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-[var(--surface-card)]/96 shadow-[0_-4px_24px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-[#1E293B] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex">
            {/* Primary nav items */}
            {primaryItems.map((item) => {
              const href = item.href(tripId);
              const active = isActivePath(href, item.key);
              return (
                <Link
                  key={item.key}
                  href={href}
                  className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] transition-all duration-150 ${
                    active ? "text-slate-950 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-500"
                  }`}
                  title={item.label}
                >
                  {/* Active pill */}
                  {active && (
                    <span className={`absolute inset-x-1 top-1 bottom-1 rounded-xl ${item.isAI ? "bg-[var(--brand-light)]" : "bg-slate-100 dark:bg-[#1E293B]"}`} aria-hidden />
                  )}

                  {/* Icon */}
                  <span className={`relative z-10 flex h-6 w-6 items-center justify-center transition-transform duration-150 ${active ? "scale-110" : ""}`} aria-hidden>
                    <Image
                      src={getTripTabIconSrc(item.key, isDark)}
                      alt=""
                      width={24}
                      height={24}
                      sizes="24px"
                      className={`object-contain ${tripTabIconCoralFilterDark} ${item.key === "resources" ? tripTabDocsImageClass : ""}`}
                    />
                  </span>

                  {/* Label */}
                  <span className={`relative z-10 text-[9px] font-semibold leading-none tracking-wide ${
                    active ? item.isAI ? "text-[var(--brand)]" : "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
                  }`}>
                    {item.label}
                  </span>

                  {/* HOY dot */}
                  {item.key === "plan" && isTripActiveToday && !active && (
                    <span className="absolute top-1.5 right-2.5 h-2 w-2 rounded-full bg-[#F87171] ring-1 ring-white dark:ring-[#080C14]" aria-hidden />
                  )}

                  {/* Unseen changes dot */}
                  {item.key === "plan" && unseenCount > 0 && !active && !isTripActiveToday && (
                    <span className="absolute top-1.5 right-2.5 h-2 w-2 rounded-full bg-[#F87171] animate-pulse ring-1 ring-white dark:ring-[#080C14]" aria-hidden />
                  )}

                  {/* Active dot */}
                  {active && (
                    <span className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[var(--brand)]`} aria-hidden />
                  )}
                </Link>
              );
            })}

            {/* Más button */}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] transition-all duration-150 ${
                isSecondaryActive ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-slate-500"
              }`}
              aria-label="Más secciones"
            >
              {isSecondaryActive && (
                <span className="absolute inset-x-1 top-1 bottom-1 rounded-xl bg-slate-100 dark:bg-[#1E293B]" aria-hidden />
              )}
              <span className="relative z-10 flex h-6 w-6 items-center justify-center" aria-hidden>
                <MoreHorizontal className="h-5 w-5" />
              </span>
              <span className="relative z-10 text-[9px] font-semibold leading-none tracking-wide text-[var(--text-tertiary)]">
                Más
              </span>
              {/* Badge for secondary items */}
              {newParticipantCount > 0 && (
                <span className="absolute top-1.5 right-2.5 h-2 w-2 rounded-full bg-[#F87171] ring-1 ring-white dark:ring-[#080C14]" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
