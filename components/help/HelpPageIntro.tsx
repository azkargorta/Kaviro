"use client";

import Reveal from "@/components/ui/Reveal";

export default function HelpPageIntro() {
  return (
    <Reveal variant="fade" className="text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand)]">Ayuda</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        Centro de ayuda
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Respuestas sobre el plan del viaje, Premium, IA y análisis de documentos. Si no encuentras lo que
        buscas, envía feedback al final.
      </p>
    </Reveal>
  );
}
