"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Faq = { q: string; a: string };

export default function SeoFaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-slate-100 dark:divide-[#1E293B]">
      {faqs.map((faq, idx) => {
        const open = openIndex === idx;
        return (
          <div key={faq.q}>
            <button
              type="button"
              className="flex w-full items-start justify-between gap-4 py-4 text-left transition hover:text-slate-900 dark:hover:text-white"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : idx)}
            >
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{faq.q}</span>
              <ChevronDown
                className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {open ? (
              <p className="pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.a}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
