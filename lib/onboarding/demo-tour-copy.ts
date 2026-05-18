import type { TourStep, SpotlightStep } from "@/components/trip/common/trip-tour-types";
import { tripTabDocsImageClass } from "@/lib/trip-tab-assets";

export const DEMO_TAB_TOUR: TourStep[] = [
  { id: "home", title: "Resumen", lead: "🏠", body: "Vista general.", mobileTip: "", href: (id) => `/trip/${id}/summary`, visual: { type: "image", tabKey: "summary", alt: "Resumen" } },
  { id: "plan", title: "Plan", lead: "📅", body: "Itinerario.", mobileTip: "", href: (id) => `/trip/${id}/plan`, visual: { type: "image", tabKey: "plan", alt: "Plan" } },
  { id: "map", title: "Rutas", lead: "🗺️", body: "Mapa.", mobileTip: "", href: (id) => `/trip/${id}/map`, visual: { type: "image", tabKey: "map", alt: "Rutas" } },
  { id: "expenses", title: "Gastos", lead: "💶", body: "Gastos.", mobileTip: "", href: (id) => `/trip/${id}/expenses`, visual: { type: "image", tabKey: "expenses", alt: "Gastos" } },
  { id: "participants", title: "Gente", lead: "👥", body: "Participantes.", mobileTip: "", href: (id) => `/trip/${id}/participants`, visual: { type: "image", tabKey: "participants", alt: "Participantes" } },
  { id: "resources", title: "Docs", lead: "📎", body: "Documentos.", mobileTip: "", href: (id) => `/trip/${id}/resources`, visual: { type: "image", tabKey: "resources", alt: "Documentos", imageClassName: tripTabDocsImageClass } },
  { id: "ai", title: "Asistente IA", lead: "✨", body: "Asistente.", mobileTip: "", href: (id) => `/trip/${id}/ai-chat`, visual: { type: "image", tabKey: "chat", alt: "Asistente" } },
];

