"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Plus, Receipt, Sparkles } from "lucide-react";
import { openCreateTripForm } from "@/lib/open-create-trip";
import { canShowExpensesGroupCreation } from "@/lib/expenses-group-rollout";
import { DASHBOARD_CARD, DASHBOARD_CARD_HOVER } from "@/components/dashboard/dashboard-ui";

type Props = {
  disabled?: boolean;
};

type ActionCard = {
  key: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  featured?: boolean;
  href?: string;
  onClick?: () => void;
};

export default function DashboardCreateRow({ disabled = false }: Props) {
  const showExpenses = canShowExpensesGroupCreation();

  const actions: ActionCard[] = [
    {
      key: "ai",
      title: "Planificar con IA",
      subtitle: "Borrador en minutos",
      icon: <Sparkles className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden />,
      featured: true,
      href: "/trips/new/planner",
    },
    {
      key: "create",
      title: "Crear viaje",
      subtitle: "Itinerario manual",
      icon: <Plus className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />,
      onClick: () => openCreateTripForm({ mode: "travel" }),
    },
  ];

  if (showExpenses) {
    actions.push({
      key: "expenses",
      title: "Grupo de gastos",
      subtitle: "Liquidar en grupo",
      icon: <Receipt className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />,
      onClick: () => openCreateTripForm({ mode: "expenses" }),
    });
  }

  return (
    <div
      className={`grid gap-2 ${showExpenses ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      role="group"
      aria-label="Acciones rápidas"
    >
      {actions.map((action) => {
        const shell = `${DASHBOARD_CARD} ${DASHBOARD_CARD_HOVER} flex min-h-[72px] flex-col justify-between p-3 text-left active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 ${
          action.featured
            ? "border-[var(--brand-border)] bg-gradient-to-br from-[var(--brand-light)]/80 via-white to-white ring-1 ring-[var(--brand-border)]/30 dark:from-[#1a0f0f]/25 dark:via-[#0F1623] dark:to-[#0F1623]"
            : ""
        }`;

        const inner = (
          <>
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  action.featured
                    ? "bg-white text-[var(--brand)] shadow-sm ring-1 ring-[var(--brand-border)] dark:bg-[#141c2b]"
                    : "bg-slate-50 ring-1 ring-slate-200/80 dark:bg-[#141c2b] dark:ring-slate-700"
                }`}
              >
                {action.icon}
              </span>
              <div className="min-w-0">
                <p
                  className={`truncate text-sm font-bold tracking-tight ${
                    action.featured ? "text-[var(--brand-text)]" : "text-slate-900 dark:text-white"
                  }`}
                >
                  {action.title}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{action.subtitle}</p>
              </div>
            </div>
          </>
        );

        if (action.href) {
          return (
            <Link key={action.key} href={action.href} className={shell} aria-label={action.title}>
              {inner}
            </Link>
          );
        }

        return (
          <button
            key={action.key}
            type="button"
            disabled={disabled}
            onClick={action.onClick}
            className={shell}
            aria-label={action.title}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
