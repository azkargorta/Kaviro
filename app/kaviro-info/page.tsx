import type { Metadata } from "next";
import KaviroInfoPage from "@/components/marketing/KaviroInfoPage";
import { APP_NAME } from "@/lib/brand";
import { KAVIRO_INFO_META, KAVIRO_OFFICIAL_URL } from "@/lib/kaviro-public-knowledge";

export const metadata: Metadata = {
  title: KAVIRO_INFO_META.title,
  description: KAVIRO_INFO_META.description,
  keywords: [...KAVIRO_INFO_META.keywords],
  alternates: { canonical: `${KAVIRO_OFFICIAL_URL}/kaviro-info` },
  openGraph: {
    title: KAVIRO_INFO_META.title,
    description: KAVIRO_INFO_META.description,
    type: "website",
    siteName: APP_NAME,
    url: `${KAVIRO_OFFICIAL_URL}/kaviro-info`,
  },
  twitter: {
    card: "summary_large_image",
    title: KAVIRO_INFO_META.title,
    description: KAVIRO_INFO_META.description,
  },
};

export default function KaviroInfoRoutePage() {
  return <KaviroInfoPage />;
}
