import type { TourStep, SpotlightStep } from "@/components/trip/common/trip-tour-types";
import { tripTabDocsImageClass } from "@/lib/trip-tab-assets";

/** Tab-level tour — still used as entry point between tabs */
export const DEMO_TAB_TOUR: TourStep[] = [
  {
    id: "home",
    title: "Resumen",
    lead: "🏠 Paso 1 de 7 · Empezamos aquí",
    body: "El Resumen es la pantalla de entrada. Verás fechas, participantes, estadísticas y el estado del presupuesto. Pulsa 'Siguiente' para explorar esta pestaña.",
    mobileTip: "En móvil, usa el menú inferior para moverte entre secciones.",
    href: (id) => `/trip/${id}/summary`,
    visual: { type: "image", tabKey: "summary", alt: "Resumen" },
  },
  {
    id: "plan",
    title: "Plan",
    lead: "📅 Paso 2 de 7 · El corazón del viaje",
    body: "El itinerario día a día: actividades, horas y lugares. Arrastra para reordenar, añade con el botón + y exporta como PDF.",
    mobileTip: "Pulsa el botón ⋯ para acceder a más opciones desde el móvil.",
    href: (id) => `/trip/${id}/plan`,
    visual: { type: "image", tabKey: "plan", alt: "Plan" },
  },
  {
    id: "map",
    title: "Rutas",
    lead: "🗺️ Paso 3 de 7 · Visualiza los trayectos",
    body: "Conecta tus paradas sobre el mapa. Kaviro calcula distancias y tiempos de desplazamiento.",
    mobileTip: "Usa dos dedos para hacer zoom. Toca una ruta para ver sus detalles.",
    href: (id) => `/trip/${id}/map`,
    visual: { type: "image", tabKey: "map", alt: "Rutas" },
  },
  {
    id: "expenses",
    title: "Gastos",
    lead: "💶 Paso 4 de 7 · Sin pelearos con Excel",
    body: "Registra tickets, divide por persona y Kaviro calcula quién debe qué a quién automáticamente.",
    mobileTip: "Los botones Editar y Eliminar aparecen al expandir cada gasto.",
    href: (id) => `/trip/${id}/expenses`,
    visual: { type: "image", tabKey: "expenses", alt: "Gastos" },
  },
  {
    id: "participants",
    title: "Gente",
    lead: "👥 Paso 5 de 7 · Viajad juntos",
    body: "Invita con un enlace o QR. Cada persona puede tener rol diferente: editar, ver gastos o solo mirar.",
    mobileTip: "El punto rojo en el icono avisa cuando alguien nuevo se une.",
    href: (id) => `/trip/${id}/participants`,
    visual: { type: "image", tabKey: "participants", alt: "Participantes" },
  },
  {
    id: "resources",
    title: "Docs",
    lead: "📎 Paso 6 de 7 · Todo en un lugar",
    body: "Reservas de hotel, billetes, entradas. Sube PDFs o añade reservas con dirección y fechas.",
    mobileTip: "Toca un documento para abrirlo.",
    href: (id) => `/trip/${id}/resources`,
    visual: { type: "image", tabKey: "resources", alt: "Documentos", imageClassName: tripTabDocsImageClass },
  },
  {
    id: "ai",
    title: "Asistente IA",
    lead: "✨ Paso 7 de 7 · Tu planificador inteligente",
    body: "Conoce todo tu viaje. Pídele actividades, itinerarios completos o que detecte huecos en el plan.",
    mobileTip: "El asistente es opcional — Kaviro funciona perfectamente sin IA.",
    href: (id) => `/trip/${id}/ai-chat`,
    visual: { type: "image", tabKey: "chat", alt: "Asistente" },
  },
];

/**
 * SPOTLIGHT TOUR — intra-tab steps.
 * Each step targets a specific UI element via data-tour attribute.
 * Grouped by tab (id prefix).
 */
