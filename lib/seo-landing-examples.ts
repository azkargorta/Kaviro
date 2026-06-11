export type SeoPreviewVariant = "trip" | "expenses" | "itinerary" | "ai" | "overview";

export type SeoLandingExample = {
  title: string;
  description: string;
  variant: SeoPreviewVariant;
  highlights: string[];
};

export const SEO_LANDING_EXAMPLES: Record<string, SeoLandingExample> = {
  "organizador-viajes": {
    title: "Ejemplo: viaje organizado en Kaviro",
    description:
      "Un grupo de amigos prepara una escapada a Croacia: mismo espacio para participantes, plan, gastos y documentos.",
    variant: "trip",
    highlights: [
      "4 participantes invitados con un enlace",
      "Itinerario de 5 días visible para todos",
      "Gastos del apartamento repartidos al instante",
      "Billetes de ferry guardados en Documentos",
    ],
  },
  "control-gastos-viaje": {
    title: "Ejemplo: reparto de gastos del viaje",
    description:
      "Tras un fin de semana en la montaña, el grupo consulta balances y sabe exactamente quién debe transferir a quién.",
    variant: "expenses",
    highlights: [
      "Cena, alojamiento y gasolina registrados",
      "Balances actualizados en tiempo real",
      "Solo 2 pagos sugeridos para saldar todo",
      "Resumen compartible por WhatsApp",
    ],
  },
  "itinerario-viaje": {
    title: "Ejemplo: itinerario día a día",
    description:
      "El plan de un road trip por la costa, con horarios, lugares y modo «Hoy» para consultar en destino.",
    variant: "itinerary",
    highlights: [
      "Actividades ordenadas por jornada",
      "Horarios y direcciones en cada parada",
      "Mapa con todas las ubicaciones",
      "Modo «Hoy» con la actividad actual",
    ],
  },
  "planificador-viajes-ia": {
    title: "Ejemplo: planificación con IA",
    description:
      "La IA propone un borrador de 7 días en Lisboa; el organizador revisa, ajusta y guarda el plan en el viaje.",
    variant: "ai",
    highlights: [
      "Destino y fechas en un formulario",
      "Borrador con museos, miradores y gastronomía",
      "Ajustes por chat: «más tiempo libre el sábado»",
      "Guardado directo en el itinerario colaborativo",
    ],
  },
  "que-es-kaviro": {
    title: "Así se ve Kaviro por dentro",
    description: "Un único espacio donde el grupo consulta plan, gastos y documentos sin cambiar de app.",
    variant: "overview",
    highlights: [
      "Panel de viajes claro y escaneable",
      "Secciones: Plan, Gastos, Mapa, Documentos",
      "Móvil y escritorio con la misma información",
      "Colaboración en tiempo real",
    ],
  },
  "kaviro-info": {
    title: "Vista general del producto",
    description: "Referencia visual de las áreas principales que encontrarás al crear un viaje.",
    variant: "overview",
    highlights: [
      "Organización centralizada por viaje",
      "Gastos compartidos integrados",
      "Itinerario colaborativo",
      "IA Premium para acelerar la planificación",
    ],
  },
};

export const SEO_PREVIEW_VARIANT_BY_SLUG: Record<string, SeoPreviewVariant> = Object.fromEntries(
  Object.entries(SEO_LANDING_EXAMPLES).map(([slug, ex]) => [slug, ex.variant])
);
