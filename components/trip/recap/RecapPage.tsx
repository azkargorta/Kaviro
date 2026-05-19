"use client";

import { useRef, useState, useId } from "react";
import Link from "next/link";
import { ArrowLeft, Download, ImagePlus, X, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";

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

// ── RecapCard ─────────────────────────────────────────────────────────────────
// All styles are inline for html2canvas compatibility.

function RecapCard({
  layout,
  photoUrl,
  tripName,
  destination,
  startDate,
  endDate,
  activitiesCount,
  participantsCount,
}: RecapData & { layout: Layout; photoUrl: string | null }) {
  const dateStr =
    startDate && endDate
      ? `${fmtCardDate(startDate)} — ${fmtCardDate(endDate)}`
      : startDate
      ? `Desde ${fmtCardDate(startDate)}`
      : "Fechas por definir";

  const days = startDate && endDate ? calcDays(startDate, endDate) : null;
  const daysLabel = days ? `${days} DÍA${days !== 1 ? "S" : ""}` : "";

  const BRAND_IMG = "/brand/kaviro-lockup-white.png";
  const BASE: React.CSSProperties = {
    width: 360,
    height: 640,
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  };

  // Photo / placeholder background helper
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
          fontSize: 80,
          opacity: 1,
        }}
      >
        <span style={{ opacity: 0.12 }}>🗺️</span>
      </div>
    );

  // ── A: Foto como encabezado ──
  if (layout === "header") {
    return (
      <div style={{ ...BASE, background: "#080c14" }}>
        {/* Photo header */}
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 268, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: 268,
              background: "linear-gradient(145deg, #1e3a5f 0%, #0f2444 55%, #0a0f1e 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 60, opacity: 0.2 }}>✈️</span>
          </div>
        )}

        {/* Fade from photo to content */}
        <div
          style={{
            position: "absolute",
            top: 220,
            left: 0,
            right: 0,
            height: 80,
            background: "linear-gradient(to bottom, transparent, #080c14)",
          }}
        />

        {/* Content area */}
        <div
          style={{
            position: "absolute",
            top: 268,
            left: 0,
            right: 0,
            bottom: 0,
            background: "#080c14",
            padding: "16px 22px 20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Brand top-right */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND_IMG} alt="Kaviro" crossOrigin="anonymous" style={{ height: 13, opacity: 0.55 }} />
          </div>

          {/* Destination */}
          {destination && (
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#fb923c",
                margin: "0 0 5px 0",
              }}
            >
              📍 {destination}
            </p>
          )}

          {/* Trip name */}
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
              margin: "0 0 12px 0",
              letterSpacing: "-0.01em",
            }}
          >
            {tripName}
          </h1>

          {/* Dates */}
          <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 3px 0", fontWeight: 600 }}>
            {dateStr}
          </p>
          {daysLabel && (
            <p style={{ fontSize: 15, fontWeight: 800, color: "#ffffff", margin: 0 }}>{daysLabel}</p>
          )}

          <div style={{ flex: 1 }} />

          {/* Stats */}
          <div
            style={{
              display: "flex",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              paddingTop: 14,
              marginBottom: 14,
            }}
          >
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
                {activitiesCount}
              </p>
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  margin: "2px 0 0 0",
                }}
              >
                Lugares
              </p>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.07)", margin: "0 6px" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
                {participantsCount}
              </p>
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  margin: "2px 0 0 0",
                }}
              >
                Personas
              </p>
            </div>
          </div>

          {/* Brand footer */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND_IMG} alt="Kaviro" crossOrigin="anonymous" style={{ height: 14, opacity: 0.35 }} />
          </div>
        </div>
      </div>
    );
  }

  // ── B: Fondo foto + tarjeta sólida ──
  if (layout === "solid") {
    return (
      <div style={BASE}>
        <PhotoBg />
        {/* Dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.52)" }} />

        {/* Brand top-right */}
        <div style={{ position: "absolute", top: 20, right: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND_IMG} alt="Kaviro" crossOrigin="anonymous" style={{ height: 14, opacity: 0.75 }} />
        </div>

        {/* Data card */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 22,
            right: 22,
            background: "rgba(6, 10, 20, 0.92)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderLeft: "3px solid #f87171",
            borderRadius: 20,
            padding: "20px 22px 18px",
          }}
        >
          {destination && (
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#fb923c",
                margin: "0 0 5px 0",
              }}
            >
              📍 {destination}
            </p>
          )}
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.25,
              margin: "0 0 8px 0",
              letterSpacing: "-0.01em",
            }}
          >
            {tripName}
          </h1>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 2px 0", fontWeight: 600 }}>{dateStr}</p>
          {daysLabel && (
            <p style={{ fontSize: 13, fontWeight: 800, color: "#fb923c", margin: "0 0 12px 0" }}>{daysLabel}</p>
          )}
          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: 8,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.07)",
              marginBottom: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>{activitiesCount}</p>
              <p
                style={{
                  fontSize: 9,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  margin: "1px 0 0 0",
                }}
              >
                Lugares
              </p>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>{participantsCount}</p>
              <p
                style={{
                  fontSize: 9,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  margin: "1px 0 0 0",
                }}
              >
                Personas
              </p>
            </div>
          </div>
          {/* Brand */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: 9,
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND_IMG} alt="Kaviro" crossOrigin="anonymous" style={{ height: 12, opacity: 0.38 }} />
          </div>
        </div>
      </div>
    );
  }

  // ── C: Crystal / glass ──
  return (
    <div style={BASE}>
      <PhotoBg />
      {/* Light overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)" }} />

      {/* Brand top-right */}
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND_IMG} alt="Kaviro" crossOrigin="anonymous" style={{ height: 14, opacity: 0.9 }} />
      </div>

      {/* Glass bottom section */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(4, 8, 18, 0.58)",
          borderTop: "1px solid rgba(255,255,255,0.16)",
          padding: "24px 24px 28px",
        }}
      >
        {destination && (
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#fbbf24",
              margin: "0 0 6px 0",
            }}
          >
            📍 {destination}
          </p>
        )}
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.2,
            margin: "0 0 8px 0",
            textShadow: "0 1px 10px rgba(0,0,0,0.6)",
          }}
        >
          {tripName}
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", margin: "0 0 2px 0", fontWeight: 500 }}>
          {dateStr}
        </p>
        {daysLabel && (
          <p style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24", margin: "0 0 14px 0" }}>{daysLabel}</p>
        )}
        {/* Stats */}
        <div
          style={{
            display: "flex",
            paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.12)",
            marginBottom: 14,
          }}
        >
          <div style={{ flex: 1, textAlign: "center" }}>
            <p
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#fff",
                margin: 0,
                textShadow: "0 1px 6px rgba(0,0,0,0.5)",
              }}
            >
              {activitiesCount}
            </p>
            <p
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.55)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                margin: "2px 0 0 0",
              }}
            >
              Lugares
            </p>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.14)", margin: "0 6px" }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <p
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#fff",
                margin: 0,
                textShadow: "0 1px 6px rgba(0,0,0,0.5)",
              }}
            >
              {participantsCount}
            </p>
            <p
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.55)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                margin: "2px 0 0 0",
              }}
            >
              Personas
            </p>
          </div>
        </div>
        {/* Brand */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 10,
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND_IMG} alt="Kaviro" crossOrigin="anonymous" style={{ height: 13, opacity: 0.5 }} />
        </div>
      </div>
    </div>
  );
}

