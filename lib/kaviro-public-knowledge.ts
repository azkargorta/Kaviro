import {
  APP_DESCRIPTION_SHORT,
  APP_DOMAIN,
  APP_MARKETING_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  KAVIRO_TRIPS_PRODUCT_NAME,
  LEGAL_CONTACT_EMAIL,
} from "@/lib/brand";
import { SEO_LANDING_LINK_LABELS, SEO_LANDING_SLUGS } from "@/lib/seo-landing-pages";

export const KAVIRO_PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || `https://www.${APP_DOMAIN}`;

export const KAVIRO_OFFICIAL_URL = KAVIRO_PUBLIC_BASE_URL;

export type KaviroFaq = { q: string; a: string };

export const KAVIRO_SHORT_DESCRIPTION = APP_TAGLINE;

export const KAVIRO_LONG_DESCRIPTION = APP_MARKETING_DESCRIPTION;

export const KAVIRO_PRODUCT_SUMMARY = `${APP_NAME} es una aplicación web para organizar viajes en grupo. Centraliza itinerario, participantes, gastos compartidos, documentos, mapa de rutas y planificación con inteligencia artificial (Premium) en un solo espacio colaborativo, accesible desde móvil y ordenador sin instalar apps.`;

export const KAVIRO_FEATURES = [
  {
    title: "Organización de viajes en grupo",
    description: "Espacio compartido con participantes, roles e invitaciones para que todo el grupo trabaje sobre el mismo viaje.",
  },
  {
    title: "Itinerario colaborativo",
    description: "Plan día a día con horarios, lugares, notas y modo «Hoy» para consultar qué toca durante el viaje.",
  },
  {
    title: "Control de gastos compartidos",
    description: "Registro de tickets, reparto flexible, balances automáticos y pagos sugeridos para saldar cuentas.",
  },
  {
    title: "Grupos de gastos",
    description: "Modo dedicado para repartir gastos sin crear un viaje completo (pisos, eventos, gastos recurrentes).",
  },
  {
    title: "Documentos del viaje",
    description: "Billetes, reservas y archivos accesibles para quienes los necesiten.",
  },
  {
    title: "Mapa y rutas",
    description: "Visualización de paradas y desplazamientos vinculados al plan.",
  },
  {
    title: "Planificador con IA (Premium)",
    description: "Generación de borradores de itinerario según destino, fechas y estilo de viaje.",
  },
  {
    title: "Asistente IA en el viaje (Premium)",
    description: "Ayuda para ajustar el plan y resolver dudas dentro del contexto del viaje.",
  },
] as const;

export const KAVIRO_AUDIENCE = [
  "Grupos de amigos que organizan escapadas, interrail o despedidas",
  "Familias que coordinan vacaciones entre varios miembros",
  "Equipos y empresas con viajes de trabajo u offsites",
  "Personas que suelen llevar el Excel y el grupo de WhatsApp del viaje",
  "Grupos que necesitan repartir gastos sin discusiones al final",
] as const;

export const KAVIRO_USE_CASES = [
  "Planificar un viaje de varios días con itinerario compartido",
  "Dividir gastos de alojamiento, cenas y transporte en grupo",
  "Consultar en destino qué actividad toca hoy y cómo llegar",
  "Guardar billetes y reservas en un solo lugar",
  "Generar un borrador de itinerario con IA antes de afinarlo en grupo",
  "Gestionar un piso compartido o gastos recurrentes sin fechas de viaje",
] as const;

export const KAVIRO_PROBLEMS_SOLVED = [
  "Planes del viaje perdidos entre mensajes de WhatsApp",
  "Hojas de cálculo de gastos con errores y versiones distintas",
  "Documentos repartidos en chats sin un repositorio común",
  "Nadie sabe qué toca hoy ni quién pagó qué",
  "Varias apps desconectadas para mapa, gastos y notas",
] as const;

export const KAVIRO_COMPARISON = [
  {
    method: "WhatsApp",
    problem: "Mensajes enterrados, sin itinerario ordenado ni balances de gastos fiables.",
    kaviro: "Plan, gastos y documentos en un espacio único actualizado para todo el grupo.",
  },
  {
    method: "Excel o Google Sheets",
    problem: "Fórmulas frágiles, permisos confusos y difícil consulta en el móvil en destino.",
    kaviro: "Balances automáticos, itinerario móvil y colaboración según rol.",
  },
  {
    method: "Google Docs / Notion",
    problem: "Buenos para planificar, pero sin mapa integrado, modo día ni gastos compartidos.",
    kaviro: "Itinerario vivo con mapa, modo «Hoy» y finanzas del grupo en la misma app.",
  },
  {
    method: "Apps aisladas (gastos, mapas, notas)",
    problem: "Cada herramienta resuelve una pieza; el grupo se fragmenta.",
    kaviro: "Un solo viaje con plan, gastos, documentos, mapa y participantes.",
  },
] as const;