export const DEMO_SPOTLIGHT_TOUR: SpotlightStep[] = [

  // ════════ RESUMEN — 7 pasos ════════

  {
    id: "welcome", tab: "summary", target: null, placement: "center", emoji: "👋",
    title: "Bienvenido a Kaviro",
    body: "Este es tu viaje de demostración. En los próximos pasos te mostraré todas las funciones pestaña por pestaña. Avanza con Siguiente →, retrocede con ← y cierra el tour con ✕ en cualquier momento. ¡Empezamos!",
  },
  {
    id: "summary-topbar", tab: "summary", target: '[data-tour="topbar-bar"]', placement: "bottom", emoji: "🔧",
    title: "Barra superior",
    body: "Siempre visible en la parte superior. A la izquierda: el logo de Kaviro (vuelve a Mis Viajes), el nombre del viaje y la sección activa. A la derecha: el salvavidas 🛟 abre la ayuda contextual, la campana 🔔 muestra la actividad reciente del grupo, acciones rápidas como copiar el enlace del viaje o volver a Mis Viajes, y el toggle de modo oscuro/claro.",
  },
  {
    id: "summary-sidebar", tab: "summary", target: '[data-tour="sidebar-nav"]', placement: "right", emoji: "🗂️",
    title: "Navegación del viaje",
    body: "Acceso directo a las 7 secciones: Resumen, Plan, Rutas, Gastos, Gente, Docs y Asistente IA. La activa se resalta. En móvil aparece como barra inferior con las secciones más usadas y un botón «Más» para el resto.",
  },
  {
    id: "summary-countdown", tab: "summary", target: '[data-tour="summary-countdown"]', placement: "right", emoji: "⏳",
    title: "Cuenta atrás y próxima actividad",
    body: "Antes del viaje muestra la cuenta atrás con los días que quedan. Durante el viaje muestra los días restantes y la barra de progreso. Al final del card aparece la próxima actividad planificada con su hora, lugar y un botón para ver cómo llegar directamente en Google Maps.",
  },
  {
    id: "summary-weather", tab: "summary", target: '[data-tour="summary-weather"]', placement: "left", emoji: "🌤️",
    title: "Clima del destino",
    body: "Previsión meteorológica del destino actualizada automáticamente. Muestra el tiempo de hoy resaltado con temperatura máxima y mínima, y la previsión de los próximos días con icono del tiempo, temperaturas y probabilidad de lluvia. Sin salir de la app.",
  },
  {
    id: "summary-stats", tab: "summary", target: '[data-tour="summary-stats"]', placement: "top", emoji: "📊",
    title: "Tarjetas de módulos",
    body: "Acceso rápido al estado de cada módulo del viaje. Cada tarjeta muestra el dato más relevante: actividades planificadas, gastos del grupo, participantes y documentos. Pulsa cualquier tarjeta para ir directamente a esa sección.",
  },
  {
    id: "summary-recap", tab: "summary", target: '[data-tour="summary-recap-cta"]', placement: "top", emoji: "🎬",
    title: "Recap del viaje",
    body: "Al terminar el viaje, genera una tarjeta visual con estadísticas: días, actividades, km recorridos y foto del destino. Se comparte directamente por WhatsApp o se descarga en formato Stories para Instagram.",
  },

  // ════════ PLAN — 7 pasos ════════

  {
    id: "plan-add", tab: "plan", target: '[data-tour="plan-toolbar"]', placement: "bottom", emoji: "➕",
    title: "Añadir actividades al plan",
    body: "Pulsa + Añadir plan para crear una actividad: escribe el nombre, busca el lugar en el mapa con autocompletado, asígnale hora, duración y categoría. También puedes darle una valoración de 1 a 5 estrellas y añadir un comentario — en este demo verás que algunas actividades ya tienen su reseña.",
  },
  {
    id: "plan-card", tab: "plan", target: '[data-tour="plan-activity-card"]', placement: "right",
    action: "expand-days", emoji: "☰",
    title: "Gestionar actividades del día",
    body: "Pulsa la cabecera de un día para expandir o contraer sus actividades. Cada tarjeta muestra hora, lugar, categoría, valoración con estrellas y comentario. Usa el icono ≡ para arrastrar y reordenar. Pulsa la tarjeta para editar cualquier dato.",
  },
  {
    id: "plan-calendar-mode", tab: "plan", target: '[data-tour="plan-calendar-grid"]', placement: "top",
    action: "calendar-mode", emoji: "📆",
    title: "Vista Calendario",
    body: "Ahora estás viendo el calendario completo del viaje. Cada día muestra las actividades planificadas. Esta vista es ideal para ver de un vistazo cómo de lleno está cada jornada, detectar días vacíos y comparar semanas enteras. Pulsa el botón Lista en la barra de arriba para volver a la vista por días.",
  },
  {
    id: "plan-explore", tab: "plan", target: '[data-tour="plan-explore-btn"]', placement: "bottom", emoji: "🧭",
    title: "Explorar el destino",
    body: "Busca en tiempo real restaurantes, museos, miradores y puntos de interés cerca de tu destino usando OpenStreetMap. Con un clic añades el lugar al plan con nombre y coordenadas ya rellenados.",
  },
  {
    id: "plan-history", tab: "plan", target: '[data-tour="plan-history-btn"]', placement: "bottom", emoji: "🕐",
    title: "Historial de cambios",
    body: "Muestra todos los cambios del plan: qué actividad se añadió, editó, eliminó o reordenó, quién lo hizo y cuándo. Muy útil en viajes de grupo para saber siempre qué ha cambiado desde la última vez que miraste.",
  },
  {
    id: "plan-pdf", tab: "plan", target: '[data-tour="plan-pdf-btn"]', placement: "bottom", emoji: "📄",
    title: "Exportar a PDF",
    body: "Genera un PDF con portada Kaviro: nombre del viaje, destino, fechas y actividades organizadas por día con hora, lugar y descripción. Perfecto para imprimir antes de salir o compartir con alguien sin la app.",
  },
  {
    id: "plan-calendar", tab: "plan", target: '[data-tour="plan-calendar-btn"]', placement: "bottom", emoji: "📅",
    title: "Añadir al calendario",
    body: "Lista todas las actividades con fecha y hora. Pulsa cualquiera para crear el evento en Google Calendar con un clic — título, hora, duración y dirección ya rellenados. También puedes descargar el archivo .ics para Apple Calendar u Outlook.",
  },
];
