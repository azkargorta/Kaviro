import Link from "next/link";
import { SeoSectionHeading } from "@/components/marketing/seo/SeoPageSections";
import Reveal from "@/components/ui/Reveal";
import {
  KAVIRO_CURRENT_FEATURES,
  KAVIRO_FREE_PLAN_LIMITS,
  KAVIRO_FUTURE_FEATURES,
  KAVIRO_PREMIUM_CURRENT_FEATURES,
  type KaviroFeatureItem,
} from "@/lib/kaviro-public-knowledge";

function FeatureGrid({ features, variant }: { features: readonly KaviroFeatureItem[]; variant: "slide" | "fade" }) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {features.map((f, idx) => (
        <Reveal key={f.title} variant={variant} delay={(idx % 2) as 0 | 1}>
          <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">{f.title}</h4>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.description}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export default function KaviroCurrentFeaturesSection() {
  return (
    <section className="mt-12" aria-labelledby="current-features-heading">
      <SeoSectionHeading
        id="current-features-heading"
        title="Funciones actuales de Kaviro"
        subtitle="Solo funciones disponibles hoy, separadas por plan. Consulta /pricing para límites y precios actualizados."
      />

      <div className="mt-10">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Plan gratuito — funciones actuales</h3>
        <FeatureGrid features={KAVIRO_CURRENT_FEATURES} variant="slide" />
      </div>

      <div className="mt-10">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Límites del plan gratuito</h3>
        <ul className="mt-4 space-y-2">
          {KAVIRO_FREE_PLAN_LIMITS.map((item, idx) => (
            <Reveal key={item} variant="fade" delay={(idx % 2) as 0 | 1}>
              <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-300">
                {item}
              </li>
            </Reveal>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Detalle completo en{" "}
          <Link href="/pricing" className="font-semibold text-[var(--brand)] hover:underline">
            /pricing
          </Link>
          .
        </p>
      </div>

      <div className="mt-10">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Funciones Premium actuales</h3>
        <FeatureGrid features={KAVIRO_PREMIUM_CURRENT_FEATURES} variant="fade" />
      </div>

      <div className="mt-10">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Funciones futuras o en desarrollo</h3>
        <FeatureGrid features={KAVIRO_FUTURE_FEATURES} variant="fade" />
      </div>
    </section>
  );
}
