"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, Compass, Download, Share2, ImagePlus, X } from "lucide-react";

const KIND_LABELS: Record<string, string> = {
  culture: "Cultura 🏛️",
  nature: "Naturaleza 🌿",
  viewpoint: "Miradores 🌄",
  neighborhood: "Barrios 🧭",
  market: "Mercados 🧺",
  excursion: "Excursiones 🚌",
  gastro_experience: "Gastronomía 🍷",
  shopping: "Compras 🛍️",
  night: "Vida nocturna 🌙",
  transport: "Traslados ✈️",
  visit: "Visitas 📍",
  restaurant: "Restaurantes 🍽️",
  museum: "Museos 🏛️",
  activity: "Actividades 🎟️",
  lodging: "Alojamiento 🏨",
  gastronomy: "Gastronomía 🍽️",
  beach: "Playa 🏖️",
  sport: "Deporte 🏃",
  wellness: "Bienestar 🧘",
  entertainment: "Entretenimiento 🎭",
  // Catch-all for single-letter or unknown kinds
  g: "General 📌",
  a: "Actividad 🎟️",
  c: "Cultura 🏛️",
  n: "Naturaleza 🌿",
  r: "Restaurante 🍽️",
  t: "Transporte ✈️",
};

const BG_COLORS = [
  "bg-[#F87171]", "bg-emerald-500", "bg-amber-500",
  "bg-pink-500", "bg-sky-500", "bg-orange-500",
];

function formatDate(d: string | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(`${d}T12:00:00`));
}

type Props = {
  tripId: string;
  tripName: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  totalDays: number;
  activitiesCount: number;
  totalExpenses: number;
  currency: string;
  participantsCount: number;
  cities: string[];
  kindCounts: Record<string, number>;
  kmTravelled: number;
};

