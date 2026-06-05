"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import UserNotificationsButton from "@/components/notifications/UserNotificationsButton";
import { Building2, Database, Inbox, LayoutDashboard, LineChart } from "lucide-react";

const NAV = [
  { href: "/ops", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/ops/agencies", label: "Agencias", icon: Building2 },
  { href: "/ops/leads", label: "Leads", icon: Inbox },
  { href: "/ops/migrations", label: "SQL", icon: Database },
  { href: "/dashboard/admin", label: "Métricas producto", icon: LineChart },
] as const;

export default function OpsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pricingPending, setPricingPending] = useState(0);

  useEffect(() => {
    fetch("/api/ops/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.needsMigration) setPricingPending(data.pricingPending ?? 0);
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <div className="min-h-[100dvh] bg-slate-100 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Kaviro Ops</p>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Administración de plataforma</h1>
          </div>
          <div className="flex items-center gap-2">
            <UserNotificationsButton compact />
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
          {NAV.map((item) => {
            const { href, label, icon: Icon } = item;
            const exact = "exact" in item && item.exact;
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            const showPricingBadge = href === "/ops/agencies" && pricingPending > 0;
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${
                  active
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
                {showPricingBadge ? (
                  <span
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white"
                    title={`${pricingPending} sin tarifa`}
                  >
                    {pricingPending > 9 ? "9+" : pricingPending}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
