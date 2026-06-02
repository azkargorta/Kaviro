import type { Metadata } from "next";
import BackButton from "@/components/ui/BackButton";
import PublicMarketingHeader from "@/components/marketing/PublicMarketingHeader";
import PublicMarketingFooter from "@/components/marketing/PublicMarketingFooter";
import HelpFaqList from "@/components/help/HelpFaqList";
import HelpGuidesGrid from "@/components/help/HelpGuidesGrid";
import HelpPageIntro from "@/components/help/HelpPageIntro";
import HelpFeedbackSection from "@/components/help/HelpFeedbackSection";
import { HELP_SECTIONS } from "@/lib/help-center";

export const metadata: Metadata = {
  title: "Centro de ayuda · Kaviro",
  description: "Preguntas frecuentes sobre viajes, asistente IA, análisis de documentos, gastos y mapa. Envía feedback a soporte.",
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C14]">
      <PublicMarketingHeader />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <div className="mb-4"><BackButton /></div>
        <HelpPageIntro />

        <nav
          className="mt-8 flex flex-wrap justify-center gap-2"
          aria-label="Secciones de ayuda"
        >
          {HELP_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-[var(--border-default)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[var(--brand-border)] hover:text-[var(--brand)] dark:bg-[#0F1623] dark:text-slate-300"
            >
              {s.icon} {s.title}
            </a>
          ))}
        </nav>

        <HelpGuidesGrid />

        <section className="mt-10">
          <HelpFaqList sections={HELP_SECTIONS} />
        </section>

        <HelpFeedbackSection />
      </main>

      <PublicMarketingFooter />
    </div>
  );
}
