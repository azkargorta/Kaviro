import Link from "next/link";
import KaviroCurrentFeaturesSection from "@/components/marketing/KaviroCurrentFeaturesSection";
import KaviroOfficialBrandBanner from "@/components/marketing/KaviroOfficialBrandBanner";
import PublicMarketingHeader from "@/components/marketing/PublicMarketingHeader";
import PublicMarketingFooter from "@/components/marketing/PublicMarketingFooter";
import JsonLdScript from "@/components/marketing/JsonLdScript";
import {
  SeoCompactHero,
  SeoComparisonGrid,
  SeoExampleSection,
  SeoFaqSection,
  SeoFinalCta,
  SeoSectionHeading,
} from "@/components/marketing/seo/SeoPageSections";
import Reveal from "@/components/ui/Reveal";
import { APP_NAME } from "@/lib/brand";
import { kaviroPublicPageJsonLd } from "@/lib/kaviro-json-ld";
import {
  KAVIRO_AUDIENCE,
  KAVIRO_COMPARISON,
  KAVIRO_OFFICIAL_PAGES,
  KAVIRO_PROBLEMS_SOLVED,
  KAVIRO_PRODUCT_SUMMARY,
  KAVIRO_PUBLIC_FAQS,
  KAVIRO_WHAT_IT_IS_NOT,
} from "@/lib/kaviro-public-knowledge";
import { SEO_LANDING_EXAMPLES } from "@/lib/seo-landing-examples";
import { SEO_LANDING_LINK_LABELS } from "@/lib/seo-landing-pages";
import { ArrowRight } from "lucide-react";

const GUIDE_ICONS: Record<string, string> = {
  "organizador-viajes": "🧳",
  "control-gastos-viaje": "💸",
  "itinerario-viaje": "📅",
  "planificador-viajes-ia": "✨",
};

export default function QueEsKaviroPage() {
  const seoGuides = KAVIRO_OFFICIAL_PAGES.filter((p) =>
    ["/organizador-viajes", "/control-gastos-viaje", "/itinerario-viaje", "/planificador-viajes-ia"].includes(
      p.href
    )
  );
  const example = SEO_LANDING_EXAMPLES["que-es-kaviro"];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C14]">
      <JsonLdScript data={kaviroPublicPageJsonLd("/que-es-kaviro", "Qué es Kaviro")} />
      <PublicMarketingHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <SeoCompactHero
          eyebrow="Sobre el producto"
          h1={`¿Qué es ${APP_NAME}?`}
          subtitle={KAVIRO_PRODUCT_SUMMARY}
          previewVariant="overview"
          secondaryHref="/kaviro-info"
          secondaryLabel="Ver ficha técnica"
        />

        <KaviroOfficialBrandBanner className="mx-auto mt-6 max-w-3xl" />

        <Reveal variant="slide" delay={1} className="mx-auto mt-8 max-w-3xl text-center">
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
            {APP_NAME} ayuda a grupos que viajan juntos a dejar de depender de chats, PDFs y hojas de cálculo
            sueltas. Un organizador crea el viaje, invita al grupo y todos consultan el mismo plan, los mismos
            gastos y los mismos documentos desde el móvil o el ordenador.
          </p>
        </Reveal>

        {example ? <SeoExampleSection example={example} /> : null}

        <section className="mt-12" aria-labelledby="not-kaviro-heading">
          <SeoSectionHeading
            id="not-kaviro-heading"
            title="Qué no es Kaviro"
            subtitle="Aclaración para evitar confusiones con agencias, OTAs o webs de reservas."
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {KAVIRO_WHAT_IT_IS_NOT.map((item, idx) => (
              <Reveal key={item} variant="fade" delay={(idx % 2) as 0 | 1}>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-relaxed text-slate-700 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-300">
                  {item}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <KaviroCurrentFeaturesSection />

        <section className="mt-14" aria-labelledby="audience-heading">
          <SeoSectionHeading
            id="audience-heading"
            title="Para quién es"
            subtitle="Perfiles que más aprovechan organizar viajes con Kaviro."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {KAVIRO_AUDIENCE.map((item, idx) => (
              <Reveal key={item} variant="fade" delay={(idx % 2) as 0 | 1}>
                <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
                  <span className="mt-0.5 text-[var(--brand)]" aria-hidden>
                    ✓
                  </span>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{item}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-14" aria-labelledby="problems-heading">
          <SeoSectionHeading
            id="problems-heading"
            title="Qué problemas resuelve"
            subtitle="Los dolores habituales al coordinar viajes en grupo — y cómo los evita Kaviro."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {KAVIRO_PROBLEMS_SOLVED.map((item, idx) => (
              <Reveal key={item} variant="slide" delay={(idx % 2) as 0 | 1}>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-relaxed text-slate-700 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-300">
                  {item}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-14" aria-labelledby="comparison-heading">
          <SeoSectionHeading
            id="comparison-heading"
            title="Frente a WhatsApp, Excel, Google Docs o apps aisladas"
            subtitle="Por qué muchos grupos dejan atrás métodos dispersos al planificar."
          />
          <SeoComparisonGrid rows={KAVIRO_COMPARISON} />
        </section>

        <section className="mt-14" aria-labelledby="guides-heading">
          <SeoSectionHeading
            id="guides-heading"
            title="Guías relacionadas"
            subtitle="Profundiza en cada área del producto con nuestras páginas temáticas."
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {seoGuides.map((page) => {
              const slug = page.href.slice(1);
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[var(--brand-border)] hover:shadow-md dark:border-[#1E293B] dark:bg-[#0F1623]"
                >
                  <span className="text-xl" aria-hidden>
                    {GUIDE_ICONS[slug] ?? "🔗"}
                  </span>
                  <p className="mt-2 text-sm font-bold text-slate-900 group-hover:text-[var(--brand)] dark:text-white">
                    {SEO_LANDING_LINK_LABELS[slug] ?? page.label}
                  </p>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {page.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
                    Leer guía
                    <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              );
            })}
            <Link
              href="/kaviro-info"
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[var(--brand-border)] hover:shadow-md dark:border-[#1E293B] dark:bg-[#0F1623]"
            >
              <span className="text-xl" aria-hidden>
                📋
              </span>
              <p className="mt-2 text-sm font-bold text-slate-900 group-hover:text-[var(--brand)] dark:text-white">
                Kaviro Info
              </p>
              <p className="mt-1 flex-1 text-xs text-slate-500 dark:text-slate-400">
                Ficha estructurada para buscadores y asistentes de IA.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
                Ver ficha
                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </div>
        </section>

        <SeoFaqSection faqs={KAVIRO_PUBLIC_FAQS} />

        <SeoFinalCta
          title={`Prueba ${APP_NAME} gratis`}
          description="Crea tu primer viaje, invita al grupo y organiza plan y gastos en un solo sitio."
          primaryLabel="Crear cuenta gratis"
          secondaryHref="/kaviro-info"
          secondaryLabel="Ver ficha técnica"
        />
      </main>

      <PublicMarketingFooter />
    </div>
  );
}
