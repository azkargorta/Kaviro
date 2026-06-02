"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { HELP_GUIDES } from "@/lib/help-center";

export default function HelpGuidesGrid() {
  return (
    <section className="mt-8">
      <Reveal variant="fade">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
          <BookOpen className="h-4 w-4" />
          Guías
        </h2>
      </Reveal>
      <div className="grid gap-3 sm:grid-cols-3">
        {HELP_GUIDES.map((g, idx) => (
          <Reveal key={g.href} variant="slide" delay={(idx % 3) as 0 | 1 | 2}>
            <Link
              href={g.href}
              className="group block h-full rounded-2xl border border-[var(--border-default)] bg-white p-4 transition hover:border-[var(--brand-border)] hover:shadow-md dark:bg-[#0F1623]"
            >
              <p className="text-sm font-bold text-slate-900 group-hover:text-[var(--brand)] dark:text-white">
                {g.label}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{g.desc}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
                Abrir <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
