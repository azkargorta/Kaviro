import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PublicLanding from "@/components/PublicLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kaviro — Organiza viajes en grupo sin esfuerzo",
  description: "Plan del viaje, gastos compartidos, mapa de rutas y asistente IA. Todo en un solo lugar para que tu grupo viaje sin líos.",
  openGraph: {
    title: "Kaviro — Organiza viajes en grupo sin esfuerzo",
    description: "Plan del viaje, gastos compartidos, mapa de rutas y asistente IA. Todo en un solo lugar.",
    type: "website",
    siteName: "Kaviro",
    images: [{ url: "/brand/kaviro-lockup-fullcolor.png", width: 1200, height: 630, alt: "Kaviro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kaviro — Organiza viajes en grupo sin esfuerzo",
    description: "Plan del viaje, gastos compartidos, mapa de rutas y asistente IA.",
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
