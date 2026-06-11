import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import SeoAppPreviewMockup from "@/components/marketing/seo/SeoAppPreviewMockup";
import SeoFaqAccordion from "@/components/marketing/seo/SeoFaqAccordion";
import Reveal from "@/components/ui/Reveal";
import { APP_NAME } from "@/lib/brand";
import type { SeoLandingExample } from "@/lib/seo-landing-examples";
import type { SeoLandingComparison, SeoLandingFaq } from "@/lib/seo-landing-pages";
import { SEO_LANDING_LINK_LABELS, type SeoLandingPageData } from "@/lib/seo-landing-pages";

const LINK_ICONS: Record<string, string> = {
  "organizador-viajes": "🧳",
  "control-gastos-viaje": "💸",
  "itinerario-viaje": "📅",
  "planificador-viajes-ia": "✨",
  "que-es-kaviro": "ℹ️",
  "kaviro-info": "📋",
};

type HeroProps = {
  eyebrow: string;
  h1: string;
  subtitle: string;
  previewVariant: SeoLandingExample["variant"];
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function SeoCompactHero({
  eyebrow,
  h1,
  subtitle,
  previewVariant,
  primaryHref = "/auth/register",
  primaryLabel = "Crear cuenta gratis",
  secondaryHref = "/auth/login",
  secondaryLabel = "Ya tengo cuenta",
}: HeroProps) {
  return (
    <Reveal variant="fade">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
        <div className="grid items-center gap-6 p-6 md:grid-cols-2 md:gap-8 md:p-8">
          <div className="text-center md:text-left">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
              <span className="h-1 w-6 rounded-full bg-[var(--brand)]" aria-hidden />
              {eyebrow}
            </p>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white md:text-3xl lg:text-[2rem]">
              {h1}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:text-base">
              {subtitle}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Link
                href={primaryHref}
                className="btn-press inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-hover)]"
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href={secondaryHref}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-[#334155] dark:bg-transparent dark:text-slate-200"
              >
                {secondaryLabel}
              </Link>
            </div>
          </div>
          <SeoAppPreviewMockup variant={previewVariant} compact />
        </div>
      </section>
    </Reveal>
  );
}

export function SeoExampleSection({ example }: { example: SeoLandingExample }) {
  return (
    <section className="mt-12" aria-labelledby="example-heading">
      <Reveal variant="fade">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623]">
          <div className="grid gap-6 p-6 md:grid-cols-2 md:items-center md:p-8">
            <div>
              <h2 id="example-heading" className="text-xl font-bold text-slate-900 dark:text-white">
                {example.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {example.description}
              </p>
              <ul className="mt-4 space-y-2">
                {example.highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
            <SeoAppPreviewMockup variant={example.variant} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function SeoComparisonGrid({
  rows,
}: {
  rows: readonly SeoLandingComparison[] | SeoLandingComparison[];
}) {
  return (
    <div className="mt-8 space-y-3">
      {rows.map((row, idx) => (
        <Reveal key={row.method} variant="fade" delay={(idx % 2) as 0 | 1}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-[#1E293B] dark:bg-[#080C14]">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                vs {row.method}
              </p>
            </div>
            <div className="grid md:grid-cols-2">
              <div className="flex gap-3 border-b border-slate-100 p-4 md:border-b-0 md:border-r dark:border-[#1E293B]">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Limitación</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{row.problem}</p>
                </div>
              </div>
              <div className="flex gap-3 border-l-0 border-[var(--brand)] bg-slate-50/50 p-4 md:border-l-2 dark:bg-[#141c2b]/40">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--brand)]">
                    Con {APP_NAME}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-800 dark:text-slate-200">{row.kaviro}</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function SeoInternalLinks({ related }: { related: SeoLandingPageData[] }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {related.map((page) => (
        <Link
          key={page.slug}
          href={`/${page.slug}`}
          className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[var(--brand-border)] hover:shadow-md dark:border-[#1E293B] dark:bg-[#0F1623]"
        >
          <span className="text-xl" aria-hidden>
            {LINK_ICONS[page.slug] ?? "🔗"}
          </span>
          <p className="mt-2 text-sm font-bold text-slate-900 group-hover:text-[var(--brand)] dark:text-white">
            {SEO_LANDING_LINK_LABELS[page.slug] ?? page.hero.h1.split(":")[0]}
          </p>
          <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {page.metadata.description.slice(0, 90)}…
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
            Explorar
            <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </Link>
      ))}
      <Link
        href="/que-es-kaviro"
        className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[var(--brand-border)] hover:shadow-md dark:border-[#1E293B] dark:bg-[#0F1623]"
      >
        <span className="text-xl" aria-hidden>
          ℹ️
        </span>
        <p className="mt-2 text-sm font-bold text-slate-900 group-hover:text-[var(--brand)] dark:text-white">
          Qué es Kaviro
        </p>
        <p className="mt-1 flex-1 text-xs text-slate-500 dark:text-slate-400">
          Explicación completa del producto para usuarios y buscadores.
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
          Leer más
          <ArrowRight className="h-3 w-3" aria-hidden />
        </span>
      </Link>
    </div>
  );
}

export function SeoFaqSection({ faqs }: { faqs: SeoLandingFaq[] }) {
  return (
    <section className="mt-14" aria-labelledby="faq-heading">
      <Reveal variant="fade">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-2 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] md:px-8">
          <h2 id="faq-heading" className="pt-6 text-lg font-bold text-slate-950 dark:text-white">
            Preguntas frecuentes
          </h2>
          <div className="mt-2 pb-4">
            <SeoFaqAccordion faqs={faqs} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

type CtaProps = {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function SeoFinalCta({
  title,
  description,
  primaryHref = "/auth/register",
  primaryLabel = "Empezar gratis",
  secondaryHref,
  secondaryLabel,
}: CtaProps) {
  return (
    <Reveal variant="fade" className="mt-14">
      <section className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] md:px-10">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white md:text-2xl">{title}</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={primaryHref}
            className="btn-press inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-6 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          {secondaryHref ? (
            <Link
              href={secondaryHref}
              className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-slate-200 px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-[#334155] dark:text-slate-200"
            >
              {secondaryLabel ?? "Saber más"}
            </Link>
          ) : null}
        </div>
      </section>
    </Reveal>
  );
}

export function SeoSectionHeading({
  id,
  title,
  subtitle,
}: {
  id: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Reveal variant="fade">
      <h2 id={id} className="text-center text-2xl font-extrabold text-slate-900 dark:text-white">
        {title}
      </h2>
      {subtitle ? (
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      ) : null}
    </Reveal>
  );
}
