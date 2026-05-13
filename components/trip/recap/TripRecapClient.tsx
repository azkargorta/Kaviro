"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, Users, Wallet, Compass, Download, Share2 } from "lucide-react";

const KIND_LABELS: Record<string, string> = {
  culture: "Cultura 🏛️", nature: "Naturaleza 🌿", viewpoint: "Miradores 🌄",
  neighborhood: "Barrios 🧭", market: "Mercados 🧺", excursion: "Excursiones 🚌",
  gastro_experience: "Gastronomía 🍷", shopping: "Compras 🛍️", night: "Vida nocturna 🌙",
  transport: "Traslados ✈️", visit: "Visitas 📍",
};

const BG_COLORS = ["bg-[#F87171]", "bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-sky-500", "bg-orange-500", "bg-indigo-500"];

function formatMoney(n: number, currency: string) {
  try { return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 0 }).format(n); }
  catch { return `${Math.round(n)} ${currency}`; }
}

function formatDate(d: string | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${d}T12:00:00`));
}

type Props = {
  tripId: string; tripName: string; destination: string | null;
  startDate: string | null; endDate: string | null; totalDays: number;
  activitiesCount: number; totalExpenses: number; currency: string;
  participantsCount: number; cities: string[]; kindCounts: Record<string, number>; kmTravelled: number;
};

export default function TripRecapClient({ tripId, tripName, destination, startDate, endDate, totalDays, activitiesCount, totalExpenses, currency, participantsCount, cities, kindCounts, kmTravelled }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const topKinds = Object.entries(kindCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalActivities = Object.values(kindCounts).reduce((a, b) => a + b, 0);

  const [downloading, setDownloading] = useState(false);

  async function downloadAsImage() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Dynamic import to avoid SSR issues
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // Retina quality
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `kaviro-${tripName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // Fallback: share text if html2canvas fails
      shareText();
    } finally {
      setDownloading(false);
    }
  }

  const shareMessage = [
    `✈️ ${tripName}${destination ? ` — ${destination}` : ""}`,
    startDate ? `📅 ${formatDate(startDate)}${endDate ? ` → ${formatDate(endDate)}` : ""}` : "",
    cities?.length ? `📍 ${cities.slice(0, 3).join(" · ")}` : "",
    `${totalDays} días · ${activitiesCount} actividades · ${participantsCount} persona${participantsCount !== 1 ? "s" : ""}`,
    "",
    "Organizado con Kaviro · kaviro.app",
  ].filter(Boolean).join("\n");

  function shareText() {
    const text = `🌍 Viaje "${tripName}" — ${totalDays} días en ${destination || "varios destinos"}\n✅ ${activitiesCount} actividades · ${kmTravelled > 0 ? `${kmTravelled} km · ` : ""}${formatMoney(totalExpenses, currency)}\nOrganizado con Kaviro`;
    if (navigator.share) {
      void navigator.share({ title: `Recap: ${tripName}`, text });
    } else {
      void navigator.clipboard.writeText(text);
      alert("¡Copiado al portapapeles!");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start py-8 px-4 gap-6">
      {/* Back */}
      <div className="w-full max-w-sm">
        <Link href={`/trip/${tripId}`} className="text-slate-500 text-xs font-semibold hover:text-slate-300">← Volver al viaje</Link>
      </div>

      {/* Main card */}
      <div ref={cardRef} className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 px-6 pt-8 pb-6 text-white">
          <p className="text-violet-200 text-xs font-bold uppercase tracking-widest mb-2">✈️ Viaje completado</p>
          <h1 className="text-2xl font-extrabold leading-tight">{tripName}</h1>
          {destination && (
            <p className="text-violet-200 mt-1 text-sm font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />{destination}
            </p>
          )}
          {startDate && endDate && (
            <p className="text-violet-300 mt-1 text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="w-3 h-3 shrink-0" />{formatDate(startDate)} → {formatDate(endDate)}
            </p>
          )}
        </div>

        {/* Stats grid */}
        <div className="bg-white dark:bg-[#0F1623] grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-[#1E293B]">
          <div className="p-4 text-center">
            <p className="text-3xl font-extrabold text-slate-900">{totalDays}</p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">días de viaje</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-3xl font-extrabold text-slate-900">{activitiesCount}</p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">actividades</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-900">{totalExpenses > 0 ? formatMoney(totalExpenses, currency) : "—"}</p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">gasto total</p>
          </div>
          <div className="p-4 text-center">
            {kmTravelled > 0 ? (
              <>
                <p className="text-3xl font-extrabold text-slate-900">{kmTravelled > 999 ? `${(kmTravelled / 1000).toFixed(1)}k` : kmTravelled}</p>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">km aprox.</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-extrabold text-slate-900">{participantsCount}</p>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">viajeros</p>
              </>
            )}
          </div>
        </div>

        {/* Activity breakdown */}
        {topKinds.length > 0 && (
          <div className="bg-white dark:bg-[#0F1623] border-t border-slate-100 dark:border-[#1E293B] px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Lo que más hicisteis</p>
            <div className="space-y-2">
              {topKinds.map(([kind, count], i) => (
                <div key={kind} className="flex items-center gap-2">
                  <div className={`h-2 rounded-full ${BG_COLORS[i % BG_COLORS.length]}`} style={{ width: `${Math.round((count / totalActivities) * 100)}%`, minWidth: 8, maxWidth: "70%" }} />
                  <span className="text-xs font-semibold text-slate-700 truncate">{KIND_LABELS[kind] ?? kind}</span>
                  <span className="ml-auto text-xs font-bold text-slate-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cities */}
        {cities.length > 0 && (
          <div className="bg-slate-50 dark:bg-[#080C14] border-t border-slate-100 dark:border-[#1E293B] px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Destinos visitados</p>
            <div className="flex flex-wrap gap-1.5">
              {cities.map((c) => (
                <span key={c} className="rounded-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-900 px-5 py-3 flex items-center justify-between">
          <p className="text-slate-500 text-xs font-semibold">Organizado con <span className="text-violet-400 font-bold">Kaviro</span></p>
          <Compass className="w-4 h-4 text-violet-500" />
        </div>
      </div>

      {/* Share / download actions */}
      <div className="flex gap-3 w-full max-w-sm flex-wrap">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white hover:bg-[#20b858] transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>
          WhatsApp
        </a>
        <button
          type="button"
          onClick={shareText}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 transition"
        >
          <Share2 className="w-4 h-4" />
          Compartir
        </button>
        <button
          type="button"
          onClick={downloadAsImage}
          disabled={downloading}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 transition disabled:opacity-50"
          title="Descargar como imagen"
        >
          <Download className="w-4 h-4" />
          {downloading ? "..." : "PNG"}
        </button>
        <Link
          href={`/trip/${tripId}/plan`}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-bold text-white hover:bg-[var(--brand-hover)] transition"
        >
          Ver el plan
        </Link>
      </div>

      <p className="text-slate-600 text-xs text-center max-w-xs">
        Comparte tu resumen del viaje con el grupo o guárdalo como recuerdo.
      </p>
    </div>
  );
}
