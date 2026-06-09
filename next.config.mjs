import { buildSecurityHeaders } from "./lib/security-headers.mjs";

const supabaseStorageHost = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
})();

const isCi = process.env.CI === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // En CI ya corre `npm run lint`; evita un segundo pase ESLint que sube el pico de RAM.
    ignoreDuringBuilds: isCi,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        pathname: "/v1/create-qr-code/**",
      },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      ...(supabaseStorageHost
        ? [
            {
              protocol: "https",
              hostname: supabaseStorageHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
  async headers() {
    const security = buildSecurityHeaders();
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: security,
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [{ key: "Content-Type", value: "application/json; charset=utf-8" }],
      },
    ];
  },
  experimental: {
    // Evita que Next intente "bundle/trazar" los workers de tesseract en runtime,
    // lo que en Windows puede acabar en `.next/worker-script/...` MODULE_NOT_FOUND.
    serverComponentsExternalPackages: ["tesseract.js", "unpdf", "@napi-rs/canvas"],
    // Solo rutas que cargan OCR/PDF; incluir **/*.wasm en todas las APIs agotaba RAM en `next build`.
    outputFileTracingIncludes: {
      "/api/expense/analyze": [
        "./node_modules/tesseract.js/**",
        "./node_modules/@napi-rs/canvas/**",
        "./node_modules/unpdf/**",
      ],
    },
  },
};

export default nextConfig;

