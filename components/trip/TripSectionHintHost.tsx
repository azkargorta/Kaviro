"use client";

import { usePathname } from "next/navigation";
import TripSectionHint from "@/components/trip/TripSectionHint";

const HINTS: Array<{
  suffix: string;
  key: string;
  message: string;
}> = [
  {
    suffix: "/expenses",
    key: "expenses",
    message: "Añade tickets con el botón +. Kaviro calcula balances y quién debe a quién.",
  },
  {
    suffix: "/plan",
    key: "plan",
    message: "Aquí va el itinerario día a día. Puedes importar un PDF con la IA (Premium).",
  },
  {
    suffix: "/map",
    key: "map",
    message: "Rutas y puntos del viaje en el mapa. Útil durante el desplazamiento.",
  },
  {
    suffix: "/participants",
    key: "participants",
    message: "Invita por enlace de WhatsApp o busca usuarios que ya tengan cuenta en Kaviro.",
  },
  {
    suffix: "/resources",
    key: "resources",
    message: "Billetes, reservas y documentos compartidos del grupo.",
  },
  {
    suffix: "/ai-chat",
    key: "ai",
    message: "Asistente con contexto del viaje: organizar días, ideas y cambios al plan.",
  },
];

export default function TripSectionHintHost({ tripId }: { tripId: string }) {
  const pathname = usePathname() || "";
  const match = HINTS.find((h) => pathname.endsWith(h.suffix));
  if (!match) return null;
  return <TripSectionHint tripId={tripId} sectionKey={match.key} message={match.message} />;
}
