import type { TourStep, SpotlightStep } from "@/components/trip/common/trip-tour-types";
import { tripTabDocsImageClass } from "@/lib/trip-tab-assets";

export const DEMO_TAB_TOUR: TourStep[] = [
  { id: "home", title: "Resumen", lead: "🏠", body: "Vista general del viaje.", mobileTip: "", href: (id) => `/trip/${id}/summary`, visual: { type: "image", tabKey: "summary", alt: "Resumen" } },
  { id: "plan", title: "Plan", lead: "📅", body: "Itinerario día a día.", mobileTip: "", href: (id) => `/trip/${id}/plan`, visual: { type: "image", tabKey: "plan", alt: "Plan" } },
  { id: "map", title: "Rutas", lead: "🗺️", body: "Mapa de rutas.", mobileTip: "", href: (id) => `/trip/${id}/map`, visual: { type: "image", tabKey: "map", alt: "Rutas" } },
  { id: "expenses", title: "Gastos", lead: "💶", body: "Gastos del grupo.", mobileTip: "", href: (id) => `/trip/${id}/expenses`, visual: { type: "image", tabKey: "expenses", alt: "Gastos" } },
  { id: "participants", title: "Gente", lead: "👥", body: "Participantes.", mobileTip: "", href: (id) => `/trip/${id}/participants`, visual: { type: "image", tabKey: "participants", alt: "Participantes" } },
  { id: "resources", title: "Docs", lead: "📎", body: "Documentos.", mobileTip: "", href: (id) => `/trip/${id}/resources`, visual: { type: "image", tabKey: "resources", alt: "Documentos", imageClassName: tripTabDocsImageClass } },
  { id: "ai", title: "Asistente IA", lead: "✨", body: "Asistente IA.", mobileTip: "", href: (id) => `/trip/${id}/ai-chat`, visual: { type: "image", tabKey: "chat", alt: "Asistente" } },
];

/**
 * TOUR COMPLETO — 21 pasos lineales.
 * SpotlightTour navega automáticamente entre pestañas.
 * `tab` = segmento de URL al que navegar antes de mostrar el paso.
 */
