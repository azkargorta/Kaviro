"use client";

import Link from "next/link";
import TrackPremiumLink from "@/components/analytics/TrackPremiumLink";
import { Check, Zap, ArrowRight, Lock } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import {
  FREE_PLAN_FEATURES,
  PREMIUM_PLAN_FEATURES,
  PRICING_PRICES,
} from "@/lib/pricing-public";
import { Map, Users, CreditCard, FileText } from "lucide-react";

const FREE_ICONS: Record<string, typeof Map> = {
  plan: Map,
  participants: Users,
  expenses: CreditCard,
  docs: FileText,
  share: Check,
  places: Check,
  export: Check,
  trips: Check,
};

type PricingPlansGridProps = {
  premiumHref: string;
};

export default function PricingPlansGrid({ premiumHref }: PricingPlansGridProps) {
  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-2">
      <Reveal variant="slide" delay={1}>
        <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Plan gratuito</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            0€
            <span className="ml-1 text-base font-semibold text-slate-400">/ mes</span>
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Ideal para probar Kaviro con tu grupo sin tarjeta.
          </p>
          <ul className="mt-6 space-y-3">
            {FREE_PLAN_FEATURES.map(({ key, text }) => {
              const Icon = FREE_ICONS[key] ?? Check;
              return (
                <li key={key} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <Icon className="h-4 w-4 shrink-0 text-emerald-500" />
                  {text}
                </li>
              );
            })}
          </ul>
          <Link
            href="/auth/register"
            className="btn-press mt-8 flex min-h-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#080C14] dark:text-white dark:hover:bg-[#1E293B]"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </Reveal>

      <Reveal variant="scale" delay={2}>
        <div className="plan-featured-pulse relative h-full overflow-hidden rounded-2xl border-2 border-[var(--brand-border)] bg-white p-6 shadow-sm dark:bg-[#0F1623] md:p-8">
          <div className="absolute right-4 top-4 rounded-full bg-[var(--brand)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Popular
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">Plan Premium</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            {PRICING_PRICES.monthly}
            <span className="ml-1 text-base font-semibold text-slate-400">/ mes</span>
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-400">
            o {PRICING_PRICES.yearly} / año — {PRICING_PRICES.yearlyNote}
          </p>
          <ul className="mt-6 space-y-3">
            {PREMIUM_PLAN_FEATURES.map(({ key, text, highlight }) => (
              <li
                key={key}
                className={`flex items-center gap-2.5 text-sm ${
                  highlight ? "font-semibold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {highlight ? (
                  <Zap className="h-4 w-4 shrink-0 text-[var(--brand)]" />
                ) : (
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                )}
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-2.5">
            <TrackPremiumLink
              href={premiumHref}
              source="pricing_plans_grid"
              className="btn-press flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
            >
              <Zap className="h-4 w-4" />
              Hazte Premium
              <ArrowRight className="h-4 w-4" />
            </TrackPremiumLink>
            <p className="text-center text-xs text-slate-400">
              <Lock className="mr-1 inline h-3 w-3" />
              Cancela cuando quieras · Pago seguro con Stripe
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
