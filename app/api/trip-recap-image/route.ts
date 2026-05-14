import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Generate recap image as SVG → PNG via canvas API
// Returns PNG binary for direct download
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tripName     = searchParams.get("tripName") || "Mi viaje";
  const destination  = searchParams.get("destination") || "";
  const startDate    = searchParams.get("startDate") || "";
  const endDate      = searchParams.get("endDate") || "";
  const days         = searchParams.get("days") || "0";
  const activities   = searchParams.get("activities") || "0";
  const km           = searchParams.get("km") || "0";
  const participants = searchParams.get("participants") || "1";
  const expenses     = searchParams.get("expenses") || "";
  const format       = searchParams.get("format") === "stories" ? "stories" : "square";

  function fmtDate(d: string) {
    if (!d) return "";
    return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${d}T00:00:00`));
  }

  const dateRange = startDate && endDate
    ? `${fmtDate(startDate)} → ${fmtDate(endDate)}`
    : startDate ? fmtDate(startDate) : "";

  // Square: 1080×1080, Stories: 1080×1920
  const W = 1080;
  const H = format === "stories" ? 1920 : 1080;

  // SVG with embedded styling — will be rasterized
  const svg = format === "stories" ? buildStoriesSVG({
    tripName, destination, dateRange, days, activities, km, participants, expenses, W, H,
  }) : buildSquareSVG({
    tripName, destination, dateRange, days, activities, km, participants, expenses, W, H,
  });

  // Return SVG with correct headers for download
  // In production you'd rasterize to PNG with puppeteer/sharp
  // For now return SVG which browsers can save as PNG via right-click
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="kaviro-recap.svg"`,
      "Cache-Control": "no-cache",
    },
  });
}

type BuildParams = {
  tripName: string; destination: string; dateRange: string;
  days: string; activities: string; km: string;
  participants: string; expenses: string; W: number; H: number;
};

function wrap(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur.trim());
  return lines;
}

