"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import KaviroLogo from "@/components/brand/KaviroLogo";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

export default function PublicMarketingHeader() {
  const pathname = usePathname();
  const onPricing = pathname === "/pricing";

  return (
    <header className="sticky top-0 z-50 sticky-safe-top border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-[#1E293B] dark:bg-[#080C14]/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-safe-inline py-3 sm:px-6">
        <div className="block dark:hidden">
          <KaviroLogo href="/" variant="dark" size="lg" withWordmark imageClassName="h-9 max-h-9" />
        </div>
        <div className="hidden dark:block">
          <KaviroLogo href="/" variant="light" size="lg" withWordmark imageClassName="h-9 max-h-9 brightness-200" />
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
          <Link
            href="/auth/login"
            className="px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Entrar
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex min-h-9 items-center justify-center rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
          >
            Empezar gratis
          </Link>
          <DarkModeToggle />
        </nav>
      </div>
    </header>
  );
}
