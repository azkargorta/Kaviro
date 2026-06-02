"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import KaviroLogo from "@/components/brand/KaviroLogo";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import LoggedInHeaderActions from "@/components/layout/LoggedInHeaderActions";

export default function PublicMarketingHeader() {
  const pathname = usePathname();
  const onPricing = pathname === "/pricing";
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
  }, []);

  const showGuestAuth = session === "guest";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 sticky-safe-top transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm dark:border-[#1E293B] dark:bg-[#080C14]/90"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-safe-inline py-3 sm:px-6">
        <div className="block dark:hidden">
          <KaviroLogo href="/" variant="dark" size="lg" withWordmark />
        </div>
        <div className="hidden dark:block">
          <KaviroLogo href="/" variant="light" size="lg" withWordmark />
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/help"
            className="hidden sm:block px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Ayuda
          </Link>
          <Link
            href="/pricing"
            className={`hidden sm:block px-3 py-2 text-sm font-semibold transition ${
              onPricing
                ? "text-[var(--brand)]"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            }`}
          >
            Precios
          </Link>
          {session === "user" ? (
            <Link
              href="/dashboard"
              className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-100 dark:hover:bg-[#1E293B]"
            >
              Mi panel
            </Link>
          ) : null}
          {showGuestAuth ? (
            <>
              <Link
                href="/auth/login"
                className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 sm:px-4 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-100 dark:hover:bg-[#1E293B]"
              >
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className="btn-press inline-flex min-h-9 items-center justify-center rounded-xl bg-[var(--brand)] px-3 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)] sm:px-4"
              >
                Empezar gratis
              </Link>
            </>
          ) : null}
          {session === "user" ? <LoggedInHeaderActions /> : null}
          <DarkModeToggle />
        </nav>
      </div>
    </header>
  );
}