export default function TripRecapClient({
  tripId, tripName, destination, startDate, endDate,
  totalDays, activitiesCount, participantsCount,
  cities, kindCounts, kmTravelled,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const topKinds = Object.entries(kindCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const totalActivities = Object.values(kindCounts).reduce((a, b) => a + b, 0);

  const [downloading, setDownloading] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // ── Cover image — user upload or Unsplash tourism photo ──────────────────
  async function loadUnsplash() {
    if (!destination) return;
    const query = encodeURIComponent(destination.split("·")[0].trim());
    try {
      const res = await fetch(
        `https://source.unsplash.com/800x400/?${query},travel,tourism`,
        { redirect: "follow" }
      );
      if (res.ok) setCoverImage(res.url);
    } catch { /* silent */ }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCoverImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── Download via server SVG API ───────────────────────────────────────────
  async function downloadAsImage(format: "square" | "stories" = "square") {
    setDownloading(true);
    try {
      const params = new URLSearchParams({
        tripName,
        destination: destination || "",
        startDate: startDate || "",
        endDate: endDate || "",
        days: String(totalDays),
        activities: String(activitiesCount),
        km: String(Math.round(kmTravelled)),
        participants: String(participantsCount),
        expenses: "",
        format,
      });
      const url = `/api/trip-recap-image?${params.toString()}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = `kaviro-${tripName.toLowerCase().replace(/\s+/g, "-")}-${format}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch { /* silent */ }
    finally { setDownloading(false); }
  }

  // ── Share text ────────────────────────────────────────────────────────────
  const shareMessage = [
    `✈️ ${tripName}${destination ? ` — ${destination}` : ""}`,
    startDate ? `📅 ${formatDate(startDate)}${endDate ? ` → ${formatDate(endDate)}` : ""}` : "",
    cities?.length ? `📍 ${cities.slice(0, 3).join(" · ")}` : "",
    `${totalDays} días · ${activitiesCount} actividades · ${participantsCount} persona${participantsCount !== 1 ? "s" : ""}`,
    "",
    "Organizado con Kaviro · kaviro.app",
  ].filter(Boolean).join("\n");

  function shareText() {
    const text = shareMessage;
    if (navigator.share) {
      void navigator.share({ title: `Recap: ${tripName}`, text });
    } else {
      void navigator.clipboard.writeText(text);
      alert("¡Copiado al portapapeles!");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start py-8 px-4 gap-6">
      {/* Back + Help */}
      <div className="w-full max-w-sm flex items-center justify-between">
        <Link href={`/trip/${tripId}`} className="text-slate-500 text-xs font-semibold hover:text-slate-300">
          ← Volver al viaje
        </Link>
        <Link href="/help/recap" className="text-slate-500 text-xs font-semibold hover:text-slate-300 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6"/><path d="M8 11v-1M8 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>
          Ayuda
        </Link>
      </div>

      {/* Main card */}
      <div ref={cardRef} className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">

        {/* ── Cover image ── */}
        <div className="relative w-full h-44 bg-slate-800 group">
          {coverImage ? (
            <>
              <Image src={coverImage} alt="Portada" fill className="object-cover" unoptimized sizes="400px" />
              <button
                type="button"
                onClick={() => setCoverImage(null)}
                className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-slate-500 text-xs font-semibold">Añade una foto del viaje</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-600 transition"
                >
                  <ImagePlus className="w-3.5 h-3.5" /> Subir foto
                </button>
                {destination && (
                  <button
                    type="button"
                    onClick={() => void loadUnsplash()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-600 transition"
                  >
                    🌍 Foto del destino
                  </button>
                )}
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* ── Header gradient ── */}
        <div className="bg-gradient-to-br from-[#F87171] via-[#ef4444] to-[#0f172a] px-6 pt-6 pb-5 text-white">
          {/* Kaviro branding — real logo */}
          <div className="flex items-center gap-2.5 mb-4">
            <Image src="/brand/icon.png" alt="Kaviro" width={32} height={32} className="rounded-full" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.15em", fontFamily: "sans-serif" }}>KAVIRO</span>
            <span className="ml-auto text-white/40 text-[10px] font-semibold uppercase tracking-widest">✈ Viaje completado</span>
          </div>

          <h1 className="text-2xl font-extrabold leading-tight">{tripName}</h1>
          {destination && (
            <p className="text-white/70 mt-1 text-sm font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />{destination}
            </p>
          )}
          {startDate && endDate && (
            <p className="text-white/50 mt-1 text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="w-3 h-3 shrink-0" />{formatDate(startDate)} → {formatDate(endDate)}
            </p>
          )}
        </div>

        {/* ── Stats grid — sin coste ── */}
        <div className="bg-white dark:bg-[#0F1623] grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-[#1E293B]">
          <div className="p-4 text-center">
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalDays}</p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">días de viaje</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{activitiesCount}</p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">actividades</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{participantsCount}</p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">viajeros</p>
          </div>
          <div className="p-4 text-center">
            {kmTravelled > 0 ? (
              <>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {kmTravelled > 999 ? `${(kmTravelled / 1000).toFixed(1)}k` : Math.round(kmTravelled)}
                </p>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">km aprox.</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {cities.length || "—"}
                </p>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">destinos</p>
              </>
            )}
          </div>
        </div>

        {/* ── Activity breakdown — categorías en español ── */}
        {topKinds.length > 0 && (
          <div className="bg-white dark:bg-[#0F1623] border-t border-slate-100 dark:border-[#1E293B] px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Lo que más hicisteis</p>
            <div className="space-y-2">
              {topKinds.map(([kind, count], i) => (
                <div key={kind} className="flex items-center gap-2">
                  <div
                    className={`h-2 rounded-full ${BG_COLORS[i % BG_COLORS.length]}`}
                    style={{ width: `${Math.round((count / totalActivities) * 100)}%`, minWidth: 8, maxWidth: "70%" }}
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {KIND_LABELS[kind] ?? (kind.length <= 2 ? "Otros 📌" : kind)}
                  </span>
                  <span className="ml-auto text-xs font-bold text-slate-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Cities ── */}
        {cities.length > 0 && (
          <div className="bg-slate-50 dark:bg-[#080C14] border-t border-slate-100 dark:border-[#1E293B] px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Destinos visitados</p>
            <div className="flex flex-wrap gap-1.5">
              {cities.map((c) => (
                <span key={c} className="rounded-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer Kaviro ── */}
        <div className="bg-slate-900 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/brand/icon.png" alt="Kaviro" width={20} height={20} className="rounded-full" />
            <p className="text-slate-400 text-xs font-semibold">
              Organizado con <span className="text-[#F87171] font-bold">Kaviro</span>
            </p>
          </div>
          <p className="text-slate-600 text-[10px]">kaviro.app</p>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 w-full max-w-sm flex-wrap">
        <button
          type="button"
          onClick={async () => {
            try {
              // Build SVG image as blob
              const params = new URLSearchParams({
                tripName, destination: destination || "",
                startDate: startDate || "", endDate: endDate || "",
                days: String(totalDays), activities: String(activitiesCount),
                km: String(Math.round(kmTravelled)), participants: String(participantsCount),
                expenses: "", format: "square",
              });
              const res = await fetch(`/api/trip-recap-image?${params.toString()}`);
              const blob = await res.blob();
              const file = new File([blob], `kaviro-${tripName.toLowerCase().replace(/\s+/g, "-")}.svg`, { type: "image/svg+xml" });

              // Try native share with file (iOS/Android) — includes image in WhatsApp
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  files: [file],
                  title: `Viaje ${tripName}`,
                  text: shareMessage,
                });
              } else if (navigator.share) {
                // Desktop fallback — share text only
                await navigator.share({ title: `Viaje ${tripName}`, text: shareMessage });
              } else {
                // Web fallback — open WhatsApp with text
                window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
              }
            } catch {
              // User cancelled or error — fallback
              window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
            }
          }}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white hover:bg-[#20b858] transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>
          WhatsApp
        </button>
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
          onClick={() => void downloadAsImage("square")}
          disabled={downloading}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 transition disabled:opacity-50"
          title="Descargar imagen cuadrada — WhatsApp, fotos"
        >
          <Download className="w-4 h-4" />
          {downloading ? "..." : "PNG"}
        </button>
        <button
          type="button"
          onClick={() => void downloadAsImage("stories")}
          disabled={downloading}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 transition disabled:opacity-50"
          title="Descargar imagen vertical — Instagram Stories"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="7" y="2" width="10" height="20" rx="2"/></svg>
          {downloading ? "..." : "Stories"}
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
