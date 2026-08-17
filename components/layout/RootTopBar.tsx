"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import KaviroLogo from "@/components/brand/KaviroLogo";
import DashboardRootBarPanel from "@/components/layout/DashboardRootBarPanel";
import { PremiumBadge } from "@/components/layout/PremiumBadge";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import LoggedInHeaderActions from "@/components/layout/LoggedInHeaderActions";
import LoggedInRoutePrefetch from "@/components/layout/LoggedInRoutePrefetch";

const LOGGED_IN_SHELL_PREFIXES = [
  "/dashboard",
  "/trips/new",
  "/account",
  "/offline-viaje",
];

function HeaderActions({
  session,
  isDashboardHome,
  heroMode,
}: {
  session: "loading" | "guest" | "user";
  isDashboardHome: boolean;
  heroMode: boolean;
}) {
  return (
    <div className="relative z-[60] flex shrink-0 items-center gap-2">
      {!isDashboardHome ? <PremiumBadge /> : null}
      <DarkModeToggle heroMode={heroMode} />
      {session === "user" ? (
        <>
          <LoggedInRoutePrefetch />
          <LoggedInHeaderActions heroMode={heroMode} showNewTripButton={isDashboardHome} />
        </>
      ) : null}
    </div>
  );
}

export default function RootTopBar() {
  const pathname = usePathname();
  const [session, setSession] = useState<"loading" | "guest" | "user">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((data: { ok?: boolean }) => {
        if (!cancelled) setSession(data.ok ? "user" : "guest");
      })
      .catch(() => {
        if (!cancelled) setSession("guest");
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const isAgencyShell =
    pathname === "/empresa" ||
    pathname?.startsWith("/empresa/") ||
    pathname?.startsWith("/agency") ||
    pathname?.startsWith("/client/");

  const showOnPath =
    !isAgencyShell &&
    LOGGED_IN_SHELL_PREFIXES.some((prefix) => pathname?.startsWith(prefix)) &&
    !pathname?.startsWith("/trip/") &&
    !pathname?.startsWith("/trips/new/planner/propuesta");

  const isDashboardHome = pathname === "/dashboard";

  if (!showOnPath) return null;

  const HEADER_GRADIENT = "linear-gradient(90deg, #F87171 0%, #EF4444 50%, #DC2626 100%)";

  const logoLink = (variant: "light" | "dark" = "light") => (
    <Link
      href="/dashboard"
      className={`shrink-0 outline-none transition hover:opacity-90 focus-visible:ring-2 ${
        variant === "light" ? "focus-visible:ring-white/50" : "focus-visible:ring-[var(--brand)]/40"
      }`}
      aria-label="Ir al panel de viajes"
    >
      <KaviroLogo variant={variant} size="md" withWordmark />
    </Link>
  );

  return (
    <div className="sticky top-0 z-50 overflow-visible pt-safe">
      {isDashboardHome ? (
        <div className="root-header relative overflow-visible border-b border-slate-200/80 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#080C14]">
          <div className="mx-auto max-w-[1200px] px-safe-inline sm:pl-6 sm:pr-6">
            <div className="md:hidden">
              <div className="flex items-center justify-between gap-3 py-3">
                {logoLink("dark")}
                <HeaderActions session={session} isDashboardHome={false} heroMode={false} />
              </div>
              <DashboardRootBarPanel variant="stacked" neutral />
            </div>

            <div className="hidden items-center gap-2.5 py-2 md:flex lg:gap-3">
              {logoLink("dark")}
              <DashboardRootBarPanel variant="inline" neutral />
              <HeaderActions session={session} isDashboardHome={false} heroMode={false} />
            </div>
          </div>
        </div>
      ) : (
        <div
          className="root-header relative overflow-visible shadow-sm"
          style={{ background: HEADER_GRADIENT }}
        >
          <div className="mx-auto max-w-[1200px] px-safe-inline sm:pl-6 sm:pr-6">
            <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
              {logoLink("light")}
              <HeaderActions session={session} isDashboardHome={false} heroMode />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
