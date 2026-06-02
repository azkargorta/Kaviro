import type { Metadata } from "next";
import ChangelogPageContent from "@/components/changelog/ChangelogPageContent";

export const metadata: Metadata = {
  title: "Novedades · Kaviro",
  description: "Últimas actualizaciones y mejoras de Kaviro — tu organizador de viajes en grupo.",
};

export default function ChangelogPage() {
  return <ChangelogPageContent />;
}