export const DEMO_SPOTLIGHT_TOUR: SpotlightStep[] = [
  // ── RESUMEN ──────────────────────────────────────────────────────────────
  {
    id: "summary-1", tab: "home", target: '[data-tour="summary-stats"]',
    placement: "bottom", emoji: "📊",
    title: "Estadísticas del viaje",
    body: "De un vistazo: cuántos días, actividades, participantes y km tienes planificados. Se actualizan en tiempo real.",
  },
  {
    id: "summary-2", tab: "home", target: '[data-tour="summary-recap-cta"]',
    placement: "top", emoji: "🎬",
    title: "Recap del viaje",
    body: "Al terminar el viaje, genera una tarjeta visual con estadísticas para compartir por WhatsApp o Instagram Stories.",
  },

  // ── PLAN ─────────────────────────────────────────────────────────────────
  {
    id: "plan-1", tab: "plan", target: '[data-tour="plan-add-btn"]',
    placement: "bottom", emoji: "➕",
    title: "Añadir actividad",
    body: "Crea una actividad con título, lugar en el mapa, hora y notas. El grupo la verá al instante.",
  },
  {
    id: "plan-2", tab: "plan", target: '[data-tour="plan-activity-card"]',
    placement: "right", emoji: "☰",
    title: "Arrastrar para reordenar",
    body: "Mantén pulsado el icono ≡ y arrastra la actividad a donde quieras. El orden se guarda automáticamente.",
  },
  {
    id: "plan-3", tab: "plan", target: '[data-tour="plan-explore-btn"]',
    placement: "bottom", emoji: "🧭",
    title: "Explorar lugares",
    body: "Busca restaurantes, museos o puntos de interés cerca del destino y añádelos directamente al plan.",
  },
  {
    id: "plan-4", tab: "plan", target: '[data-tour="plan-pdf-btn"]',
    placement: "bottom", emoji: "📄",
    title: "Exportar PDF",
    body: "Genera un PDF del itinerario con portada Kaviro. Perfecto para imprimir o compartir antes del viaje.",
  },
  {
    id: "plan-5", tab: "plan", target: '[data-tour="plan-calendar-btn"]',
    placement: "bottom", emoji: "📅",
    title: "Añadir al calendario",
    body: "Exporta cada actividad directamente a Google Calendar, Apple Calendar u Outlook con un solo clic.",
  },

  // ── RUTAS ────────────────────────────────────────────────────────────────
  {
    id: "map-1", tab: "map", target: '[data-tour="map-new-route-btn"]',
    placement: "bottom", emoji: "🗺️",
    title: "Crear una ruta",
    body: "Dibuja el trayecto entre paradas: a pie, en coche o transporte público. Kaviro calcula la distancia y el tiempo.",
  },
  {
    id: "map-2", tab: "map", target: '[data-tour="map-ai-btn"]',
    placement: "bottom", emoji: "✨",
    title: "Rutas con IA",
    body: "El asistente genera rutas óptimas conectando todas tus actividades del día. Ahorra horas de planificación.",
  },

  // ── GASTOS ───────────────────────────────────────────────────────────────
  {
    id: "expenses-1", tab: "expenses", target: '[data-tour="expenses-add-btn"]',
    placement: "bottom", emoji: "💶",
    title: "Registrar un gasto",
    body: "Añade el importe, quién pagó y entre quiénes se divide. Funciona con cualquier moneda — Kaviro convierte automáticamente.",
  },
  {
    id: "expenses-2", tab: "expenses", target: '[data-tour="expenses-balance"]',
    placement: "top", emoji: "⚖️",
    title: "Balance automático",
    body: "Kaviro calcula quién debe dinero a quién. Al final del viaje, todos saben exactamente qué transferir.",
  },
  {
    id: "expenses-3", tab: "expenses", target: '[data-tour="expenses-csv-btn"]',
    placement: "bottom", emoji: "📥",
    title: "Exportar CSV",
    body: "Descarga todos los gastos en un Excel. Útil para contabilidad o para compartir el resumen con el grupo.",
  },

  // ── PARTICIPANTES ────────────────────────────────────────────────────────
  {
    id: "participants-1", tab: "participants", target: '[data-tour="participants-invite-btn"]',
    placement: "bottom", emoji: "📨",
    title: "Invitar al grupo",
    body: "Comparte el enlace de invitación por WhatsApp. El invitado elige su rol: puede editar o solo ver.",
  },
  {
    id: "participants-2", tab: "participants", target: '[data-tour="participants-qr"]',
    placement: "top", emoji: "📱",
    title: "Código QR",
    body: "En el aeropuerto o la reunión previa, escanea el QR para unirte al viaje sin buscar el enlace.",
  },

  // ── DOCS ─────────────────────────────────────────────────────────────────
  {
    id: "resources-1", tab: "resources", target: '[data-tour="resources-add-btn"]',
    placement: "bottom", emoji: "📎",
    title: "Subir documentos",
    body: "Sube PDFs de reservas, billetes o entradas. Todos los participantes pueden verlos y descargarlos.",
  },
  {
    id: "resources-2", tab: "resources", target: '[data-tour="resources-lodging-btn"]',
    placement: "bottom", emoji: "🏨",
    title: "Guardar alojamiento",
    body: "Añade los datos del hotel: nombre, dirección, check-in, check-out y código de reserva. Sin buscar emails.",
  },

  // ── ASISTENTE IA ─────────────────────────────────────────────────────────
  {
    id: "ai-1", tab: "ai", target: '[data-tour="ai-input"]',
    placement: "top", emoji: "💬",
    title: "Pregunta lo que quieras",
    body: "Escribe en lenguaje natural: 'Crea un plan para el martes', '¿Qué hacer en Londres con lluvia?' o 'Reorganiza el itinerario del jueves'.",
  },
  {
    id: "ai-2", tab: "ai", target: '[data-tour="ai-suggestions"]',
    placement: "bottom", emoji: "⚡",
    title: "Sugerencias rápidas",
    body: "Pulsa cualquier sugerencia para hacer la pregunta al instante. Kaviro conoce el contexto completo del viaje.",
  },
];
