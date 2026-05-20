/**
 * Contenido del centro de ayuda — fuente única para FAQ y enlaces.
 */

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "soporte@kaviro.app";

export type HelpFaqItem = { q: string; a: string };
export type HelpSection = {
  id: string;
  title: string;
  description: string;
  icon: string;
  items: HelpFaqItem[];
};

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: "empezar",
    title: "Primeros pasos",
    description: "Crear viaje, invitar al grupo y checklist de configuración.",
    icon: "✈️",
    items: [
      {
        q: "¿Cómo creo mi primer viaje?",
        a: "Desde el panel «Mis viajes», pulsa crear viaje, pon nombre, destino y fechas. También puedes probar el viaje demo de Londres sin gastar un hueco del plan gratuito.",
      },
      {
        q: "¿Qué es el checklist «Configura tu viaje»?",
        a: "Aparece arriba en cada pestaña del viaje hasta que completes invitar, plan, gastos, mapa y documentos. Te lleva directo al módulo que falte.",
      },
      {
        q: "¿Cuántos viajes puedo tener en el plan gratuito?",
        a: "Hasta 3 viajes activos (sin contar el demo). Premium permite viajes ilimitados.",
      },
    ],
  },
  {
    id: "grupo",
    title: "Participantes y permisos",
    description: "Invitaciones, roles y quién puede editar cada módulo.",
    icon: "👥",
    items: [
      {
        q: "¿Cómo invito a alguien?",
        a: "En la pestaña Gente/Participantes genera o copia el enlace de invitación. La otra persona crea cuenta (o entra) y se une al viaje.",
      },
      {
        q: "¿Qué son los permisos por módulo?",
        a: "Además del rol (owner, editor, viewer), puedes marcar quién puede gestionar plan, gastos, mapa o documentos. Los viewers solo ven.",
      },
    ],
  },
  {
    id: "ia",
    title: "Asistente IA (Premium)",
    description: "Itinerarios, optimización y límites del asistente.",
    icon: "✨",
    items: [
      {
        q: "¿Quién puede usar el asistente IA?",
        a: "Necesitas Premium en tu cuenta, o que al menos un participante del viaje tenga Premium. Entonces todo el viaje desbloquea IA.",
      },
      {
        q: "¿Qué puede hacer el asistente?",
        a: "Crear o reorganizar itinerarios, sugerir actividades, responder dudas con contexto del viaje y generar borradores de rutas (luego las revisas en Mapa).",
      },
      {
        q: "El asistente devuelve error o tarda mucho",
        a: "Comprueba conexión y que el viaje tenga destino/fechas. En planes muy largos, divide la petición por días. Si persiste, envíanos captura y hora desde «Enviar feedback» abajo.",
      },
      {
        q: "¿Hay límite de mensajes?",
        a: "El plan gratuito no incluye IA. En Premium hay un presupuesto mensual de uso para mantener el servicio estable; si se agota, verás aviso en el chat.",
      },
    ],
  },
  {
    id: "ocr",
    title: "Análisis de documentos (Premium)",
    description: "Tickets, reservas y PDFs en Gastos y Documentos.",
    icon: "📄",
    items: [
      {
        q: "¿Qué archivos puedo analizar?",
        a: "Imágenes y PDFs de billetes, reservas de hotel, entradas, etc. En Gastos analiza tickets de compra; en Documentos rellena formularios de alojamiento o transporte.",
      },
      {
        q: "El análisis falla o devuelve datos vacíos",
        a: "Usa fotos nítidas o PDF nativo (no escaneos borrosos). Si estás en local, revisa que existan las variables de IA/OCR en el servidor. En producción, mira los logs del endpoint /api/document/analyze.",
      },
      {
        q: "¿Se guardan mis documentos en el análisis?",
        a: "Los archivos que subes al viaje se guardan como recursos del viaje según tu flujo de subida. El analizador procesa el archivo para extraer campos; no sustituye revisar los datos antes de guardar.",
      },
    ],
  },
  {
    id: "mapa",
    title: "Mapa y rutas",
    description: "Rutas manuales, automáticas y coordenadas.",
    icon: "🗺️",
    items: [
      {
        q: "¿Las rutas automáticas son gratis?",
        a: "Crear rutas manualmente en el mapa es gratis. Generar borradores de rutas con IA entre tus planes requiere Premium en el viaje.",
      },
      {
        q: "Faltan paradas al generar rutas",
        a: "Las actividades del plan necesitan coordenadas (usa autocompletar al crear el plan). Sin lat/lng, esa parada se omite al trazar.",
      },
    ],
  },
  {
    id: "gastos",
    title: "Gastos compartidos",
    description: "Tickets, balances y exportación.",
    icon: "💶",
    items: [
      {
        q: "¿Puedo usar gastos sin Premium?",
        a: "Sí: registrar gastos, repartir y ver balances. El análisis automático de tickets (foto/PDF) es Premium.",
      },
      {
        q: "¿Cómo exporto los gastos?",
        a: "En Gastos abre Exportar y descarga CSV de gastos o de pagos sugeridos.",
      },
    ],
  },
  {
    id: "compartir",
    title: "Compartir y recap",
    description: "Enlaces públicos y tarjeta resumen del viaje.",
    icon: "📱",
    items: [
      {
        q: "¿Cómo comparto el plan con alguien externo?",
        a: "Desde Ajustes o Compartir del viaje puedes generar un enlace de solo lectura. No hace falta que tenga cuenta para ver (según configuración).",
      },
      {
        q: "¿Dónde está la guía del Recap?",
        a: "En la ayuda del Recap explicamos PNG, Stories y preguntas frecuentes del resumen visual.",
      },
    ],
  },
];

export const HELP_GUIDES = [
  { href: "/help/recap", label: "Recap del viaje", desc: "Compartir resumen en PNG o Stories" },
  { href: "/pricing", label: "Precios y Premium", desc: "Comparativa de planes" },
  { href: "/auth/register", label: "Crear cuenta", desc: "Empezar gratis" },
] as const;

export type FeedbackCategory = "bug" | "idea" | "ia" | "ocr" | "other";

export const FEEDBACK_CATEGORIES: { id: FeedbackCategory; label: string }[] = [
  { id: "bug", label: "Error / algo no funciona" },
  { id: "ia", label: "Asistente IA" },
  { id: "ocr", label: "Análisis de documentos" },
  { id: "idea", label: "Idea o mejora" },
  { id: "other", label: "Otro" },
];

export function buildFeedbackMailto(params: {
  category: FeedbackCategory;
  message: string;
  contactEmail?: string;
  pageUrl?: string;
}) {
  const subject = encodeURIComponent(`[Kaviro feedback] ${params.category}`);
  const body = encodeURIComponent(
    [
      `Categoría: ${params.category}`,
      params.contactEmail ? `Contacto: ${params.contactEmail}` : "",
      params.pageUrl ? `Página: ${params.pageUrl}` : "",
      "",
      params.message,
    ]
      .filter(Boolean)
      .join("\n")
  );
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}
