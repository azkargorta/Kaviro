import PublicMarketingHeader from "@/components/marketing/PublicMarketingHeader";
import PublicMarketingFooter from "@/components/marketing/PublicMarketingFooter";
import {
  SeoCompactHero,
  SeoComparisonGrid,
  SeoExampleSection,
  SeoFaqSection,
  SeoFinalCta,
  SeoInternalLinks,
  SeoSectionHeading,
} from "@/components/marketing/seo/SeoPageSections";
import Reveal from "@/components/ui/Reveal";
import { APP_NAME } from "@/lib/brand";
import { SEO_LANDING_EXAMPLES } from "@/lib/seo-landing-examples";
import {
  getSeoLandingPage,
  SEO_LANDING_PAGES,
  type SeoLandingPageData,
} from "@/lib/seo-landing-pages";

type Props = {
  data: SeoLandingPageData;
};

export default function SeoLandingPage({ data }: Props) {
  const related = data.relatedSlugs
    .map((slug) => SEO_LANDING_PAGES[slug])
    .filter(Boolean);
  const example = SEO_LANDING_EXAMPLES[data.slug];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C14]">
      <PublicMarketingHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <SeoCompactHero
          eyebrow={data.hero.eyebrow}
          h1={data.hero.h1}
          subtitle={data.hero.subtitle}
          previewVariant={example?.variant ?? "trip"}
        />

        <Reveal variant="slide" delay={1} className="mx-auto mt-8 max-w-3xl text-center">
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">{data.intro}</p>
        </Reveal>

        {example ? <SeoExampleSection example={example} /> : null}

        <section className="mt-12" aria-labelledby="benefits-heading">
          <SeoSectionHeading
            id="benefits-heading"
            title={`Por qué usar ${APP_NAME}`}
            subtitle="Todo lo que necesitas para este tipo de viaje, sin apps sueltas ni hojas de cálculo."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.benefits.map((benefit, idx) => (
              <Reveal key={benefit.title} variant="slide" delay={(idx % 3) as 0 | 1 | 2}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-[#1E293B] dark:bg-[#0F1623]">
                  <span className="text-2xl" aria-hidden>
                    {benefit.icon}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">{benefit.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {benefit.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {data.howItWorks.length > 0 ? (
          <section className="mt-14" aria-labelledby="how-heading">
            <SeoSectionHeading
              id="how-heading"
              title="Cómo funciona"
              subtitle={`Cuatro pasos para pasar de la idea a un viaje organizado con ${APP_NAME}.`}
            />
            <ol className="mt-8 grid gap-4 md:grid-cols-2">
              {data.howItWorks.map((step, idx) => (
                <Reveal key={step.title} variant="scale" delay={(idx % 2) as 0 | 1}>
                  <li className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-extrabold text-white">
                      {idx + 1}
                    </span>
                    <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {step.description}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </section>
        ) : null}

        {data.audience.length > 0 ? (
          <section className="mt-14" aria-labelledby="audience-heading">
            <SeoSectionHeading
              id="audience-heading"
              title="Para quién es"
              subtitle={`Perfiles que más aprovechan esta solución en ${APP_NAME}.`}
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {data.audience.map((item, idx) => (
                <Reveal key={item.title} variant="slide" delay={(idx % 2) as 0 | 1}>
                  <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
                    <span className="text-2xl" aria-hidden>
                      {item.icon}
                    </span>
                    <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        {data.comparison.length > 0 ? (
          <section className="mt-14" aria-labelledby="comparison-heading">
            <SeoSectionHeading
              id="comparison-heading"
              title="Frente a métodos tradicionales"
              subtitle="Por qué muchos grupos dejan atrás Excel, PDFs y chats infinitos."
            />
            <SeoComparisonGrid rows={data.comparison} />
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="mt-14" aria-labelledby="related-heading">
            <SeoSectionHeading
              id="related-heading"
              title={`Explora más guías de ${APP_NAME}`}
              subtitle="Enlaces relacionados para organizar mejor tu viaje."
            />
            <SeoInternalLinks related={related} />
          </section>
        ) : null}

        <SeoFaqSection faqs={data.faqs} />

        <SeoFinalCta
          title={data.finalCta.title}
          description={data.finalCta.description}
          primaryHref={data.finalCta.primaryHref}
          primaryLabel={data.finalCta.primaryLabel}
          secondaryHref={data.finalCta.secondaryHref}
          secondaryLabel={data.finalCta.secondaryLabel}
        />
      </main>

      <PublicMarketingFooter />
    </div>
  );
}

export function buildSeoLandingMetadata(slug: string) {
  const data = getSeoLandingPage(slug);
  if (!data) return {};
  const canonical = `https://www.kaviro.app/${slug}`;
  return {
    title: data.metadata.title,
    description: data.metadata.description,
    keywords: data.metadata.keywords,
    alternates: { canonical },
    openGraph: {
      title: data.metadata.title,
      description: data.metadata.description,
      type: "website" as const,
      siteName: APP_NAME,
      url: canonical,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: data.metadata.title,
      description: data.metadata.description,
    },
  };
}
