"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Luggage, Plus, Receipt, Sparkles } from "lucide-react";
import { openCreateTripForm } from "@/lib/open-create-trip";
import { canShowExpensesGroupCreation } from "@/lib/expenses-group-rollout";
import { DASHBOARD_CARD_HOVER } from "@/components/dashboard/dashboard-ui";

type Props = {
  disabled?: boolean;
};

type ActionVariant = "ai" | "create" | "expenses";

type ActionCard = {
  key: string;
  variant: ActionVariant;
  title: string;
  subtitle: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
};

const VARIANT_SHELL: Record<ActionVariant, string> = {
  ai: `${DASHBOARD_CARD_HOVER} group relative overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-gradient-to-br from-[var(--brand-light)] via-white to-white p-4 text-left shadow-[0_4px_18px_rgba(248,113,113,0.1)] ring-1 ring-[var(--brand-border)]/35 dark:from-[#1a0f0f]/35 dark:via-[#0F1623] dark:to-[#0F1623]`,
  create: `${DASHBOARD_CARD_HOVER} group rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-[0_2px_12px_rgba(15,23,42,0.06)] dark:border-[#1E293B] dark:bg-[#0F1623]`,
  expenses: `${DASHBOARD_CARD_HOVER} group rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/60 via-white to-white p-4 text-left shadow-[0_2px_12px_rgba(15,23,42,0.05)] ring-1 ring-emerald-100/80 dark:border-emerald-900/30 dark:from-emerald-950/15 dark:via-[#0F1623] dark:to-[#0F1623]`,
};

const VARIANT_ICON: Record<ActionVariant, string> = {
  ai: "bg-white text-[var(--brand)] shadow-sm ring-1 ring-[var(--brand-border)] dark:bg-[#141c2b]",
  create: "bg-slate-50 text-slate-700 ring-1 ring-slate-200/90 group-hover:bg-[var(--brand-light)] group-hover:text-[var(--brand)] dark:bg-[#141c2b] dark:text-slate-200",
  expenses: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-300",
};

export default function DashboardCreateRow({ disabled = false }: Props) {
  const showExpenses = canShowExpensesGroupCreation();

  const actions: ActionCard[] = [
    {
      key: "ai",
      variant: "ai",
      title: "Planificar con IA",
      subtitle: "Crea un borrador en minutos",
      icon: <Sparkles className="h-5 w-5" aria-hidden />,
      href: "/trips/new/planner",
    },
    {
      key: "create",
      variant: "create",
      title: "Crear viaje",
      subtitle: "Empieza desde cero",
      icon: <Luggage className="h-5 w-5" aria-hidden />,
      onClick: () => openCreateTripForm({ mode: "travel" }),
    },
  ];

  if (showExpenses) {
    actions.push({
      key: "expenses",
      variant: "expenses",
      title: "Grupo de gastos",
      subtitle: "Reparte pagos sin viaje",
      icon: <Receipt className="h-5 w-5" aria-hidden />,
      onClick: () => openCreateTripForm({ mode: "expenses" }),
    });
  }

  return (
    <div className="space-y-2.5">
      <div>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Acciones principales
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Empieza un viaje, planifica con IA o liquida gastos en grupo.
        </p>
      </div>
      <div
        className={`grid gap-3 ${showExpenses ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
        role="group"
        aria-label="Acciones principales"
      >
        {actions.map((action) => {
          const shell = `${VARIANT_SHELL[action.variant]} min-h-[108px] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50`;

          const inner = (
            <>
              {action.variant === "ai" ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[var(--brand)]/10"
                />
              ) : null}
              <span
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition ${VARIANT_ICON[action.variant]}`}
              >
                {action.icon}
              </span>
              <p
                className={`relative mt-3 text-sm font-extrabold tracking-tight ${
                  action.variant === "ai"
                    ? "text-[var(--brand-text)]"
                    : action.variant === "expenses"
                      ? "text-emerald-900 dark:text-emerald-100"
                      : "text-slate-900 dark:text-white"
                }`}
              >
                {action.title}
              </p>
              <p className="relative mt-0.5 text-xs text-slate-500 dark:text-slate-400">{action.subtitle}</p>
              <span className="relative mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 opacity-0 transition group-hover:opacity-100 group-hover:text-[var(--brand)]">
                Empezar
                <Plus className="h-3 w-3" aria-hidden />
              </span>
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
    </div>
  );
}
