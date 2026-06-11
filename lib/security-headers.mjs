const supabaseHost = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
})();

/** Cabeceras de seguridad (CSP pragmática para Next.js + mapas + Stripe + Supabase). */
export function buildSecurityHeaders() {
  const connectSrc = [
    "'self'",
    supabaseHost,
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.stripe.com",
    "https://router.project-osrm.org",
    "https://photon.komoot.io",
    "https://overpass-api.de",
    "https://overpass.kumi.systems",
    "https://overpass.openstreetmap.ru",
    // Google Analytics 4
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://analytics.google.com",
    "https://www.googletagmanager.com",
    // Microsoft Clarity
    "https://www.clarity.ms",
    "https://*.clarity.ms",
    "https://scripts.clarity.ms",
  ]
    .filter(Boolean)
    .join(" ");

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: https://*.clarity.ms",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(self)",
    },
  ];
}
