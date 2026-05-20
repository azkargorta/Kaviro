import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PublicLanding from "@/components/PublicLanding";
import type { Metadata } from "next";
import { APP_MARKETING_DESCRIPTION, APP_MARKETING_TITLE, APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: APP_MARKETING_TITLE,
  description: APP_MARKETING_DESCRIPTION,
  openGraph: {
    title: APP_MARKETING_TITLE,
    description: APP_MARKETING_DESCRIPTION,
    type: "website",
    siteName: APP_NAME,
    images: [{ url: "/brand/kaviro-lockup-fullcolor.png", width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_MARKETING_TITLE,
    description: APP_MARKETING_DESCRIPTION,
    images: ["/brand/kaviro-lockup-fullcolor.png"],
  },
  keywords: ["organizar viaje", "viaje en grupo", "gastos viaje", "itinerario viaje", "planificador viaje"],
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return <PublicLanding />;
}
