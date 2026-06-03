import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAgencyForUser } from "@/lib/agency";
import EmpresaLanding from "@/components/empresa/EmpresaLanding";
import {
  EMPRESA_KEYWORDS,
  EMPRESA_META_DESCRIPTION,
  EMPRESA_META_TITLE,
  EMPRESA_PAGE_URL,
  empresaJsonLd,
} from "@/lib/empresa-seo";

export const metadata: Metadata = {
  title: EMPRESA_META_TITLE,
  description: EMPRESA_META_DESCRIPTION,
  keywords: [...EMPRESA_KEYWORDS],
  alternates: {
    canonical: EMPRESA_PAGE_URL,
  },
  openGraph: {
    title: EMPRESA_META_TITLE,
    description: EMPRESA_META_DESCRIPTION,
    type: "website",
    url: EMPRESA_PAGE_URL,
    siteName: "Kaviro Trips",
    locale: "es_ES",
    images: [
      {
        url: "/empresa/opengraph-image",
        width: 1200,
        height: 630,
        alt: EMPRESA_META_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: EMPRESA_META_TITLE,
    description: EMPRESA_META_DESCRIPTION,
    images: ["/empresa/opengraph-image"],
  },
};

type Props = {
  searchParams?: { reason?: string };
};

export default async function EmpresaLandingPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasAgency = false;
  if (user) {
    const ctx = await getAgencyForUser(supabase, user.id);
    hasAgency = Boolean(ctx);
  }

  const jsonLd = empresaJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EmpresaLanding
        hasAgency={hasAgency}
        isLoggedIn={Boolean(user)}
        reason={searchParams?.reason}
      />
    </>
  );
}
