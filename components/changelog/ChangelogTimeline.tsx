"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import type { ChangelogRelease } from "@/components/changelog/changelog-data";

type ChangelogTimelineProps = {
  releases: ChangelogRelease[];
  tagStyles: Record<string, string>;
  tagLabels: Record<string, string>;
};

export default function ChangelogTimeline({
  releases,
  tagStyles,
  tagLabels,
}: ChangelogTimelineProps) {
  return (
    <>
      <div className="relative space-y-5 pl-4">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200 dark:bg-[#1E293B]" />

        {releases.map((release, idx) => (
          <Reveal
            key={release.version}
            variant="slide"
            delay={(idx % 4) as 0 | 1 | 2 | 3}
            className="relative flex gap-5"
          >
            <div className="mt-5 shrink-0">
              <div className="h-3.5 w-3.5 rounded-full border-2 border-[#F87171] bg-white dark:bg-[#0F1623]" />
            </div>

            <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#1E293B] dark:bg-[#0F1623]">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-400">{release.version}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tagStyles[release.tag]}`}
                >
                  {tagLabels[release.tag]}
                </span>
                <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar className="h-3 w-3" />
                  {release.date}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{release.title}</h2>
              <ul className="mt-3 space-y-2">
                {release.items.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F87171]" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal variant="scale" className="mt-6">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center dark:border-[#1E293B] dark:bg-[#080C14]">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ¿Tienes sugerencias?{" "}
            <Link href="/dashboard" className="font-semibold text-[#F87171] transition hover:text-[#EF4444]">
              Escríbenos desde el Asistente IA
            </Link>{" "}
            dentro de cualquier viaje.
          </p>
        </div>
      </Reveal>
    </>
  );
}
