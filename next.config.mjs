/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        pathname: "/v1/create-qr-code/**",
      },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
    ],
  },
  async headers() {
    return [
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
    // Mantén assets binarios disponibles en entornos serverless/trace.
    outputFileTracingIncludes: {
      "/api/**/*": ["./node_modules/**/*.wasm", "./node_modules/**/*.proto"],
    },
  },
};

export default nextConfig;

