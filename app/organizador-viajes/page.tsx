import type { Metadata } from "next";
import SeoLandingPage, { buildSeoLandingMetadata } from "@/components/marketing/SeoLandingPage";
import { getSeoLandingPage } from "@/lib/seo-landing-pages";

const SLUG = "organizador-viajes";

export const metadata: Metadata = buildSeoLandingMetadata(SLUG);

export default function OrganizadorViajesPage() {
  const data = getSeoLandingPage(SLUG)!;
  return <SeoLandingPage data={data} />;
}
