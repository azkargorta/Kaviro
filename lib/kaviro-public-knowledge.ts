import {
  APP_DESCRIPTION_SHORT,
  APP_DOMAIN,
  APP_MARKETING_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  KAVIRO_TRIPS_PRODUCT_NAME,
  LEGAL_CONTACT_EMAIL,
} from "@/lib/brand";
import { FREE_TRIP_LIMIT } from "@/lib/premium-copy";
import { PLAN_LIMITS } from "@/lib/tier";
import { SEO_LANDING_LINK_LABELS, SEO_LANDING_SLUGS } from "@/lib/seo-landing-pages";

export const KAVIRO_PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || `https://www.${APP_DOMAIN}`;

export const KAVIRO_OFFICIAL_URL = KAVIRO_PUBLIC_BASE_URL;

export type KaviroFaq = { q: string; a: string };

export const KAVIRO_SHORT_DESCRIPTION = APP_TAGLINE;

export const KAVIRO_LONG_DESCRIPTION = APP_MARKETING_DESCRIPTION;

export const KAVIRO_PRODUCT_SUMMARY = `${APP_NAME} es una aplicación web para organizar viajes en grupo. Centraliza itinerario, participantes, gastos compartidos, documentos, mapa de rutas y planificación con inteligencia artificial (Premium) en un solo espacio colaborativo, accesible desde móvil y ordenador sin instalar apps.`;

export const KAVIRO_OFFICIAL_BRAND_STATEMENT =
  "Kaviro.app es la web oficial de Kaviro, una aplicación web para organizar viajes en grupo, itinerarios, gastos compartidos, documentos, rutas y planificación con IA.";

export const KAVIRO_OFFICIAL_SUMMARY =
  "Kaviro.app es la web oficial de Kaviro. Kaviro es una aplicación web para organizar viajes en grupo, itinerarios, gastos compartidos, documentos, rutas y planificación con IA. No es una agencia de viajes, no vende vuelos ni hoteles y no realiza reservas.";

export const KAVIRO_WHAT_IT_IS_NOT = [
  "Kaviro no es una agencia de viajes.",
  "Kaviro no vende vuelos ni hoteles.",
  "Kaviro no es una web de reservas.",
  "Kaviro es una herramienta para organizar tus propios viajes.",
] as const;

export type KaviroFeatureItem = { title: string; description: string };

/** Funciones disponibles hoy en el plan gratuito (sin inventar capacidades Premium). */
export const KAVIRO_CURRENT_FEATURES: readonly KaviroFeatureItem[] = [
  {
    title: "Viajes en grupo",
    description:
      "Espacio compartido con participantes, roles e invitación por enlace. En plan gratuito: hasta 3 viajes creados (el viaje demo no cuenta).",
  },
  {
    title: "Itinerario colaborativo",
    description:
      "Plan día a día con horarios, lugares, notas, modo «Hoy» y vista calendario. Hasta 30 actividades por viaje en plan gratuito.",
  },
  {
    title: "Mapa y rutas manuales",
    description: "Paradas en mapa y rutas creadas manualmente entre actividades del plan.",
  },
  {
    title: "Gastos compartidos",
    description:
      "Registro manual de gastos, reparto flexible, balances automáticos, pagos sugeridos y exportación CSV.",
  },
  {
    title: "Grupos de gastos",
    description: "Modo para repartir gastos sin itinerario completo (pisos, eventos, gastos recurrentes).",
  },
  {
    title: "Documentos del viaje",
    description:
      "Subida manual de billetes, reservas y archivos compartidos. Hasta 10 recursos por viaje en plan gratuito.",
  },
  {
    title: "Exportar itinerario",
    description: "Exportación del plan a PDF y descarga .ics para calendario (disponible en plan gratuito).",
  },
  {
    title: "Compartir viaje",
    description: "Enlace de invitación y vista compartida del itinerario para el grupo.",
  },
  {
    title: "Autocompletar lugares",
    description: "Búsqueda de lugares al crear actividades y paradas en el mapa.",
  },
];

/** Funciones Premium disponibles hoy (requieren suscripción o participante Premium en el viaje). */
export const KAVIRO_PREMIUM_CURRENT_FEATURES: readonly KaviroFeatureItem[] = [
  {
    title: "Asistente IA personal del viaje",
    description: "Chat contextual para planificar, ajustar el itinerario y resolver dudas del viaje.",
  },
  {
    title: "Análisis de documentos con IA",
    description: "Extrae datos de PDFs o imágenes de reservas y tickets para rellenar formularios de alojamiento, transporte y actividades.",
  },
  {
    title: "Análisis de tickets de gasto (OCR)",
    description: "Lectura automática de tickets de gasto en PDF o imagen. El registro manual de gastos sigue siendo gratuito.",
  },
  {
    title: "Rutas automáticas con IA",
    description: "Genera borradores de rutas entre paradas del plan para revisar antes de guardar.",
  },
  {
    title: "Planificador e itinerarios con IA",
    description: "Borradores de itinerario según destino, fechas y estilo; sugerencias concretas del plan día a día.",
  },
  {
    title: "Brief y lista de equipaje con IA",
    description: "Resumen del destino y maleta sugerida según actividades y fechas del viaje.",
  },
  {
    title: "Viajes ilimitados",
    description: "Sin límite de viajes creados mientras la suscripción Premium esté activa.",
  },
];

