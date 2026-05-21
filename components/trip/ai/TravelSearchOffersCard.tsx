"use client";

import { ExternalLink, Search } from "lucide-react";
import {
  categoryLabel,
  type EnrichedTravelSearchPayload,
} from "@/lib/trip-ai/travelSearchOffers";
import { iconSlot40 } from "@/components/ui/iconTokens";

function priceBadge(note: string | null) {
  const n = (note || "").toLowerCase();
  if (n.includes("verif") || n.includes("web")) return "Precio orientativo — confirma en la web";
  if (n.includes("indic")) return "Rango indicativo";
  return "Precio estimado";
}

export default function TravelSearchOffersCard({ payload }: { payload: EnrichedTravelSearchPayload }) {
  const sp = payload.searchParams;
  const metaParts: string[] = [];
  if (payload.category !== "hotel" && sp.origin) metaParts.push(`${sp.origin} → ${sp.destination || "—"}`);
  else if (sp.destination) metaParts.push(sp.destination);
  if (sp.startDate) {
    metaParts.push(sp.endDate && sp.endDate !== sp.startDate ? `${sp.startDate} → ${sp.endDate}` : sp.startDate);
  }
  if (sp.adults) metaParts.push(`${sp.adults} viajero${sp.adults === 1 ? "" : "s"}`);

  return (
    <div className="w-full max-w-full rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-50/90 to-white p-4 shadow-sm dark:border-sky-900/50 dark:from-sky-950/30 dark:to-[#0F172A]">
      <div className="flex items-start gap-3">
        <div className={`${iconSlot40} rounded-xl bg-sky-600 text-white shadow-sm`}>
          <Search aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-sky-800 dark:text-sky-300">
            {categoryLabel(payload.category)}
          </div>
          <h3 className="mt-0.5 text-base font-bold text-slate-950 dark:text-slate-100">{payload.title}</h3>
          {payload.intro ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{payload.intro}</p> : null}
          {payload.tripLine ? (
            <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{payload.tripLine}</p>
          ) : metaParts.length ? (
            <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{metaParts.join(" · ")}</p>
          ) : null}
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {payload.options.map((opt, i) => (
          <li
            key={`${opt.name}-${i}`}
            className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{opt.name}</div>
                {opt.description ? (
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{opt.description}</p>
                ) : null}
              </div>
              {opt.priceHint ? (
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold text-sky-800 dark:text-sky-300">{opt.priceHint}</div>
                  <div className="text-[10px] font-medium text-slate-500">{priceBadge(opt.priceNote)}</div>
                </div>
              ) : null}
            </div>
            {opt.bookingUrl ? (
              <a
                href={opt.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-900 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
              >
                Ver oferta
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
          </li>
        ))}
      </ul>

      {payload.tip ? (
        <p className="mt-3 rounded-xl bg-amber-50/80 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          💡 {payload.tip}
        </p>
      ) : null}

      {payload.platforms.length ? (
        <div className="mt-4 border-t border-slate-200/80 pt-3 dark:border-slate-700">
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500">Reservar en</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Enlaces con los datos del viaje pre-rellenados en cada comparador.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {payload.platforms.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                {p.name}
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
