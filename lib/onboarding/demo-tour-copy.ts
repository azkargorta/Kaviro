import type { TourStep, SpotlightStep } from "@/components/trip/common/trip-tour-types";
import { tripTabDocsImageClass } from "@/lib/trip-tab-assets";

export const DEMO_TAB_TOUR: TourStep[] = [
  { id: "home", title: "Resumen", lead: "🏠 Paso 1 de 7", body: "Vista general del viaje: fechas, participantes y estadísticas.", mobileTip: "Usa el menú inferior para moverte entre secciones.", href: (id) => `/trip/${id}/summary`, visual: { type: "image", tabKey: "summary", alt: "Resumen" } },
  { id: "plan", title: "Plan", lead: "📅 Paso 2 de 7", body: "Itinerario día a día con actividades, horas y lugares.", mobileTip: "Pulsa ⋯ para más opciones desde el móvil.", href: (id) => `/trip/${id}/plan`, visual: { type: "image", tabKey: "plan", alt: "Plan" } },
  { id: "map", title: "Rutas", lead: "🗺️ Paso 3 de 7", body: "Conecta paradas en el mapa. Kaviro calcula distancias y tiempos.", mobileTip: "Usa dos dedos para hacer zoom.", href: (id) => `/trip/${id}/map`, visual: { type: "image", tabKey: "map", alt: "Rutas" } },
  { id: "expenses", title: "Gastos", lead: "💶 Paso 4 de 7", body: "Registra tickets y divide gastos. Kaviro calcula quién debe qué.", mobileTip: "Expande cada gasto para editar o eliminar.", href: (id) => `/trip/${id}/expenses`, visual: { type: "image", tabKey: "expenses", alt: "Gastos" } },
  { id: "participants", title: "Gente", lead: "👥 Paso 5 de 7", body: "Invita con enlace o QR. Cada persona puede tener un rol diferente.", mobileTip: "El punto rojo avisa cuando alguien nuevo se une.", href: (id) => `/trip/${id}/participants`, visual: { type: "image", tabKey: "participants", alt: "Participantes" } },
  { id: "resources", title: "Docs", lead: "📎 Paso 6 de 7", body: "Reservas, billetes y entradas. Todo accesible para el grupo.", mobileTip: "Toca un documento para abrirlo.", href: (id) => `/trip/${id}/resources`, visual: { type: "image", tabKey: "resources", alt: "Documentos", imageClassName: tripTabDocsImageClass } },
  { id: "ai", title: "Asistente IA", lead: "✨ Paso 7 de 7", body: "Pídele actividades, itinerarios o que detecte huecos en el plan.", mobileTip: "El asistente es opcional — Kaviro funciona sin IA.", href: (id) => `/trip/${id}/ai-chat`, visual: { type: "image", tabKey: "chat", alt: "Asistente" } },
];

/**
 * SPOTLIGHT TOUR COMPLETO — 20 pasos lineales por todas las pestañas.
 * El componente SpotlightTour navega automáticamente entre pestañas.
 * `tab` indica a qué ruta navegar antes de mostrar el paso.
 * `target` es el selector CSS del elemento a iluminar.
 */
