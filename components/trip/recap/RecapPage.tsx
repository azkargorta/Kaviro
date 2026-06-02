"use client";

import { useRef, useState, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, ImagePlus, X, Loader2, MapPin } from "lucide-react";
import html2canvas from "html2canvas";
import RecapShareButton from "@/components/trip/recap/RecapShareButton";

// ── Types ─────────────────────────────────────────────────────────────────────

type Layout = "header" | "solid" | "glass";

export type RecapData = {
  tripId: string;
  tripName: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  activitiesCount: number;
  participantsCount: number;
};

// ── Date helpers ──────────────────────────────────────────────────────────────

function fmtCardDate(d: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" })
    .format(new Date(`${d}T12:00:00`))
    .toUpperCase();
}

function calcDays(start: string, end: string) {
  return (
    Math.round(
      (new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) /
        86400000
    ) + 1
  );
}

// ── Shared card sub-elements (inline styles for html2canvas) ──────────────────
// Nota: dentro de RecapCard se usa <img> nativo (crossOrigin / data URLs) para export PNG fiable.

const BRAND_IMG = "/brand/kaviro-lockup-white.png";

/** Kaviro brand pill — prominent, clearly visible */
function BrandFooter({ centered = false }: { centered?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: centered ? "center" : "flex-start",
        gap: 8,
        background: "rgba(255,255,255,0.09)",
        borderRadius: 10,
        padding: "7px 14px",
        width: "fit-content",
        ...(centered ? { margin: "0 auto" } : {}),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_IMG}
        alt="Kaviro"
        crossOrigin="anonymous"
        style={{ height: 20, opacity: 0.92 }}
      />
    </div>
  );
}

/** City list rows */
function CityRows({ cities, accentColor }: { cities: string[]; accentColor: string }) {
  if (cities.length === 0) return null;
  const visible = cities.slice(0, 5);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {visible.map((city, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: accentColor }}>📍</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.85)", letterSpacing: "0.01em" }}>
            {city}
          </span>
        </div>
      ))}
      {cities.length > 5 && (
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", paddingLeft: 16 }}>
          +{cities.length - 5} más…
        </span>
      )}
    </div>
  );
}

// ── RecapCard ─────────────────────────────────────────────────────────────────

