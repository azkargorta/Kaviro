import type { Metadata } from "next";
import QueEsKaviroPage from "@/components/marketing/QueEsKaviroPage";
import { APP_NAME } from "@/lib/brand";
import { KAVIRO_OFFICIAL_URL, QUE_ES_KAVIRO_META } from "@/lib/kaviro-public-knowledge";

export const metadata: Metadata = {
  title: QUE_ES_KAVIRO_META.title,
  description: QUE_ES_KAVIRO_META.description,
  keywords: [...QUE_ES_KAVIRO_META.keywords],
  alternates: { canonical: `${KAVIRO_OFFICIAL_URL}/que-es-kaviro` },
  openGraph: {
    title: QUE_ES_KAVIRO_META.title,
    description: QUE_ES_KAVIRO_META.description,
    type: "website",
    siteName: APP_NAME,
    url: `${KAVIRO_OFFICIAL_URL}/que-es-kaviro`,
  },
  twitter: {
    card: "summary_large_image",
    title: QUE_ES_KAVIRO_META.title,
    description: QUE_ES_KAVIRO_META.description,
  },
};

export default function QueEsKaviroRoutePage() {
  return <QueEsKaviroPage />;
}
