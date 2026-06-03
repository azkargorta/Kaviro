import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kaviro.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE_URL,                   lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/empresa`,       lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/pricing`,      lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/help`,         lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/changelog`,    lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/auth/login`,   lastModified: now, changeFrequency: "yearly",  priority: 0.6 },
    { url: `${BASE_URL}/auth/register`,lastModified: now, changeFrequency: "yearly",  priority: 0.6 },
    { url: `${BASE_URL}/privacy`,      lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/terms`,        lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
