"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import KaviroLogo from "@/components/brand/KaviroLogo";
import { PremiumBadge } from "@/components/layout/PremiumBadge";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

export default function RootTopBar() {
  const pathname = usePathname();

  // Mostrar en dashboard y en el wizard de nuevo viaje.
  const showOnPath = pathname?.startsWith("/dashboard") || pathname?.startsWith("/trips/new");
  if (!showOnPath) return null;

  return (
    <div className="sticky top-0 z-50 pt-safe">
      <div
        className="root-header shadow-sm"
        style={{
          background: "linear-gradient(90deg, #F87171 0%, #EF4444 50%, #DC2626 100%)",
        }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-safe-inline py-3 sm:py-4 sm:pl-6 sm:pr-6">
          <Link
            href="/dashboard"
            className="min-w-0 shrink outline-none ring-white/0 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label="Ir al panel de viajes"
          >
            <KaviroLogo variant="light" size="md" withWordmark imageClassName="h-8 max-h-8 sm:h-9 sm:max-h-9" />
          </Link>
          <div className="flex items-center gap-2">
            <PremiumBadge />
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}

