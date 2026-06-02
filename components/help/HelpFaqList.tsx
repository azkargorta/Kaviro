"use client";

import { useState } from "react";
import type { HelpSection } from "@/lib/help-center";
import { ChevronDown } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

export default function HelpFaqList({ sections }: { sections: HelpSection[] }) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null);

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => {
        const open = openId === section.id;
        return (
          <Reveal
            key={section.id}
            variant="slide"
            delay={(idx % 4) as 0 | 1 | 2 | 3}
            id={section.id}
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : section.id)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-[var(--surface-page)]"
              aria-expanded={open}
            >
              <span className="text-2xl" aria-hidden>
                {section.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{section.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{section.description}</p>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {open ? (
              <div className="border-t border-[var(--border-default)] px-5 pb-4 pt-2 space-y-4">
                {section.items.map((item) => (
                  <div key={item.q}>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.q}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.a}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </Reveal>
        );
      })}
    </div>
  );
}
