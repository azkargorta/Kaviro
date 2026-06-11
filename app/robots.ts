import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kaviro.app";

/** Rutas privadas: accesibles con login pero no indexables. */
const PRIVATE_DISALLOW = ["/dashboard", "/trip/", "/account", "/api/", "/admin"] as const;

function publicCrawlerRule(userAgent: string) {
  return {
    userAgent,
    allow: "/" as const,
    disallow: [...PRIVATE_DISALLOW],
  };
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      publicCrawlerRule("Googlebot"),
      publicCrawlerRule("Bingbot"),
      publicCrawlerRule("OAI-SearchBot"),
      publicCrawlerRule("*"),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: "www.kaviro.app",
  };
}