// ── Layout option button ──────────────────────────────────────────────────────

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
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputId = useId();

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoUrl(ev.target?.result as string);
    };
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
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-sm dark:border-slate-800 dark:bg-[#0f1623]/90">
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
        {/* Kaviro brand */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/kaviro-lockup-fullcolor.png"
          alt="Kaviro"
          className="ml-auto h-5 opacity-80"
        />
      </div>

      {/* ── Main grid ── */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col items-start gap-10 lg:flex-row">

          {/* ── Card preview ── */}
          <div className="w-full shrink-0 lg:w-auto">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Vista previa · Formato Instagram Stories
            </p>
            {/* Outer shadow + subtle border */}
            <div
              className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/5"
              style={{ width: 360, height: 640 }}
            >
              <div ref={cardRef} style={{ width: 360, height: 640 }}>
                <RecapCard layout={layout} photoUrl={photoUrl} {...props} />
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-600">
              1080 × 1920 px al descargar (9:16)
            </p>
          </div>

          {/* ── Controls ── */}
          <div className="w-full flex-1 space-y-8 lg:pt-8">

            {/* Layout selector */}
            <div>
              <h2 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">
                Elige el estilo
              </h2>
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
                    <span
                      className={`text-sm font-bold ${
                        layout === l.key
                          ? "text-[var(--brand-text)]"
                          : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {l.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <h2 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">
                Foto del viaje
              </h2>
              {photoUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="Foto seleccionada"
                    className="h-36 w-full object-cover"
                  />
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
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando imagen…
                  </>
                ) : done ? (
                  <>
                    <span>✓</span>
                    ¡Descargada! Lista para Instagram
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Descargar para Stories
                  </>
                )}
              </button>

              {/* Tips */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-2 dark:border-slate-700 dark:bg-[#0f1623] dark:text-slate-400">
                <p className="font-semibold text-slate-800 dark:text-slate-200">¿Cómo compartirla?</p>
                <ul className="space-y-1.5 list-none">
                  <li>📱 <strong>Instagram Stories:</strong> guarda la imagen y súbela desde la app como historia</li>
                  <li>💬 <strong>WhatsApp:</strong> envía la imagen directamente desde la galería</li>
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
