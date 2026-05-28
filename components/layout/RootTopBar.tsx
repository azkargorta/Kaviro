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

  return (
    <div className="sticky top-0 z-50 pt-safe">
      <div
        className="root-header relative overflow-hidden shadow-sm"
        style={{ background: headerGradient }}
      >
        <div className="mx-auto max-w-[1200px] px-safe-inline sm:pl-6 sm:pr-6">
          <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
            <Link
              href="/dashboard"
              className="min-w-0 shrink outline-none ring-white/0 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label="Ir al panel de viajes"
            >
              <KaviroLogo variant="light" size="md" withWordmark />
            </Link>
            <div className="flex items-center gap-2">
              {!isDashboardHome ? <PremiumBadge /> : null}
              <DarkModeToggle heroMode />
              {session === "user" ? (
                <>
                  <LoggedInRoutePrefetch />
                  <LoggedInHeaderActions heroMode />
                </>
              ) : null}
            </div>
          </div>
          {isDashboardHome ? <DashboardRootBarPanel /> : null}
        </div>
      </div>
    </div>
  );
}