function RecapCard({
  layout,
  photoUrl,
  cities,
  tripName,
  destination,
  startDate,
  endDate,
  activitiesCount,
  participantsCount,
}: RecapData & { layout: Layout; photoUrl: string | null; cities: string[] }) {
  const dateStr =
    startDate && endDate
      ? `${fmtCardDate(startDate)} — ${fmtCardDate(endDate)}`
      : startDate
      ? `Desde ${fmtCardDate(startDate)}`
      : "Fechas por definir";

  const days = startDate && endDate ? calcDays(startDate, endDate) : null;
  const daysLabel = days ? `${days} DÍA${days !== 1 ? "S" : ""}` : "";

  const BASE: React.CSSProperties = {
    width: 360,
    height: 640,
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  };

  const PhotoBg = () =>
    photoUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        crossOrigin="anonymous"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(145deg, #1e3a5f 0%, #0f2444 55%, #1a1f35 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 80, opacity: 0.1 }}>🗺️</span>
      </div>
    );

  // ── A: Foto cabecera ──────────────────────────────────────────────────────
  if (layout === "header") {
    const photoH = 242;
    return (
      <div style={{ ...BASE, background: "#080c14" }}>
        {/* Photo */}
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: photoH, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: photoH,
              background: "linear-gradient(145deg, #1e3a5f 0%, #0f2444 55%, #0a0f1e 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 56, opacity: 0.2 }}>✈️</span>
          </div>
        )}

        {/* Fade photo → dark */}
        <div
          style={{
            position: "absolute",
            top: photoH - 60,
            left: 0,
            right: 0,
            height: 80,
            background: "linear-gradient(to bottom, transparent, #080c14)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "absolute",
            top: photoH,
            left: 0,
            right: 0,
            bottom: 0,
            background: "#080c14",
            padding: "14px 22px 18px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Destination */}
          {destination && (
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#fb923c", margin: "0 0 4px 0" }}>
              📍 {destination}
            </p>
          )}

          {/* Trip name */}
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1.2, margin: "0 0 10px 0", letterSpacing: "-0.01em" }}>
            {tripName}
          </h1>

          {/* Dates */}
          <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 2px 0", fontWeight: 600 }}>{dateStr}</p>
          {daysLabel && (
            <p style={{ fontSize: 14, fontWeight: 800, color: "#ffffff", margin: "0 0 0 0" }}>{daysLabel}</p>
          )}

          <div style={{ flex: 1, minHeight: 8 }} />

          {/* Stats row */}
          <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12, marginBottom: cities.length > 0 ? 10 : 14 }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{activitiesCount}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", margin: "2px 0 0 0" }}>Actividades</p>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.07)", margin: "0 6px" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{participantsCount}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", margin: "2px 0 0 0" }}>Personas</p>
            </div>
          </div>

          {/* Cities */}
          {cities.length > 0 && (
            <div style={{ marginBottom: 12, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <CityRows cities={cities} accentColor="#fb923c" />
            </div>
          )}

          {/* Kaviro brand — prominent */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10, display: "flex", justifyContent: "center" }}>
            <BrandFooter centered />
          </div>
        </div>
      </div>
    );
  }

  // ── B: Fondo foto + tarjeta sólida ───────────────────────────────────────
  if (layout === "solid") {
    return (
      <div style={BASE}>
        <PhotoBg />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.52)" }} />

        {/* Brand top — prominent */}
        <div style={{ position: "absolute", top: 20, right: 20 }}>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.5)", borderRadius: 10, padding: "5px 12px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND_IMG} alt="Kaviro" crossOrigin="anonymous" style={{ height: 18, opacity: 0.92 }} />
          </div>
        </div>

        {/* Data card */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 22,
            right: 22,
            background: "rgba(6, 10, 20, 0.93)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderLeft: "3px solid #f87171",
            borderRadius: 20,
            padding: "18px 20px 16px",
          }}
        >
          {destination && (
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#fb923c", margin: "0 0 4px 0" }}>
              📍 {destination}
            </p>
          )}
          <h1 style={{ fontSize: 21, fontWeight: 800, color: "#fff", lineHeight: 1.25, margin: "0 0 7px 0", letterSpacing: "-0.01em" }}>
            {tripName}
          </h1>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 1px 0", fontWeight: 600 }}>{dateStr}</p>
          {daysLabel && (
            <p style={{ fontSize: 13, fontWeight: 800, color: "#fb923c", margin: "0 0 10px 0" }}>{daysLabel}</p>
          )}

          {/* Stats */}
          <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.07)", marginBottom: cities.length > 0 ? 8 : 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 19, fontWeight: 800, color: "#fff", margin: 0 }}>{activitiesCount}</p>
              <p style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", margin: "1px 0 0 0" }}>Actividades</p>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 19, fontWeight: 800, color: "#fff", margin: 0 }}>{participantsCount}</p>
              <p style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", margin: "1px 0 0 0" }}>Personas</p>
            </div>
          </div>

          {/* Cities */}
          {cities.length > 0 && (
            <div style={{ paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)", marginBottom: 10 }}>
              <CityRows cities={cities.slice(0, 4)} accentColor="#fb923c" />
            </div>
          )}

          {/* Brand */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 9 }}>
            <BrandFooter />
          </div>
        </div>
      </div>
    );
  }

  // ── C: Crystal / glass ───────────────────────────────────────────────────
  return (
    <div style={BASE}>
      <PhotoBg />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)" }} />

      {/* Brand top — prominent */}
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.45)", borderRadius: 10, padding: "5px 12px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND_IMG} alt="Kaviro" crossOrigin="anonymous" style={{ height: 18, opacity: 0.95 }} />
        </div>
      </div>

      {/* Glass bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(4, 8, 18, 0.60)",
          borderTop: "1px solid rgba(255,255,255,0.16)",
          padding: "20px 22px 24px",
        }}
      >
        {destination && (
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#fbbf24", margin: "0 0 5px 0" }}>
            📍 {destination}
          </p>
        )}
        <h1 style={{ fontSize: 23, fontWeight: 800, color: "#fff", lineHeight: 1.2, margin: "0 0 7px 0", textShadow: "0 1px 10px rgba(0,0,0,0.6)" }}>
          {tripName}
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", margin: "0 0 1px 0", fontWeight: 500 }}>{dateStr}</p>
        {daysLabel && (
          <p style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24", margin: "0 0 12px 0" }}>{daysLabel}</p>
        )}

        {/* Stats */}
        <div style={{ display: "flex", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.12)", marginBottom: cities.length > 0 ? 8 : 12 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>{activitiesCount}</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "2px 0 0 0" }}>Actividades</p>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.14)", margin: "0 6px" }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>{participantsCount}</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "2px 0 0 0" }}>Personas</p>
          </div>
        </div>

        {/* Cities */}
        {cities.length > 0 && (
          <div style={{ paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)", marginBottom: 10 }}>
            <CityRows cities={cities.slice(0, 4)} accentColor="#fbbf24" />
          </div>
        )}

        {/* Brand */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 10 }}>
          <BrandFooter />
        </div>
      </div>
    </div>
  );
}

// ── Layout options ────────────────────────────────────────────────────────────

const LAYOUTS: { key: Layout; label: string; desc: string; icon: string }[] = [
  { key: "header", label: "Foto cabecera", desc: "Datos en primer plano, foto arriba", icon: "🖼️" },
  { key: "solid",  label: "Fondo foto",    desc: "Tarjeta sólida sobre tu foto",       icon: "🌅" },
  { key: "glass",  label: "Crystal",       desc: "Datos translúcidos sobre la foto",   icon: "💎" },
];

// ── Main RecapPage ────────────────────────────────────────────────────────────

