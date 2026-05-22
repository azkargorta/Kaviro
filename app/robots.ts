import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kaviro.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/trip/", "/account", "/api/", "/admin"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
