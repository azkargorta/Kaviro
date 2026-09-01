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
    description: "Crear tu viaje y saber qué hacer después sin configurar todo de golpe.",
    icon: "✈️",
    items: [
      {
        q: "¿Cómo creo mi primer viaje?",
        a: "Desde el panel «Mis viajes», pulsa «Crear viaje» e indica el destino. El nombre, las fechas y la moneda se pueden completar o cambiar después. Si quieres ver un ejemplo antes de empezar, el viaje demo de Londres es opcional y no ocupa un hueco del plan gratuito.",
      },
      {
        q: "¿Qué son los primeros pasos del viaje?",
        a: "Después de crear un viaje, Kaviro te recomienda solo tres acciones esenciales: añadir algo al Plan, invitar a quien viaja contigo y guardar una primera reserva o documento. La recomendación cambia automáticamente a medida que avanzas y desaparece cuando completas las tres.",
      },
      {
        q: "¿Tengo que configurar Plan, Gastos, Mapa y todo lo demás al empezar?",
        a: "No. Puedes empezar con una sola actividad o reserva y completar el resto cuando lo necesites. Las secciones vacías te muestran una acción sencilla para empezar, y Gastos puede dejarse para más adelante si todavía no habéis pagado nada juntos.",
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
        a: "En Participantes genera o copia el enlace de invitación. La otra persona crea cuenta o inicia sesión y se une al viaje. Si se registra desde una invitación, Kaviro conserva ese destino durante la confirmación del correo para devolverla al viaje correcto.",
      },
      {
        q: "¿Qué son los permisos por módulo?",
        a: "Además del rol general, puedes decidir quién puede gestionar Plan, Gastos, Mapa o Documentos. Las personas con permiso de solo lectura pueden consultar el viaje sin modificarlo.",
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
        a: "Crear o reorganizar itinerarios, sugerir actividades, responder dudas con contexto del viaje y generar borradores de rutas que después puedes revisar en Mapa.",
      },
      {
        q: "El asistente devuelve error o tarda mucho",
        a: "Comprueba tu conexión y que el viaje tenga suficiente información para responder a lo que pides. En planes muy largos, prueba a dividir la petición por días. Si el problema continúa, envíanos una captura y la hora aproximada desde «Enviar feedback» al final de esta página.",
      },
      {
        q: "¿Hay límite de mensajes?",
        a: "El plan gratuito no incluye IA. En Premium hay un presupuesto mensual de uso para mantener el servicio estable; si se agota, verás un aviso en el chat.",
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
        a: "Imágenes y PDFs de billetes, reservas de hotel, entradas y otros documentos de viaje. En Gastos puede ayudarte con tickets de compra; en Documentos puede extraer datos de reservas y transportes.",
      },
      {
        q: "El análisis falla o devuelve datos vacíos",
        a: "Usa una foto nítida o, si es posible, el PDF original. Evita imágenes borrosas, recortadas o con reflejos. Si sigue fallando, prueba con otro archivo y envíanos feedback indicando qué tipo de documento estabas intentando analizar.",
      },
      {
        q: "¿Se guardan mis documentos en el análisis?",
        a: "Los archivos que subes al viaje se guardan como recursos del propio viaje según el flujo de subida. El analizador extrae campos para ayudarte, pero conviene revisar siempre los datos antes de guardarlos.",
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
        a: "Las actividades del Plan necesitan una ubicación reconocida para aparecer correctamente en las rutas. Si falta una parada, edita esa actividad y vuelve a seleccionar su ubicación con el autocompletado.",
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
        q: "¿Tengo que añadir gastos para terminar de configurar el viaje?",
        a: "No. Gastos es una herramienta que puedes empezar a usar cuando haya pagos compartidos. No bloquea la organización del viaje ni forma parte de los tres primeros pasos esenciales.",
      },
      {
        q: "¿Puedo usar gastos sin Premium?",
        a: "Sí: puedes registrar gastos, repartirlos y ver balances. El análisis automático de tickets mediante foto o PDF es Premium.",
      },
      {
        q: "¿Cómo exporto los gastos?",
        a: "En Gastos abre Exportar y descarga el CSV de gastos o de pagos sugeridos.",
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
        a: "Desde Ajustes o Compartir del viaje puedes generar un enlace de solo lectura. Según la configuración del viaje, la otra persona puede consultarlo sin tener cuenta.",
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