export default function RecapPage(props: RecapData) {
  const { tripId, tripName } = props;
  const [layout, setLayout] = useState<Layout>("header");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [citiesInput, setCitiesInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputId = useId();

  const cities = citiesInput
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleDownload() {
    if (!cardRef.current || generating) return;
    setGenerating(true);
    setDone(false);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 8000,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `recap-${tripName.replace(/\s+/g, "-").toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error("Error generando recap:", err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-[#080c14]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-safe-inline py-3 pt-safe-min backdrop-blur-sm dark:border-slate-800 dark:bg-[#0f1623]/90">
        <Link
          href={`/trip/${tripId}/summary`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Volver al resumen"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-slate-900 dark:text-slate-50">Crear Recap</h1>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{tripName}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/icon.png"
          alt="Kaviro"
          width={24}
          height={24}
          className="ml-auto h-6 w-6 shrink-0 rounded-full opacity-90"
        />
      </div>

      {/* ── Main grid ── */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col items-start gap-10 lg:flex-row">

          {/* Card preview */}
          <div className="w-full shrink-0 lg:w-auto">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Vista previa · Formato Instagram Stories
            </p>
            <div
              className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/5"
              style={{ width: 360, height: 640 }}
            >
              <div ref={cardRef} style={{ width: 360, height: 640 }}>
                <RecapCard layout={layout} photoUrl={photoUrl} cities={cities} {...props} />
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-600">
              1080 × 1920 px al descargar (9:16)
            </p>
          </div>

          {/* Controls */}
          <div className="w-full flex-1 space-y-7 lg:pt-8">

            {/* Layout selector */}
            <div>
              <h2 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">Elige el estilo</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => setLayout(l.key)}
                    className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition ${
                      layout === l.key
                        ? "border-[var(--brand)] bg-[var(--brand-light)] ring-1 ring-[color:var(--brand-border)]"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0f1623] dark:hover:border-slate-600"
                    }`}
                  >
                    <span className="text-2xl">{l.icon}</span>
                    <span className={`text-sm font-bold ${layout === l.key ? "text-[var(--brand-text)]" : "text-slate-800 dark:text-slate-100"}`}>
                      {l.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cities input */}
            <div>
              <h2 className="mb-1.5 text-sm font-bold text-slate-800 dark:text-slate-100">
                <MapPin className="mb-0.5 mr-1 inline h-4 w-4 text-[var(--brand)]" />
                Ciudades del viaje
              </h2>
              <p className="mb-2.5 text-xs text-slate-500 dark:text-slate-400">
                Separadas por coma. Aparecen en la tarjeta (máx. 5 visibles).
              </p>
              <input
                type="text"
                value={citiesInput}
                onChange={(e) => setCitiesInput(e.target.value)}
                placeholder="Barcelona, Madrid, Bilbao, San Sebastián…"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[color:var(--brand-border)] dark:border-slate-700 dark:bg-[#0f1623] dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              {cities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cities.map((city, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-[#0f1623] dark:text-slate-300"
                    >
                      📍 {city}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Photo upload */}
            <div>
              <h2 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">Foto del viaje</h2>
              {photoUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="Foto seleccionada" className="h-36 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                    aria-label="Eliminar foto"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <label
                    htmlFor={fileInputId}
                    className="absolute bottom-2 right-2 cursor-pointer rounded-xl border border-white/30 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-black/70"
                  >
                    Cambiar foto
                  </label>
                </div>
              ) : (
                <label
                  htmlFor={fileInputId}
                  className="flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0f1623] dark:hover:border-slate-600"
                >
                  <ImagePlus className="h-8 w-8 opacity-50" />
                  <span className="text-sm font-semibold">Añadir foto</span>
                  <span className="text-xs">JPG, PNG o WEBP desde tu dispositivo</span>
                </label>
              )}
              <input
                id={fileInputId}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              {layout !== "header" && !photoUrl && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  💡 Este estilo luce mejor con una foto de fondo.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Compartir enlace</h2>
              <RecapShareButton tripId={tripId} />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cualquiera con el enlace verá las estadísticas del viaje (actividades, gastos, participantes).
              </p>
            </div>

            {/* Download */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Descargar</h2>
              <button
                type="button"
                onClick={handleDownload}
                disabled={generating}
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#f87171] via-[#ef4444] to-[#dc2626] px-6 text-sm font-bold text-white shadow-md transition hover:from-[#ef4444] hover:to-[#b91c1c] disabled:opacity-70"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generando imagen…</>
                ) : done ? (
                  <><span>✓</span> ¡Descargada! Lista para Instagram</>
                ) : (
                  <><Download className="h-4 w-4" /> Descargar para Stories</>
                )}
              </button>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-[#0f1623] dark:text-slate-400">
                <p className="mb-2 font-semibold text-slate-800 dark:text-slate-200">¿Cómo compartirla?</p>
                <ul className="space-y-1.5">
                  <li>📱 <strong>Instagram Stories:</strong> guarda y súbela desde la app como historia</li>
                  <li>💬 <strong>WhatsApp:</strong> envía la imagen desde la galería</li>
                  <li>📸 Formato 9:16 optimizado para pantalla completa</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
