import type { ReactNode } from "react";
import type { SeoPreviewVariant } from "@/lib/seo-landing-examples";
import { APP_NAME } from "@/lib/brand";

type Props = {
  variant: SeoPreviewVariant;
  compact?: boolean;
};

function WindowChrome({
  children,
  title,
  compact = false,
}: {
  children: ReactNode;
  title: string;
  compact?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 dark:border-[#1E293B] dark:bg-[#0F1623] dark:shadow-none">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 dark:border-[#1E293B] dark:bg-[#080C14]">
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden />
        <span className="ml-1 truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">{title}</span>
      </div>
      <div className={compact ? "p-3" : "p-4"}>{children}</div>
    </div>
  );
}

function TripPreview() {
  const trips = [
    { name: "Croacia · 17 días", status: "En curso", accent: true },
    { name: "Lisboa city break", status: "Próximo", accent: false },
    { name: "Piso compartido", status: "Gastos", accent: false },
  ];
  return (
    <WindowChrome title={`${APP_NAME} — Mis viajes`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Continuar viaje</p>
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-[#334155] dark:bg-[#141c2b]">
        <p className="text-xs font-bold text-slate-900 dark:text-white">Croacia · 17 días</p>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-[#1E293B]">
          <div className="h-full w-[42%] rounded-full bg-[var(--brand)]" />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {trips.map((t) => (
          <div
            key={t.name}
            className="flex items-center justify-between rounded-lg border border-slate-100 px-2.5 py-2 dark:border-[#1E293B]"
          >
            <span className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-200">{t.name}</span>
            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${
                t.accent
                  ? "bg-[var(--brand)] text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-[#1E293B] dark:text-slate-400"
              }`}
            >
              {t.status}
            </span>
          </div>
        ))}
      </div>
    </WindowChrome>
  );
}

function ExpensesPreview() {
  const rows = [
    { label: "Apartamento", amount: "420 €", who: "Ana pagó" },
    { label: "Cena grupo", amount: "86 €", who: "Luis pagó" },
    { label: "Gasolina", amount: "54 €", who: "Tú pagaste" },
  ];
  return (
    <WindowChrome title="Gastos — Croacia">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-[#141c2b]">
          <p className="text-[9px] text-slate-500">Ana</p>
          <p className="text-xs font-bold text-emerald-600">+124 €</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-[#141c2b]">
          <p className="text-[9px] text-slate-500">Luis</p>
          <p className="text-xs font-bold text-rose-600">−68 €</p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2 py-1.5 dark:border-[#1E293B]"
          >
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-200">{r.label}</p>
              <p className="text-[9px] text-slate-500">{r.who}</p>
            </div>
            <span className="shrink-0 text-[11px] font-bold text-slate-700 dark:text-slate-300">{r.amount}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 rounded-lg border border-dashed border-[var(--brand-border)] bg-[var(--brand-light)]/50 px-2 py-1.5 text-[10px] font-medium text-[var(--brand-text)] dark:bg-[var(--brand-light)]/10">
        Luis → Ana · 68 € sugerido
      </p>
    </WindowChrome>
  );
}

function ItineraryPreview() {
  const items = [
    { time: "09:00", title: "Ferry Split → Hvar" },
    { time: "12:30", title: "Paseo por el puerto" },
    { time: "19:00", title: "Cena en Stari Grad" },
  ];
  return (
    <WindowChrome title="Plan — Hoy">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Jueves 11 jun</p>
      <div className="mt-2 rounded-lg border-l-2 border-[var(--brand)] bg-slate-50 p-2 dark:bg-[#141c2b]">
        <p className="text-[9px] font-semibold uppercase text-[var(--brand)]">Ahora mismo</p>
        <p className="text-xs font-bold text-slate-900 dark:text-white">Ferry Split → Hvar</p>
      </div>
      <div className="mt-3 space-y-1.5">
        {items.map((item) => (
          <div key={item.title} className="flex gap-2 rounded-lg border border-slate-100 px-2 py-1.5 dark:border-[#1E293B]">
            <span className="w-9 shrink-0 text-[10px] font-semibold text-slate-500">{item.time}</span>
            <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">{item.title}</span>
          </div>
        ))}
      </div>
    </WindowChrome>
  );
}

function AiPreview() {
  return (
    <WindowChrome title="Planificador IA">
      <div className="rounded-lg bg-slate-50 p-2 text-[10px] text-slate-600 dark:bg-[#141c2b] dark:text-slate-400">
        <span className="font-semibold text-slate-800 dark:text-slate-200">Tú:</span> 7 días en Lisboa, cultura y
        gastronomía
      </div>
      <div className="mt-2 rounded-lg border border-[var(--brand-border)] bg-white p-2 dark:bg-[#0F1623]">
        <p className="text-[9px] font-semibold text-[var(--brand)]">Asistente {APP_NAME}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-slate-700 dark:text-slate-300">
          Día 1–2: Alfama y Belém · Día 3: Sintra · Día 4: Time Out Market…
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {["Día 1", "Día 2", "Día 3"].map((d) => (
          <span
            key={d}
            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-[#1E293B] dark:text-slate-400"
          >
            {d}
          </span>
        ))}
        <span className="rounded-md bg-[var(--brand)] px-1.5 py-0.5 text-[9px] font-semibold text-white">
          Guardar plan
        </span>
      </div>
    </WindowChrome>
  );
}

function OverviewPreview() {
  const tabs = ["Resumen", "Plan", "Gastos", "Mapa"];
  return (
    <WindowChrome title={`${APP_NAME} — Viaje`}>
      <p className="text-xs font-bold text-slate-900 dark:text-white">Escapada Portugal</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {tabs.map((t, i) => (
          <span
            key={t}
            className={`rounded-md px-2 py-0.5 text-[9px] font-semibold ${
              i === 0
                ? "bg-[var(--brand)] text-white"
                : "bg-slate-100 text-slate-600 dark:bg-[#1E293B] dark:text-slate-400"
            }`}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {[
          { label: "Participantes", val: "4" },
          { label: "Actividades", val: "18" },
          { label: "Gastos", val: "12" },
          { label: "Documentos", val: "6" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-100 p-2 dark:border-[#1E293B]">
            <p className="text-[9px] text-slate-500">{s.label}</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{s.val}</p>
          </div>
        ))}
      </div>
    </WindowChrome>
  );
}

export default function SeoAppPreviewMockup({ variant, compact = false }: Props) {
  const inner = (() => {
    switch (variant) {
      case "expenses":
        return <ExpensesPreview />;
      case "itinerary":
        return <ItineraryPreview />;
      case "ai":
        return <AiPreview />;
      case "overview":
        return <OverviewPreview />;
      default:
        return <TripPreview />;
    }
  })();

  return (
    <div className={compact ? "w-full max-w-sm mx-auto md:max-w-none" : "w-full"} aria-hidden>
      {inner}
    </div>
  );
}
