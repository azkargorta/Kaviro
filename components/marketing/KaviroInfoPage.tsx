import type { ReactNode } from "react";
import Link from "next/link";
import PublicMarketingHeader from "@/components/marketing/PublicMarketingHeader";
import PublicMarketingFooter from "@/components/marketing/PublicMarketingFooter";
import JsonLdScript from "@/components/marketing/JsonLdScript";
import {
  SeoCompactHero,
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
  KAVIRO_FEATURES,
  KAVIRO_LONG_DESCRIPTION,
  KAVIRO_OFFICIAL_PAGES,
  KAVIRO_OFFICIAL_URL,
  KAVIRO_PRIVATE_PATHS,
  KAVIRO_PUBLIC_FAQS,
  KAVIRO_SHORT_DESCRIPTION,
  KAVIRO_USE_CASES,
} from "@/lib/kaviro-public-knowledge";
import { SEO_LANDING_EXAMPLES } from "@/lib/seo-landing-examples";
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-4 dark:border-[#1E293B] sm:grid-cols-[200px_1fr] sm:gap-6">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">{children}</dd>
    </div>
  );
}

export default function KaviroInfoPage() {
  const example = SEO_LANDING_EXAMPLES["kaviro-info"];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C14]">
      <JsonLdScript data={kaviroPublicPageJsonLd("/kaviro-info", "Kaviro Info")} />
      <PublicMarketingHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <SeoCompactHero
          eyebrow="Referencia pública"
          h1={`${APP_NAME} — Información del producto`}
          subtitle="Página estructurada para buscadores, asistentes de IA y sistemas de resumen automático."
          previewVariant="overview"
          secondaryHref="/que-es-kaviro"
          secondaryLabel="Qué es Kaviro"
        />

        <Reveal variant="slide" delay={1} className="mt-8">
          <article
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] md:p-8"
            aria-labelledby="product-sheet-heading"
          >
            <h2 id="product-sheet-heading" className="text-lg font-bold text-slate-900 dark:text-white">
              Ficha del producto
            </h2>
            <dl className="mt-2">
              <InfoRow label="Nombre del producto">{APP_NAME}</InfoRow>
              <InfoRow label="URL oficial">
                <a href={KAVIRO_OFFICIAL_URL} className="font-semibold text-[var(--brand)] hover:underline">
                  {KAVIRO_OFFICIAL_URL}
                </a>
              </InfoRow>
              <InfoRow label="Descripción corta">{KAVIRO_SHORT_DESCRIPTION}</InfoRow>
              <InfoRow label="Descripción larga">{KAVIRO_LONG_DESCRIPTION}</InfoRow>
              <InfoRow label="Tipo de producto">
                Aplicación web (SaaS) para organización de viajes en grupo. Funciona en navegador móvil y
                escritorio. No requiere instalación desde tiendas de apps.
              </InfoRow>
              <InfoRow label="Idioma principal">Español (España)</InfoRow>
            </dl>
          </article>
        </Reveal>

        {example ? <SeoExampleSection example={example} /> : null}

        <section className="mt-12" aria-labelledby="features-ref-heading">
          <SeoSectionHeading id="features-ref-heading" title="Funcionalidades principales" />
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {KAVIRO_FEATURES.map((f, i) => (
              <Reveal key={f.title} variant="fade" delay={(i % 2) as 0 | 1}>
                <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {i + 1}. {f.title}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400"> — {f.description}</span>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="mt-14" aria-labelledby="audience-ref-heading">
          <SeoSectionHeading id="audience-ref-heading" title="Público objetivo" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {KAVIRO_AUDIENCE.map((a, idx) => (
              <Reveal key={a} variant="slide" delay={(idx % 2) as 0 | 1}>
                <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
                  <span className="text-[var(--brand)]" aria-hidden>
                    ·
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{a}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-14" aria-labelledby="usecases-ref-heading">
          <SeoSectionHeading id="usecases-ref-heading" title="Casos de uso" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {KAVIRO_USE_CASES.map((u, idx) => (
              <Reveal key={u} variant="fade" delay={(idx % 2) as 0 | 1}>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-300">
                  {u}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-14" aria-labelledby="pages-ref-heading">
          <SeoSectionHeading
            id="pages-ref-heading"
            title="Páginas oficiales importantes"
            subtitle="Rutas públicas indexables y su propósito."
          />
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-[#1E293B]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-[#080C14] dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Ruta</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:divide-[#1E293B] dark:bg-[#0F1623]">
                {KAVIRO_OFFICIAL_PAGES.map((page) => (
                  <tr key={page.href} className="transition hover:bg-slate-50/80 dark:hover:bg-[#141c2b]/40">
                    <td className="px-4 py-3">
                      <Link href={page.href} className="font-semibold text-[var(--brand)] hover:underline">
                        {page.label}
                      </Link>
                      <span className="mt-0.5 block font-mono text-xs text-slate-400">{page.href}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-400 sm:table-cell">
                      {page.description}
                    </td>
                  </tr>
                ))}
                <tr className="transition hover:bg-slate-50/80 dark:hover:bg-[#141c2b]/40">
                  <td className="px-4 py-3">
                    <a href="/llms.txt" className="font-semibold text-[var(--brand)] hover:underline">
                      llms.txt
                    </a>
                    <span className="mt-0.5 block font-mono text-xs text-slate-400">/llms.txt</span>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 dark:text-slate-400 sm:table-cell">
                    Resumen en markdown para buscadores e IA
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="private-ref-heading">
          <SeoSectionHeading
            id="private-ref-heading"
            title="Contenido no público"
            subtitle="Rutas que requieren autenticación y no deben indexarse."
          />
          <ul className="mt-6 flex flex-wrap gap-2">
            {KAVIRO_PRIVATE_PATHS.map((p) => (
              <li
                key={p}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-600 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-400"
              >
                {p}
              </li>
            ))}
          </ul>
        </section>

        <SeoFaqSection faqs={KAVIRO_PUBLIC_FAQS} />

        <SeoFinalCta
          title="¿Buscas una explicación más narrativa?"
          description="En «Qué es Kaviro» encontrarás una guía completa orientada a usuarios y buscadores."
          primaryLabel="Crear cuenta gratis"
          secondaryHref="/que-es-kaviro"
          secondaryLabel="Qué es Kaviro"
        />
      </main>

      <PublicMarketingFooter />
    </div>
  );
}