export const DEMO_SPOTLIGHT_TOUR: SpotlightStep[] = [

  // ════════════════════════════════════════════════════════════════
  // RESUMEN — 7 pasos
  // ════════════════════════════════════════════════════════════════

  {
    id: "welcome", tab: "summary", target: null, placement: "center", emoji: "👋",
    title: "Bienvenido a Kaviro",
    body: "Este es tu viaje de demostración. En los próximos pasos te voy a enseñar todas las funciones de la app. Puedes avanzar con → o Siguiente, retroceder con ←, y cerrar el tour en cualquier momento con ✕. ¡Empezamos!",
  },
  {
    id: "summary-sidebar", tab: "summary", target: '[data-tour="sidebar-nav"]', placement: "right", emoji: "🗂️",
    title: "Navegación del viaje",
    body: "En el panel izquierdo tienes acceso a todas las secciones: Resumen, Plan, Rutas, Gastos, Gente, Docs y Asistente IA. La sección activa se resalta. En móvil, la navegación aparece en la barra inferior de la pantalla.",
  },
  {
    id: "summary-topbar", tab: "summary", target: '[data-tour="topbar-help"]', placement: "bottom", emoji: "🔧",
    title: "Barra superior",
    body: "Aquí tienes los controles del viaje. El botón ❓ abre la ayuda contextual de cada sección. El 🔔 muestra las novedades y actividad reciente del grupo. Los botones de la derecha permiten copiar el enlace del viaje, volver a tus viajes y cambiar entre modo claro y oscuro.",
  },
  {
    id: "summary-topbar-actions", tab: "summary", target: '[data-tour="topbar-actions"]', placement: "bottom", emoji: "🔗",
    title: "Acciones rápidas",
    body: "Estos botones cambian según la sección donde estés. En el Plan aparecen los botones de exportar PDF y añadir al calendario. En Gastos aparece el exportar CSV. Siempre están a un clic de distancia.",
  },
  {
    id: "summary-countdown", tab: "summary", target: '[data-tour="summary-countdown"]', placement: "bottom", emoji: "⏳",
    title: "Cuenta atrás del viaje",
    body: "Este bloque cambia según el momento del viaje. Antes de salir muestra cuántos días quedan con una cuenta atrás visual. Durante el viaje muestra en qué día estás y una barra de progreso. Y si el destino tiene datos meteorológicos, muestra también la temperatura del día.",
  },
  {
    id: "summary-weather", tab: "summary", target: '[data-tour="summary-weather"]', placement: "bottom", emoji: "🌤️",
    title: "Clima del destino",
    body: "Kaviro obtiene la previsión meteorológica del destino automáticamente. Muestra la temperatura máxima y mínima del día de hoy en tu destino. No tienes que buscar el tiempo en otra app — está integrado directamente en el viaje.",
  },
  {
    id: "summary-stats", tab: "summary", target: '[data-tour="summary-stats"]', placement: "bottom", emoji: "📊",
    title: "Resumen de módulos",
    body: "Cuatro tarjetas con un vistazo rápido al estado del viaje: actividades planificadas (con barra de completitud), gasto total del grupo, número de participantes y documentos guardados. Pulsa cualquiera para ir directamente a esa sección.",
  },
  {
    id: "summary-recap", tab: "summary", target: '[data-tour="summary-recap-cta"]', placement: "top", emoji: "🎬",
    title: "Recap del viaje",
    body: "Al terminar el viaje, pulsa aquí para generar una tarjeta visual con las estadísticas: días, actividades, km recorridos y foto del destino. Se puede compartir directamente por WhatsApp o descargar en formato Stories para Instagram.",
  },

  // ════════════════════════════════════════════════════════════════
  // PLAN — 7 pasos
  // ════════════════════════════════════════════════════════════════

  {
    id: "plan-add", tab: "plan", target: '[data-tour="plan-add-btn"]', placement: "bottom", emoji: "➕",
    title: "Añadir actividades al plan",
    body: "Pulsa + para crear una actividad. Puedes escribir el nombre, buscar el lugar en el mapa (autocomplete de OpenStreetMap), asignarle una hora, una duración, notas y elegir la categoría (restaurante, museo, transporte...). Todos los participantes ven la actividad al instante.",
  },
  {
    id: "plan-card", tab: "plan", target: '[data-tour="plan-activity-card"]', placement: "right", emoji: "☰",
    title: "Gestionar actividades",
    body: "Cada actividad aparece en una tarjeta dentro de su día. Pulsa la tarjeta para editarla o eliminarla. Usa el icono ≡ del lado izquierdo para arrastrarla y cambiar su posición dentro del día. Si la actividad requiere entrada, aparece automáticamente un botón para buscar tickets.",
  },
  {
    id: "plan-calendar-mode", tab: "plan", target: '[data-tour="plan-calendar-mode"]', placement: "bottom", emoji: "📆",
    title: "Vista Calendario",
    body: "Cambia entre vista Lista y vista Calendario. En modo Calendario verás las actividades distribuidas en una cuadrícula por días, ideal para ver de un vistazo cómo de lleno está cada jornada y detectar días vacíos que necesitan más planificación.",
  },
  {
    id: "plan-explore", tab: "plan", target: '[data-tour="plan-explore-btn"]', placement: "bottom", emoji: "🧭",
    title: "Explorar el destino",
    body: "¿No sabes qué añadir? Pulsa Explorar para buscar en tiempo real restaurantes, museos, miradores, mercados o cualquier punto de interés cerca de tu destino usando OpenStreetMap. Con un clic añades el lugar al plan con su nombre y coordenadas ya rellenados.",
  },
  {
    id: "plan-history", tab: "plan", target: '[data-tour="plan-history-btn"]', placement: "bottom", emoji: "🕐",
    title: "Historial de cambios",
    body: "¿Alguien movió una actividad y no sabes quién? El historial muestra todos los cambios del plan: qué se añadió, editó o eliminó, quién lo hizo y cuándo. Útil en viajes de grupo para saber siempre qué ha cambiado desde la última vez que miraste el plan.",
  },
  {
    id: "plan-pdf", tab: "plan", target: '[data-tour="plan-pdf-btn"]', placement: "bottom", emoji: "📄",
    title: "Exportar a PDF",
    body: "Genera un PDF del itinerario completo con portada Kaviro: nombre del viaje, destino, fechas y todas las actividades organizadas por día con hora, lugar y descripción. Perfecto para imprimir antes de salir, enviar por email o compartir con alguien que no use la app.",
  },
  {
    id: "plan-calendar", tab: "plan", target: '[data-tour="plan-calendar-btn"]', placement: "bottom", emoji: "📅",
    title: "Añadir al calendario",
    body: "Exporta las actividades directamente a tu calendario. Al pulsar el botón aparece una lista con todas las actividades que tienen fecha y hora asignadas. Pulsa cualquiera para crear el evento en Google Calendar con un clic — o descarga el archivo .ics para importarlo en Apple Calendar u Outlook.",
  },
];
