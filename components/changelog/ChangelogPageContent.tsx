"use client";

import Reveal from "@/components/ui/Reveal";
import ChangelogTimeline from "@/components/changelog/ChangelogTimeline";
import {
  CHANGELOG_RELEASES,
  CHANGELOG_TAG_LABELS,
  CHANGELOG_TAG_STYLES,
} from "@/components/changelog/changelog-data";

export default function ChangelogPageContent() {
  return (
    <main className="page-shell page-shell--safe-top space-y-6 pb-16">
      <Reveal variant="fade">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-6 py-10 md:px-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Kaviro</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Novedades
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Cada semana mejoramos Kaviro. Aquí tienes lo último.
          </p>
        </div>
      </Reveal>

      <ChangelogTimeline
        releases={CHANGELOG_RELEASES}
        tagStyles={CHANGELOG_TAG_STYLES}
        tagLabels={CHANGELOG_TAG_LABELS}
      />
    </main>
  );
}