export const DEMO_SPOTLIGHT_TOUR: SpotlightStep[] = [
  // ── RESUMEN ──────────────────────────────────────────────────────────────
  {
    id: "summary-1", tab: "summary", target: '[data-tour="summary-stats"]',
    placement: "bottom", emoji: "📊",
    title: "Bienvenido a Kaviro",
    body: "Esta es la pantalla de Resumen. Aquí ves de un vistazo las estadísticas clave: días de viaje, actividades planificadas, participantes del grupo y km de rutas. Todo se actualiza en tiempo real cuando alguien edita el plan.",
  },
  {
    id: "summary-2", tab: "summary", target: '[data-tour="summary-recap-cta"]',
    placement: "top", emoji: "🎬",
    title: "Recap del viaje",
    body: "Al terminar el viaje, genera aquí una tarjeta visual con todas las estadísticas para compartir por WhatsApp o Instagram Stories. Incluye foto del destino, días, actividades y participantes.",
  },
  // ── PLAN ─────────────────────────────────────────────────────────────────
  {
    id: "plan-1", tab: "plan", target: '[data-tour="plan-add-btn"]',
    placement: "bottom", emoji: "➕",
    title: "Añadir actividades",
    body: "Pulsa aquí para crear una actividad: ponle título, elige el lugar en el mapa, asígnale una hora y añade notas. El grupo la verá al instante en sus dispositivos. Puedes añadir restaurantes, museos, traslados, alojamiento o cualquier parada del viaje.",
  },
  {
    id: "plan-2", tab: "plan", target: '[data-tour="plan-activity-card"]',
    placement: "right", emoji: "☰",
    title: "Reordenar y gestionar",
    body: "Cada actividad tiene su propia tarjeta. Usa el icono ≡ para arrastrarla a otro momento del día — el orden se guarda automáticamente. Pulsa la tarjeta para editarla o eliminarla. Si la actividad necesita entrada, aparece un botón de búsqueda de tickets.",
  },
  {
    id: "plan-3", tab: "plan", target: '[data-tour="plan-explore-btn"]',
    placement: "bottom", emoji: "🧭",
    title: "Explorar el destino",
    body: "¿No sabes qué añadir? Pulsa Explorar para buscar restaurantes, museos, miradores y puntos de interés cerca del destino. Kaviro usa OpenStreetMap para sugerirte lugares reales. Con un clic los añades directamente al plan.",
  },
  {
    id: "plan-4", tab: "plan", target: '[data-tour="plan-pdf-btn"]',
    placement: "bottom", emoji: "📄",
    title: "Exportar el itinerario a PDF",
    body: "Genera un PDF completo del viaje con portada Kaviro: nombre del viaje, destino, fechas, número de actividades y todas las paradas organizadas por día. Perfecto para imprimir antes de salir o compartir con quien no tenga la app.",
  },
  {
    id: "plan-5", tab: "plan", target: '[data-tour="plan-calendar-btn"]',
    placement: "bottom", emoji: "📅",
    title: "Añadir al calendario",
    body: "Exporta cada actividad directamente a Google Calendar, Apple Calendar u Outlook. Kaviro genera el evento con título, hora, duración estimada y dirección del lugar. También puedes descargar el itinerario completo como archivo .ics.",
  },
  // ── RUTAS ────────────────────────────────────────────────────────────────
  {
    id: "map-1", tab: "map", target: '[data-tour="map-new-route-btn"]',
    placement: "bottom", emoji: "🗺️",
    title: "Crear rutas entre paradas",
    body: "Aquí diseñas los trayectos del viaje sobre el mapa. Elige origen, paradas intermedias y destino. Puedes elegir el modo: a pie, en coche o transporte público. Kaviro calcula la distancia y el tiempo estimado. Cada ruta tiene su propio color.",
  },
  {
    id: "map-2", tab: "map", target: '[data-tour="map-ai-btn"]',
    placement: "bottom", emoji: "✨",
    title: "Generar rutas con IA",
    body: "El asistente analiza todas las actividades del día y genera automáticamente la ruta óptima conectándolas en el orden más eficiente. Ahorra horas de planificación y evita ir y volver al mismo barrio dos veces.",
  },
  // ── GASTOS ───────────────────────────────────────────────────────────────
  {
    id: "expenses-1", tab: "expenses", target: '[data-tour="expenses-add-btn"]',
    placement: "bottom", emoji: "💶",
    title: "Registrar gastos del grupo",
    body: "Añade cada gasto con el importe, quién lo pagó y entre quiénes se divide. Funciona con cualquier moneda — Kaviro convierte automáticamente usando el tipo de cambio del día. Puedes dividir por igual o asignar importes distintos a cada persona.",
  },
  {
    id: "expenses-2", tab: "expenses", target: '[data-tour="expenses-balance"]',
    placement: "top", emoji: "⚖️",
    title: "Balance automático",
    body: "Kaviro calcula en tiempo real quién ha pagado de más y quién debe dinero. Al final del viaje muestra exactamente cuánto tiene que transferir cada persona y a quién. Sin calculadoras, sin hojas de cálculo, sin discusiones.",
  },
  {
    id: "expenses-3", tab: "expenses", target: '[data-tour="expenses-csv-btn"]',
    placement: "bottom", emoji: "📥",
    title: "Exportar gastos a Excel",
    body: "Descarga todos los gastos como archivo CSV que se abre directamente en Excel o Google Sheets. Útil para llevar la contabilidad del viaje, compartir el resumen con quien pagó el alojamiento o guardar un registro para gastos deducibles.",
  },
  // ── PARTICIPANTES ────────────────────────────────────────────────────────
  {
    id: "participants-1", tab: "participants", target: '[data-tour="participants-invite-btn"]',
    placement: "bottom", emoji: "📨",
    title: "Invitar a los viajeros",
    body: "Comparte el enlace de invitación por WhatsApp o email. Cada persona puede elegir su rol: Gestor (edita todo), Editor (edita el plan), Colaborador (añade gastos) o Visor (solo puede ver). Puedes cambiar los permisos en cualquier momento.",
  },
  {
    id: "participants-2", tab: "participants", target: '[data-tour="participants-qr"]',
    placement: "top", emoji: "📱",
    title: "Unirse con código QR",
    body: "En el aeropuerto o la reunión previa al viaje, muestra este QR para que todos se unan al instante sin buscar el enlace. El participante escanea con la cámara y entra directamente al viaje.",
  },
  // ── DOCS ─────────────────────────────────────────────────────────────────
  {
    id: "resources-1", tab: "resources", target: '[data-tour="resources-add-btn"]',
    placement: "bottom", emoji: "📎",
    title: "Guardar documentos del viaje",
    body: "Sube PDFs de reservas de vuelo, confirmaciones de hotel, entradas a museos o cualquier documento importante. Todos los participantes pueden verlos y descargarlos desde sus móviles. Nunca más buscar emails en el aeropuerto.",
  },
  {
    id: "resources-2", tab: "resources", target: '[data-tour="resources-lodging-btn"]',
    placement: "bottom", emoji: "🏨",
    title: "Añadir reserva de alojamiento",
    body: "Guarda los datos del hotel o apartamento: nombre, dirección, fechas de check-in y check-out, código de reserva y teléfono. Kaviro los muestra de forma clara para que cualquier participante pueda encontrar el alojamiento sin buscar en el email.",
  },
  // ── ASISTENTE IA ─────────────────────────────────────────────────────────
  {
    id: "ai-1", tab: "ai-chat", target: '[data-tour="ai-input"]',
    placement: "top", emoji: "💬",
    title: "El asistente conoce tu viaje",
    body: "Escribe en lenguaje natural lo que necesitas: 'Crea un plan completo para el martes', 'Sugiere restaurantes vegetarianos cerca del centro', 'Reorganiza el itinerario para reducir los desplazamientos' o '¿Qué hacer en Londres si llueve?'. El asistente tiene acceso a tu destino, fechas, actividades y presupuesto.",
  },
  {
    id: "ai-2", tab: "ai-chat", target: '[data-tour="ai-suggestions"]',
    placement: "bottom", emoji: "⚡",
    title: "Sugerencias rápidas",
    body: "Pulsa cualquiera de estas sugerencias para hacer la consulta al instante sin escribir nada. Kaviro genera nuevas sugerencias contextuales según el estado actual del viaje — si faltan actividades por la tarde, lo sabrá. ¡El tour ha terminado, ya conoces Kaviro!",
  },
];