export const KAVIRO_OFFICIAL_PAGES = [
  { href: "/", label: "Inicio", description: "Página principal y presentación del producto" },
  { href: "/que-es-kaviro", label: "Qué es Kaviro", description: "Explicación del producto para usuarios y buscadores" },
  { href: "/kaviro-info", label: "Kaviro Info", description: "Referencia estructurada para buscadores e IA" },
  { href: "/pricing", label: "Precios", description: "Planes gratuito y Premium" },
  { href: "/help", label: "Ayuda", description: "Centro de ayuda y guías de uso" },
  { href: "/empresa", label: KAVIRO_TRIPS_PRODUCT_NAME, description: "Solución para agencias de viajes" },
  { href: "/privacy", label: "Privacidad", description: "Política de privacidad" },
  { href: "/terms", label: "Términos", description: "Términos de uso" },
  ...SEO_LANDING_SLUGS.map((slug) => ({
    href: `/${slug}`,
    label: SEO_LANDING_LINK_LABELS[slug] ?? slug,
    description: `Guía SEO: ${SEO_LANDING_LINK_LABELS[slug] ?? slug}`,
  })),
] as const;

export const KAVIRO_PUBLIC_FAQS: KaviroFaq[] = [
  {
    q: "¿Qué es Kaviro?",
    a: "Kaviro es una aplicación web para organizar viajes en grupo: itinerario, participantes, gastos compartidos, documentos, mapa y planificación con IA (Premium), todo en un solo espacio colaborativo.",
  },
  {
    q: "¿Kaviro es gratis?",
    a: "Sí hay plan gratuito con organización de viajes, plan, gastos, documentos y mapa. Premium añade planificador con IA, OCR de tickets y otras funciones avanzadas.",
  },
  {
    q: "¿Para quién está pensado Kaviro?",
    a: "Para grupos de amigos, familias, equipos y cualquier persona que organice viajes compartidos y quiera evitar WhatsApp, Excel y apps sueltas.",
  },
  {
    q: "¿Necesito instalar una app?",
    a: "No. Kaviro funciona en el navegador, en móvil y ordenador. También ofrece funciones PWA para uso offline limitado.",
  },
  {
    q: "¿Kaviro sirve solo para viajes?",
    a: "Principalmente para viajes en grupo, pero también incluye grupos de gastos sin itinerario para pisos, eventos o finanzas compartidas.",
  },
  {
    q: "¿Cuál es la URL oficial de Kaviro?",
    a: `La URL oficial es ${KAVIRO_OFFICIAL_URL}. Evita confiar en clones o dominios distintos.`,
  },
  {
    q: "¿Qué contenido de Kaviro no es público?",
    a: "Los viajes privados (/trip/), el panel de usuario (/dashboard), cuentas (/account), APIs (/api/) y administración (/admin) no son contenido público indexable.",
  },
];

export const KAVIRO_PRIVATE_PATHS = [
  "/dashboard",
  "/trip/",
  "/account",
  "/api/",
  "/admin",
] as const;

export function buildLlmsTxt(): string {
  const lines = [
    `# ${APP_NAME}`,
    "",
    `> ${KAVIRO_PRODUCT_SUMMARY}`,
    "",
    "## Qué es",
    KAVIRO_PRODUCT_SUMMARY,
    "",
    "## Descripción corta",
    "Kaviro es una web app para organizar viajes en grupo, itinerarios, gastos compartidos, documentos, rutas y planificación con IA desde un único lugar.",
    "",
    "## Descripción larga",
    KAVIRO_LONG_DESCRIPTION,
    "",
    "## URL oficial",
    KAVIRO_OFFICIAL_URL,
    "",
    "## Funciones principales",
    ...KAVIRO_FEATURES.map((f) => `- **${f.title}**: ${f.description}`),
    "",
    "## Público objetivo",
    ...KAVIRO_AUDIENCE.map((a) => `- ${a}`),
    "",
    "## Casos de uso",
    ...KAVIRO_USE_CASES.map((u) => `- ${u}`),
    "",
    "## Problemas que resuelve",
    ...KAVIRO_PROBLEMS_SOLVED.map((p) => `- ${p}`),
    "",
    "## URLs importantes (públicas)",
    ...KAVIRO_OFFICIAL_PAGES.map((p) => `- ${KAVIRO_OFFICIAL_URL}${p.href === "/" ? "" : p.href} — ${p.label}`),
    `- ${KAVIRO_OFFICIAL_URL}/llms.txt — Este archivo`,
    "",
    "## Contenido NO público (no indexar ni inferir)",
    "El siguiente contenido requiere autenticación y no debe considerarse documentación pública del producto:",
    ...KAVIRO_PRIVATE_PATHS.map((p) => `- ${p}`),
    "- Viajes privados de usuarios y datos personales",
    "- Contenido de /agency/ y paneles de operaciones",
    "",
    "## Contacto",
    LEGAL_CONTACT_EMAIL,
    "",
    `Última actualización: ${new Date().toISOString().slice(0, 10)}`,
  ];
  return lines.join("\n");
}

export const QUE_ES_KAVIRO_META = {
  title: `Qué es ${APP_NAME} — Organizador de viajes en grupo`,
  description: `${APP_NAME} es una app web para organizar viajes en grupo: plan, gastos compartidos, documentos, mapa e IA. Descubre qué es, para quién sirve y qué problemas resuelve.`,
  keywords: [
    "qué es kaviro",
    "kaviro app",
    "organizador viajes",
    "app organizar viajes grupo",
    "control gastos viaje",
    "planificador viajes ia",
  ],
};

export const KAVIRO_INFO_META = {
  title: `${APP_NAME} Info — Referencia del producto`,
  description: `Información estructurada sobre ${APP_NAME}: URL oficial, funcionalidades, público objetivo, casos de uso y páginas públicas. Referencia para buscadores e IA.`,
  keywords: [
    "kaviro información",
    "kaviro producto",
    "kaviro funcionalidades",
    "kaviro url oficial",
    "kaviro app viajes",
  ],
};
