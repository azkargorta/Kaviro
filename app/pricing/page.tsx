import Link from "next/link";
import BackButton from "@/components/ui/BackButton";
import type { Metadata } from "next";
import { Zap } from "lucide-react";
import PublicMarketingHeader from "@/components/marketing/PublicMarketingHeader";
import PublicMarketingFooter from "@/components/marketing/PublicMarketingFooter";
import { PRICING_PRICES } from "@/lib/pricing-public";
import PricingPlansGrid from "@/components/pricing/PricingPlansGrid";
import PricingComparisonTable from "@/components/pricing/PricingComparisonTable";
import PricingFaqSection from "@/components/pricing/PricingFaqSection";
import PricingBottomCta from "@/components/pricing/PricingBottomCta";
import PricingViewTracker from "@/components/analytics/PricingViewTracker";
import TrackPremiumLink from "@/components/analytics/TrackPremiumLink";
import { FREE_TRIP_LIMIT } from "@/lib/premium-copy";
import { createClient } from "@/lib/supabase/server";
import { PREMIUM_UPGRADE_HREF, PREMIUM_UPGRADE_LOGIN_HREF } from "@/lib/auth-routes";

export const metadata: Metadata = {
  title: "Precios · Kaviro",
  description: `Plan gratuito: hasta ${FREE_TRIP_LIMIT} viajes y funciones esenciales. Premium desde ${PRICING_PRICES.monthly}/mes con asistente IA y análisis de documentos.`,
  openGraph: {
    title: "Precios · Kaviro",
    description: `Gratis hasta ${FREE_TRIP_LIMIT} viajes. Premium con IA desde ${PRICING_PRICES.monthly}/mes.`,
  },
};

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const premiumHref = user ? PREMIUM_UPGRADE_HREF : PREMIUM_UPGRADE_LOGIN_HREF;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C14]">
      <PricingViewTracker />
      <PublicMarketingHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
      <div className="mb-4"><BackButton /></div>
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-[#F87171] via-[#ef4444] to-[#0f172a] px-6 py-12 text-center md:px-12 md:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Precios</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Organiza gratis. Potencia con Premium.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-white/85">
            El plan gratuito cubre plan, mapa, gastos y documentos para tu grupo. Premium añade IA: itinerarios,
            análisis de tickets y rutas automáticas.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/register"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-bold text-[var(--brand)] transition hover:bg-slate-50"
            >
              Empezar gratis
            </Link>
            <TrackPremiumLink
              href={premiumHref}
              source="pricing_hero"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Zap className="h-4 w-4" />
              Premium — {PRICING_PRICES.monthly}/mes
            </TrackPremiumLink>
          </div>
        </div>

        <PricingPlansGrid premiumHref={premiumHref} />
        <PricingComparisonTable />
        <PricingFaqSection />
        <PricingBottomCta premiumHref={premiumHref} />
      </main>

      <PublicMarketingFooter />
    </div>
  );
}