function buildSquareSVG(p: BuildParams): string {
  const nameLines = wrap(p.tripName, 22);
  const nameY = 480;
  const lineH = 80;

  const stats = [
    { val: p.days, lbl: "días" },
    { val: p.activities, lbl: "actividades" },
    { val: p.km !== "0" ? p.km : p.participants, lbl: p.km !== "0" ? "km aprox." : "personas" },
    { val: p.expenses || p.participants, lbl: p.expenses ? "gasto total" : "personas" },
  ];

  const cols = 2;
  const cellW = 440;
  const cellH = 160;
  const gridX = 80;
  const gridY = nameY + nameLines.length * lineH + 60;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${p.W}" height="${p.H}" viewBox="0 0 ${p.W} ${p.H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F87171"/>
      <stop offset="45%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.04"/>
    </linearGradient>
  </defs>

  <rect width="${p.W}" height="${p.H}" fill="url(#bg)"/>
  <circle cx="900" cy="180" r="320" fill="#F87171" fill-opacity="0.15"/>
  <circle cx="140" cy="950" r="240" fill="#F87171" fill-opacity="0.08"/>

  <!-- Logo -->
  <rect x="80" y="80" width="100" height="100" rx="24" fill="#F87171" opacity="0.95"/>
  <text x="130" y="152" font-family="Arial Black, sans-serif" font-size="64" font-weight="900" fill="white" text-anchor="middle">K</text>
  <text x="80" y="216" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="white" fill-opacity="0.5" letter-spacing="6">KAVIRO</text>

  ${p.destination ? `<text x="80" y="${nameY - 50}" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#F87171" letter-spacing="6">${p.destination.toUpperCase()}</text>` : ""}

  ${nameLines.map((line, i) => `<text x="80" y="${nameY + i * lineH}" font-family="Arial Black, sans-serif" font-size="72" font-weight="900" fill="white">${line}</text>`).join("\n  ")}

  ${p.dateRange ? `<text x="80" y="${nameY + nameLines.length * lineH + 20}" font-family="Arial, sans-serif" font-size="30" fill="white" fill-opacity="0.5">${p.dateRange}</text>` : ""}

  ${stats.map((s, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = gridX + col * (cellW + 20);
    const y = gridY + row * (cellH + 16);
    return `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="20" fill="url(#card)" stroke="white" stroke-opacity="0.12" stroke-width="1"/>
  <text x="${x + cellW/2}" y="${y + 68}" font-family="Arial Black, sans-serif" font-size="58" font-weight="900" fill="white" text-anchor="middle">${s.val}</text>
  <text x="${x + cellW/2}" y="${y + 112}" font-family="Arial, sans-serif" font-size="24" fill="white" fill-opacity="0.45" text-anchor="middle">${s.lbl}</text>`;
  }).join("\n  ")}

  <!-- Footer -->
  <line x1="80" y1="${p.H - 80}" x2="${p.W - 80}" y2="${p.H - 80}" stroke="white" stroke-opacity="0.12" stroke-width="1"/>
  <text x="80" y="${p.H - 40}" font-family="Arial, sans-serif" font-size="24" fill="white" fill-opacity="0.3">Organizado con Kaviro · kaviro.app</text>
</svg>`;
}

function buildStoriesSVG(p: BuildParams): string {
  const nameLines = wrap(p.tripName, 18);
  const nameY = 900;
  const lineH = 90;

  const stats = [
    { val: p.days, lbl: "días" },
    { val: p.activities, lbl: "actividades" },
    { val: p.km !== "0" ? p.km : p.participants, lbl: p.km !== "0" ? "km aprox." : "personas" },
    { val: p.expenses || p.participants, lbl: p.expenses ? "gasto total" : "personas" },
  ];

  const cellW = 440;
  const cellH = 180;
  const gridX = (p.W - (cellW * 2 + 20)) / 2;
  const gridY = nameY + nameLines.length * lineH + 80;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${p.W}" height="${p.H}" viewBox="0 0 ${p.W} ${p.H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F87171"/>
      <stop offset="35%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.04"/>
    </linearGradient>
  </defs>

  <rect width="${p.W}" height="${p.H}" fill="url(#bg)"/>
  <circle cx="900" cy="350" r="500" fill="#F87171" fill-opacity="0.12"/>
  <circle cx="180" cy="1600" r="350" fill="#F87171" fill-opacity="0.08"/>

  <!-- Logo — centered, bigger -->
  <rect x="${p.W/2 - 80}" y="160" width="160" height="160" rx="36" fill="#F87171" opacity="0.95"/>
  <text x="${p.W/2}" y="296" font-family="Arial Black, sans-serif" font-size="100" font-weight="900" fill="white" text-anchor="middle">K</text>
  <text x="${p.W/2}" y="368" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="white" fill-opacity="0.5" letter-spacing="8" text-anchor="middle">KAVIRO</text>

  <!-- Divider -->
  <line x1="${p.W/2 - 60}" y1="440" x2="${p.W/2 + 60}" y2="440" stroke="white" stroke-opacity="0.3" stroke-width="2"/>

  <text x="${p.W/2}" y="540" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="white" fill-opacity="0.4" text-anchor="middle" letter-spacing="4">✈ VIAJE COMPLETADO</text>

  ${p.destination ? `<text x="${p.W/2}" y="${nameY - 60}" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#F87171" letter-spacing="6" text-anchor="middle">${p.destination.toUpperCase()}</text>` : ""}

  ${nameLines.map((line, i) => `<text x="${p.W/2}" y="${nameY + i * lineH}" font-family="Arial Black, sans-serif" font-size="80" font-weight="900" fill="white" text-anchor="middle">${line}</text>`).join("\n  ")}

  ${p.dateRange ? `<text x="${p.W/2}" y="${nameY + nameLines.length * lineH + 36}" font-family="Arial, sans-serif" font-size="32" fill="white" fill-opacity="0.45" text-anchor="middle">${p.dateRange}</text>` : ""}

  ${stats.map((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = gridX + col * (cellW + 20);
    const y = gridY + row * (cellH + 20);
    return `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="24" fill="url(#card)" stroke="white" stroke-opacity="0.12" stroke-width="1"/>
  <text x="${x + cellW/2}" y="${y + 80}" font-family="Arial Black, sans-serif" font-size="64" font-weight="900" fill="white" text-anchor="middle">${s.val}</text>
  <text x="${x + cellW/2}" y="${y + 132}" font-family="Arial, sans-serif" font-size="26" fill="white" fill-opacity="0.45" text-anchor="middle">${s.lbl}</text>`;
  }).join("\n  ")}

  <!-- Tagline footer -->
  <text x="${p.W/2}" y="${p.H - 100}" font-family="Georgia, serif" font-size="28" fill="white" fill-opacity="0.3" text-anchor="middle" font-style="italic">"Cada viaje es una historia que aún no has contado."</text>
  <text x="${p.W/2}" y="${p.H - 55}" font-family="Arial, sans-serif" font-size="24" fill="white" fill-opacity="0.2" text-anchor="middle">kaviro.app</text>
</svg>`;
}
