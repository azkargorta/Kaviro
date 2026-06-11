"use client";

import Link from "next/link";
import TrackPremiumLink from "@/components/analytics/TrackPremiumLink";
import { Star } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { PRICING_PRICES } from "@/lib/pricing-public";
import { FREE_TRIP_LIMIT } from "@/lib/premium-copy";

type PricingBottomCtaProps = {
  premiumHref: string;
};

export default function PricingBottomCta({ premiumHref }: PricingBottomCtaProps) {
  return (
    <Reveal variant="scale" className="mt-8">
      <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-light)] p-8 text-center">
        <p className="text-lg font-extrabold text-slate-900 dark:text-white">
          ¿Listo para organizar tu próximo viaje?
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Empieza gratis con hasta {FREE_TRIP_LIMIT} viajes. Activa Premium cuando quieras IA.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/auth/register"
            className="btn-press inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
          >
            Empezar gratis
          </Link>
          <TrackPremiumLink
            href={premiumHref}
            source="pricing_bottom_cta"
            className="btn-press inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl bg-[var(--brand)] px-6 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
          >
            <Star className="h-4 w-4" />
            Premium — {PRICING_PRICES.monthly}/mes
          </TrackPremiumLink>
        </div>
      </div>
    </Reveal>
  );
}
