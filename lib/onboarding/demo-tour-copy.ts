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
    body: "Este es tu viaje de demostración. En los próximos pasos te mostraré todas las funciones de la app, pestaña por pestaña. Puedes avanzar con Siguiente →, retroceder con ← y cerrar el tour con ✕ en cualquier momento.",
  },
  {
    id: "summary-topbar", tab: "summary", target: '[data-tour="topbar-bar"]', placement: "bottom", emoji: "🔧",
    title: "Barra superior",
    body: "La barra superior siempre visible tiene todo lo que necesitas para gestionar el viaje. A la izquierda el logo de Kaviro (vuelve a Mis Viajes), el nombre del viaje y la sección activa. A la derecha: el salvavidas 🛟 abre la ayuda, la campana 🔔 muestra la actividad reciente del grupo, los botones de acciones rápidas (copiar enlace, ir a Mis Viajes) y el toggle de modo oscuro/claro.",
  },
  {
    id: "summary-sidebar", tab: "summary", target: '[data-tour="sidebar-nav"]', placement: "right", emoji: "🗂️",
    title: "Navegación del viaje",
    body: "En el panel izquierdo tienes acceso a todas las secciones: Resumen, Plan, Rutas, Gastos, Gente, Docs y Asistente IA. La sección activa se resalta en oscuro. En móvil, la navegación aparece en la barra inferior de la pantalla con las secciones más usadas y un botón «Más» para el resto.",
  },
  {
    id: "summary-countdown", tab: "summary", target: '[data-tour="summary-countdown"]', placement: "bottom", emoji: "⏳",
    title: "Cuenta atrás y siguiente actividad",
    body: "Este bloque cambia según el momento del viaje. Antes de salir muestra cuántos días quedan con una cuenta atrás. Durante el viaje muestra en qué día estás, una barra de progreso y la siguiente actividad planificada con su hora y lugar. Una vez que el viaje termina, te invita a crear el Recap.",
  },
  {
    id: "summary-weather", tab: "summary", target: '[data-tour="summary-weather"]', placement: "bottom", emoji: "🌤️",
    title: "Clima del destino",
    body: "Kaviro obtiene automáticamente la previsión meteorológica del destino del viaje. Muestra el icono del tiempo, la temperatura máxima y mínima del día de hoy en tu destino. No hace falta salir de la app para saber qué ropa llevar mañana.",
  },
  {
    id: "summary-stats", tab: "summary", target: '[data-tour="summary-stats"]', placement: "bottom", emoji: "📊",
    title: "Módulos del viaje",
    body: "Tarjetas con el estado de cada módulo: actividades planificadas (con barra de completitud), gasto total del grupo, número de participantes y documentos guardados. Cada tarjeta es un acceso directo — pulsa cualquiera para ir directamente a esa sección.",
  },
  {
    id: "summary-recap", tab: "summary", target: '[data-tour="summary-recap-cta"]', placement: "top", emoji: "🎬",
    title: "Recap del viaje",
    body: "Al terminar el viaje pulsa aquí para generar una tarjeta visual con las estadísticas: días, actividades, km recorridos, participantes y foto del destino. Se puede compartir directamente por WhatsApp o descargar en formato Stories para Instagram.",
  },

  // ════════ PLAN — 7 pasos ════════

  {
    id: "plan-add", tab: "plan", target: '[data-tour="plan-add-btn"]', placement: "bottom", emoji: "➕",
    title: "Añadir actividades al plan",
    body: "Pulsa el botón + Añadir plan para crear una actividad. Escribe el nombre, busca el lugar en el mapa con autocompletado, asígnale una hora, duración y categoría (restaurante, museo, transporte...). El resto del grupo ve la actividad al instante en sus dispositivos.",
  },
  {
    id: "plan-card", tab: "plan", target: '[data-tour="plan-activity-card"]', placement: "right",
    action: "expand-days", emoji: "☰",
    title: "Gestionar actividades del día",
    body: "Pulsa la cabecera de cualquier día para expandir o contraer sus actividades. Dentro del día, cada tarjeta muestra la hora, el lugar y la categoría. Usa el icono ≡ para arrastrar y reordenar. Pulsa la tarjeta para editarla, cambiar la hora o eliminarla.",
  },
  {
    id: "plan-calendar-mode", tab: "plan", target: '[data-tour="plan-calendar-mode"]', placement: "bottom",
    action: "calendar-mode", emoji: "📆",
    title: "Vista Calendario",
    body: "Pulsa Calendario para cambiar la vista. En lugar de la lista de días, verás las actividades distribuidas en una cuadrícula de calendario mensual. Ideal para ver de un vistazo cómo de lleno está cada jornada, detectar días vacíos y comparar semanas enteras del viaje.",
  },
  {
    id: "plan-explore", tab: "plan", target: '[data-tour="plan-explore-btn"]', placement: "bottom", emoji: "🧭",
    title: "Explorar el destino",
    body: "¿No sabes qué añadir? Pulsa Explorar para buscar en tiempo real restaurantes, museos, miradores, mercados y puntos de interés cerca de tu destino usando OpenStreetMap. Con un clic añades el lugar al plan con su nombre y coordenadas ya rellenados automáticamente.",
  },
  {
    id: "plan-history", tab: "plan", target: '[data-tour="plan-history-btn"]', placement: "bottom", emoji: "🕐",
    title: "Historial de cambios",
    body: "¿Alguien cambió algo en el plan y no sabes quién? El Historial muestra todos los cambios con quién los hizo y cuándo: actividades añadidas, editadas, eliminadas o reordenadas. Muy útil en viajes de grupo para estar siempre al día.",
  },
  {
    id: "plan-pdf", tab: "plan", target: '[data-tour="plan-pdf-btn"]', placement: "bottom", emoji: "📄",
    title: "Exportar a PDF",
    body: "Genera un PDF del itinerario completo con portada Kaviro: nombre del viaje, destino, fechas y todas las actividades organizadas por día con hora, lugar y descripción. Perfecto para imprimir antes de salir o compartir con alguien que no use la app.",
  },
  {
    id: "plan-calendar", tab: "plan", target: '[data-tour="plan-calendar-btn"]', placement: "bottom", emoji: "📅",
    title: "Añadir al calendario",
    body: "Pulsa el botón Calendario para ver la lista de actividades con fecha y hora. Pulsa cualquiera y se abrirá Google Calendar con el evento ya creado: título, hora, duración estimada y dirección. También puedes descargar el archivo .ics para importarlo en Apple Calendar u Outlook.",
  },
];
