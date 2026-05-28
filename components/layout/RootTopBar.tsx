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
}: {
  session: "loading" | "guest" | "user";
  isDashboardHome: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {!isDashboardHome ? <PremiumBadge /> : null}
      <DarkModeToggle heroMode />
      {session === "user" ? (
        <>
          <LoggedInRoutePrefetch />
          <LoggedInHeaderActions heroMode />
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

  const showOnPath =
    LOGGED_IN_SHELL_PREFIXES.some((prefix) => pathname?.startsWith(prefix)) &&
    !pathname?.startsWith("/trip/");

  const isDashboardHome = pathname === "/dashboard";

  if (!showOnPath) return null;

  const headerGradient = isDashboardHome
    ? "linear-gradient(135deg, #F87171 0%, #EF4444 60%, #DC2626 100%)"
    : "linear-gradient(90deg, #F87171 0%, #EF4444 50%, #DC2626 100%)";

  const logoLink = (
    <Link
      href="/dashboard"
      className="shrink-0 outline-none ring-white/0 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/50"
      aria-label="Ir al panel de viajes"
    >
      <KaviroLogo variant="light" size={isDashboardHome ? "sm" : "md"} withWordmark />
    </Link>
  );

  return (
    <div className="sticky top-0 z-50 pt-safe">
      <div
        className="root-header relative overflow-hidden shadow-sm"
        style={{ background: headerGradient }}
      >
        <div className="mx-auto max-w-[1200px] px-safe-inline sm:pl-6 sm:pr-6">
          {isDashboardHome ? (
            <>
              {/* Móvil: logo + controles arriba; panel debajo (como antes) */}
              <div className="md:hidden">
                <div className="flex items-center justify-between gap-3 py-3">
                  <Link
                    href="/dashboard"
                    className="min-w-0 shrink outline-none ring-white/0 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/50"
                    aria-label="Ir al panel de viajes"
                  >
                    <KaviroLogo variant="light" size="md" withWordmark />
                  </Link>
                  <HeaderActions session={session} isDashboardHome />
                </div>
                <DashboardRootBarPanel variant="stacked" />
              </div>

              {/* Escritorio: logo · panel · controles en una fila compacta */}
              <div className="hidden items-center gap-3 py-2 md:flex lg:gap-4">
                {logoLink}
                <DashboardRootBarPanel variant="inline" />
                <HeaderActions session={session} isDashboardHome />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
              <Link
                href="/dashboard"
                className="min-w-0 shrink outline-none ring-white/0 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label="Ir al panel de viajes"
              >
                <KaviroLogo variant="light" size="md" withWordmark />
              </Link>
              <HeaderActions session={session} isDashboardHome={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
