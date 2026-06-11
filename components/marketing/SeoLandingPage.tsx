import Link from "next/link";
import PublicMarketingHeader from "@/components/marketing/PublicMarketingHeader";
import PublicMarketingFooter from "@/components/marketing/PublicMarketingFooter";
import Reveal from "@/components/ui/Reveal";
import { APP_NAME } from "@/lib/brand";
import {
  getSeoLandingPage,
  SEO_LANDING_LINK_LABELS,
  SEO_LANDING_PAGES,
  type SeoLandingPageData,
} from "@/lib/seo-landing-pages";
import { ArrowRight, Sparkles } from "lucide-react";

type Props = {
  data: SeoLandingPageData;
};

export default function SeoLandingPage({ data }: Props) {
  const related = data.relatedSlugs
    .map((slug) => SEO_LANDING_PAGES[slug])
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C14]">
      <PublicMarketingHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        {/* Hero */}
        <Reveal variant="fade">
          <section className="rounded-3xl bg-gradient-to-br from-[#F87171] via-[#ef4444] to-[#0f172a] px-6 py-12 text-center md:px-12 md:py-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">{data.hero.eyebrow}</p>
            <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl lg:text-[2.6rem]">
              {data.hero.h1}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
              {data.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth/register"
                className="btn-press inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-bold text-[var(--brand)] transition hover:bg-slate-50"
              >
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </section>
        </Reveal>

        {/* Intro */}
        <Reveal variant="slide" delay={1} className="mx-auto mt-10 max-w-3xl text-center">
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">{data.intro}</p>
        </Reveal>

        {/* Benefits */}
        <section className="mt-12" aria-labelledby="benefits-heading">
          <Reveal variant="fade">
            <h2 id="benefits-heading" className="text-center text-2xl font-extrabold text-slate-900 dark:text-white">
              Por qué usar {APP_NAME}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-slate-400">
              Todo lo que necesitas para este tipo de viaje, sin apps sueltas ni hojas de cálculo.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.benefits.map((benefit, idx) => (
              <Reveal key={benefit.title} variant="slide" delay={(idx % 3) as 0 | 1 | 2}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
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

        {/* Cómo funciona */}
        {data.howItWorks.length > 0 ? (
          <section className="mt-14" aria-labelledby="how-heading">
            <Reveal variant="fade">
              <h2 id="how-heading" className="text-center text-2xl font-extrabold text-slate-900 dark:text-white">
                Cómo funciona
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-slate-400">
                Cuatro pasos para pasar de la idea a un viaje organizado con {APP_NAME}.
              </p>
            </Reveal>
            <ol className="mt-8 grid gap-4 md:grid-cols-2">
              {data.howItWorks.map((step, idx) => (
                <Reveal key={step.title} variant="scale" delay={(idx % 2) as 0 | 1}>
                  <li className="h-full rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-light)] p-5 dark:bg-[var(--brand-light)]/20">
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

        {/* Para quién es */}
        {data.audience.length > 0 ? (
          <section className="mt-14" aria-labelledby="audience-heading">
            <Reveal variant="fade">
              <h2 id="audience-heading" className="text-center text-2xl font-extrabold text-slate-900 dark:text-white">
                Para quién es
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-slate-400">
                Perfiles que más aprovechan esta solución en {APP_NAME}.
              </p>
            </Reveal>
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

        {/* Comparativa */}
        {data.comparison.length > 0 ? (
          <section className="mt-14" aria-labelledby="comparison-heading">
            <Reveal variant="fade">
              <h2 id="comparison-heading" className="text-center text-2xl font-extrabold text-slate-900 dark:text-white">
                Frente a métodos tradicionales
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-slate-400">
                Por qué muchos grupos dejan atrás Excel, PDFs y chats infinitos.
              </p>
            </Reveal>
            <div className="mt-8 space-y-3">
              {data.comparison.map((row, idx) => (
                <Reveal key={row.method} variant="fade" delay={(idx % 2) as 0 | 1}>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] md:p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {row.method}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Problema: </span>
                      {row.problem}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-[var(--brand)]">Con {APP_NAME}: </span>
                      {row.kaviro}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        {/* Enlaces internos */}
        {related.length > 0 ? (
          <section className="mt-14" aria-labelledby="related-heading">
            <Reveal variant="fade">
              <h2 id="related-heading" className="text-center text-2xl font-extrabold text-slate-900 dark:text-white">
                Explora más guías de {APP_NAME}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-slate-400">
                Enlaces relacionados para organizar mejor tu viaje.
              </p>
            </Reveal>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {related.map((page) => (
                <Link
                  key={page.slug}
                  href={`/${page.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[var(--brand-border)] hover:shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]"
                >
                  <p className="text-sm font-bold text-slate-900 group-hover:text-[var(--brand)] dark:text-white">
                    {SEO_LANDING_LINK_LABELS[page.slug] ?? page.hero.h1.split(":")[0]}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {page.metadata.description.slice(0, 110)}…
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
                    Leer guía
                    <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* FAQ */}
        <section className="mt-14" aria-labelledby="faq-heading">
          <Reveal variant="fade">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] md:p-8">
              <h2 id="faq-heading" className="text-lg font-bold text-slate-950 dark:text-white">
                Preguntas frecuentes
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {data.faqs.map((faq) => (
                  <div
                    key={faq.q}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-[#1E293B] dark:bg-[#080C14]"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{faq.q}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* CTA final */}
        <Reveal variant="fade" className="mt-14">
          <section className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-light)] px-6 py-10 text-center dark:bg-[var(--brand-light)]/15 md:px-10">
            <Sparkles className="mx-auto h-6 w-6 text-[var(--brand)]" aria-hidden />
            <h2 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white md:text-2xl">
              {data.finalCta.title}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600 dark:text-slate-300">
              {data.finalCta.description}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href={data.finalCta.primaryHref ?? "/auth/register"}
                className="btn-press inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-[var(--brand)] px-6 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
              >
                {data.finalCta.primaryLabel ?? "Empezar gratis"}
              </Link>
              {data.finalCta.secondaryHref ? (
                <Link
                  href={data.finalCta.secondaryHref}
                  className="inline-flex min-h-[46px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200"
                >
                  {data.finalCta.secondaryLabel ?? "Saber más"}
                </Link>
              ) : null}
            </div>
          </section>
        </Reveal>
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
