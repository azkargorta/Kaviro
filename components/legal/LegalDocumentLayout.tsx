import type { Metadata } from "next";
import Link from "next/link";
import PublicMarketingFooter from "@/components/marketing/PublicMarketingFooter";
import PublicMarketingHeader from "@/components/marketing/PublicMarketingHeader";
import { APP_NAME, LEGAL_CONTACT_EMAIL } from "@/lib/brand";

export function legalPageMetadata(title: string, description: string): Metadata {
  return {
    title: `${title} · ${APP_NAME}`,
    description,
  };
}

export default function LegalDocumentLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C14]">
      <PublicMarketingHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand)]">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: {updated}</p>
        <div className="prose prose-slate mt-8 max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-[var(--brand)]">
          {children}
        </div>
        <p className="mt-10 text-sm text-slate-600 dark:text-slate-400">
          Dudas:{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-semibold text-[var(--brand)] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
          {" · "}
          <Link href="/help" className="font-semibold text-[var(--brand)] hover:underline">
            Centro de ayuda
          </Link>
        </p>
      </main>
      <PublicMarketingFooter />
    </div>
  );
}