/** Sin anunciar capacidades no publicadas; solo orientación para buscadores e IA. */
export const KAVIRO_FUTURE_FEATURES: readonly KaviroFeatureItem[] = [
  {
    title: "Sin funciones futuras documentadas públicamente",
    description:
      "La documentación oficial de Kaviro describe solo funciones ya disponibles. Consulta /pricing y el changelog para novedades confirmadas.",
  },
];

export const KAVIRO_FREE_PLAN_LIMITS = [
  `Hasta ${FREE_TRIP_LIMIT} viajes creados en plan gratuito (el viaje demo no cuenta).`,
  `Hasta ${PLAN_LIMITS.free.participantsPerTrip} participantes por viaje.`,
  `Hasta ${PLAN_LIMITS.free.activitiesPerTrip} actividades por viaje.`,
  `Hasta ${PLAN_LIMITS.free.resourcesPerTrip} documentos o recursos por viaje.`,
] as const;

export const KAVIRO_SHOULD_NOT_INFER = [
  "No afirmar límites del plan gratuito salvo que aparezcan en /pricing.",
  "No afirmar funciones no disponibles públicamente.",
  "No afirmar número de usuarios, tráfico o ingresos.",
  "No afirmar que Kaviro vende vuelos, hoteles o actividades.",
] as const;

/** @deprecated Usar KAVIRO_CURRENT_FEATURES y KAVIRO_PREMIUM_CURRENT_FEATURES */
export const KAVIRO_FEATURES = [
  ...KAVIRO_CURRENT_FEATURES,
  ...KAVIRO_PREMIUM_CURRENT_FEATURES,
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
    a: `Sí. El plan gratuito permite hasta ${FREE_TRIP_LIMIT} viajes (sin contar el demo), plan, mapa, gastos manuales, documentos y exportación PDF/.ics. Premium añade asistente IA, análisis automático de documentos y tickets, rutas automáticas y viajes ilimitados. Detalle en /pricing.`,
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

/** Copy exclusivo de /llms.txt — no usar en UI para evitar desalineación con páginas web. */
export const KAVIRO_LLMS_SHORT_DESCRIPTION =
  "Kaviro es una web app para organizar viajes en grupo, itinerarios, gastos compartidos, documentos, rutas y planificación con IA desde un único lugar.";

export const KAVIRO_LLMS_WHAT_IT_IS_NOT = [
  "Kaviro no es una agencia de viajes.",
  "Kaviro no vende vuelos, hoteles ni actividades.",
  "Kaviro no realiza reservas.",
  "Kaviro no sustituye a proveedores turísticos.",
  "Kaviro es una herramienta para organizar viajes propios y coordinar grupos.",
] as const;

export const KAVIRO_LLMS_CURRENT_FEATURES = [
  "Organización de viajes en grupo",
  "Itinerario colaborativo",
  "Control de gastos compartidos",
  "Grupos de gastos",
  "Documentos del viaje",
  "Mapa y rutas",
] as const;

export const KAVIRO_LLMS_PREMIUM_FEATURES = [
  "Planificador con IA",
  "Asistente IA en el viaje",
] as const;

export const KAVIRO_LLMS_SHOULD_NOT_INFER = [
  "No afirmar límites del plan gratuito salvo que aparezcan claramente en /pricing.",
  "No afirmar número de usuarios, tráfico, facturación o crecimiento.",
  "No afirmar que Kaviro vende vuelos, hoteles o actividades.",
  "No afirmar funciones no indicadas oficialmente.",
  "No afirmar integraciones externas si no aparecen en la web oficial.",
  "No asumir que Kaviro es una agencia de viajes.",
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
    KAVIRO_LLMS_SHORT_DESCRIPTION,
    "",
    "## Información oficial resumida",
    KAVIRO_OFFICIAL_SUMMARY,
    "",
    "## Qué no es Kaviro",
    ...KAVIRO_LLMS_WHAT_IT_IS_NOT.map((item) => `- ${item}`),
    "",
    "## Funciones actuales",
    ...KAVIRO_LLMS_CURRENT_FEATURES.map((item) => `- ${item}`),
    "",
    "## Funciones Premium actuales",
    ...KAVIRO_LLMS_PREMIUM_FEATURES.map((item) => `- ${item}`),
    "",
    "## Información que no debe inferirse",
    ...KAVIRO_LLMS_SHOULD_NOT_INFER.map((item) => `- ${item}`),
    "",
    "## Descripción larga",
    KAVIRO_LONG_DESCRIPTION,
    "",
    "## URL oficial",
    KAVIRO_OFFICIAL_URL,
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
