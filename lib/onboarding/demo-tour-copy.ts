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
    id: "plan-add", tab: "plan", target: '[data-tour="plan-add-btn"]', placement: "bottom", emoji: "➕",
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
    id: "plan-calendar-mode", tab: "plan", target: '[data-tour="plan-calendar-mode"]', placement: "bottom",
    action: "calendar-mode", emoji: "📆",
    title: "Vista Calendario",
    body: "Ahora estás viendo las actividades en modo Calendario. Ves todos los días del viaje en cuadrícula, ideal para detectar días vacíos y comparar jornadas de un vistazo. Pulsa Lista para volver a la vista anterior.",
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

  // ════════ RUTAS — 4 pasos ════════

  {
    id: "map-new-route", tab: "map", target: '[data-tour="map-new-route-btn"]', placement: "bottom", emoji: "🗺️",
    title: "Crear una ruta",
    body: "Pulsa Nueva ruta para diseñar un trayecto sobre el mapa. Elige origen, paradas intermedias y destino. Kaviro calcula la distancia y el tiempo estimado a pie, en coche o transporte. Cada ruta tiene su propio nombre y color.",
  },
  {
    id: "map-ai", tab: "map", target: '[data-tour="map-ai-btn"]', placement: "bottom", emoji: "✨",
    title: "Generar rutas con IA (Premium)",
    body: "El asistente analiza todas las actividades del día y genera automáticamente la ruta óptima conectándolas en el orden más eficiente. Ahorra horas de planificación y evita ir y volver al mismo barrio. Función disponible en el plan Premium.",
  },
  {
    id: "map-routes-list", tab: "map", target: '[data-tour="map-routes-list"]', placement: "bottom", emoji: "📋",
    title: "Lista de rutas",
    body: "Despliega esta sección para ver todas las rutas creadas del viaje. Cada ruta muestra su nombre, color, distancia y tiempo. Desde aquí puedes editar, duplicar o eliminar cada ruta. Pulsa una ruta para centrarla en el mapa.",
  },
  {
    id: "map-container", tab: "map", target: '[data-tour="map-container"]', placement: "top", emoji: "🌍",
    title: "Mapa interactivo",
    body: "El mapa muestra todas tus rutas dibujadas con sus colores. Haz zoom con la rueda del ratón o los botones + / −. Pulsa cualquier marcador para ver los datos de esa parada. En móvil usa dos dedos para hacer zoom y desplazarte.",
  },

  // ════════ GASTOS — 5 pasos ════════

  {
    id: "expenses-toolbar", tab: "expenses", target: '[data-tour="expenses-toolbar"]', placement: "bottom", emoji: "🔧",
    title: "Barra de gastos",
    body: "Cuatro acciones principales: Historial muestra todos los cambios de gastos y quién los hizo. Exportar CSV descarga todos los gastos en Excel. Añadir ticket abre el formulario para registrar un nuevo gasto. Analizar ticket (Premium) extrae datos de imágenes o PDFs de tickets automáticamente.",
  },
  {
    id: "expenses-list", tab: "expenses", target: '[data-tour="expenses-list-details"]', placement: "top",
    action: "expand-expenses", emoji: "📋",
    title: "Listado de gastos",
    body: "Despliega para ver todos los tickets registrados del viaje. Cada gasto muestra el importe, quién pagó, la categoría y entre quiénes se divide. Pulsa cualquier gasto para editarlo o eliminar. Puedes filtrar por persona o categoría.",
  },
  {
    id: "expenses-currency", tab: "expenses", target: '[data-tour="expenses-currency-details"]', placement: "top",
    action: "expand-currency", emoji: "💱",
    title: "Convertidor de moneda",
    body: "Despliega para convertir importes entre divisas al tipo de cambio actual. También puedes cambiar aquí la moneda principal del balance — si el viaje es en libras pero tú prefieres ver los totales en euros, cámbialo aquí.",
  },
  {
    id: "expenses-balance", tab: "expenses", target: '[data-tour="expenses-balance-panel"]', placement: "top", emoji: "⚖️",
    title: "Balances y pagos",
    body: "Kaviro calcula automáticamente quién debe dinero a quién. La pestaña Balances muestra el resumen por persona. La pestaña Métodos de pago permite configurar el Bizum, PayPal o cuenta bancaria de cada participante para que los enlaces de pago vayan directos.",
  },
  {
    id: "expenses-stats", tab: "expenses", target: '[data-tour="expenses-stats-btn"]', placement: "bottom", emoji: "📊",
    title: "Estadísticas de gastos",
    body: "Pulsa Estadísticas para ver gráficos del gasto: distribución por categoría (restaurantes, transporte, alojamiento...), gasto por persona y evolución diaria del presupuesto. Muy útil para saber en qué se va el dinero y comparar con el presupuesto previsto.",
  },

  // ════════ GENTE — 3 pasos ════════

  {
    id: "participants-add", tab: "participants", target: '[data-tour="participants-add-btn"]', placement: "bottom", emoji: "👤",
    title: "Añadir pasajero",
    body: "Pulsa Añadir pasajero para crear un participante manualmente: nombre, correo y rol en el viaje. Útil cuando quieres apuntar a alguien que aún no tiene cuenta en Kaviro. Después puedes enviarle el enlace de invitación para que vincule su perfil.",
  },
  {
    id: "participants-invite", tab: "participants", target: '[data-tour="participants-invite-btn"]', placement: "bottom", emoji: "📨",
    title: "Invitar por WhatsApp",
    body: "Genera un enlace único y ábrelo directamente en WhatsApp. El invitado pulsa el enlace, inicia sesión o se registra en Kaviro y queda vinculado automáticamente al viaje. Puedes asignarle el rol antes de enviar: Gestor, Editor, Colaborador o Visor.",
  },
  {
    id: "participants-qr", tab: "participants", target: '[data-tour="participants-qr"]', placement: "top", emoji: "📱",
    title: "Código QR de invitación",
    body: "En el aeropuerto o la reunión previa al viaje, muestra el QR y todos pueden unirse al instante escaneando con la cámara del móvil. Sin buscar el enlace, sin copiar y pegar. El QR lleva a la misma página de invitación que el enlace de WhatsApp.",
  },

  // ════════ DOCS — 3 pasos ════════

  {
    id: "resources-lists", tab: "resources", target: '[data-tour="resources-lists-section"]', placement: "bottom", emoji: "📝",
    title: "Crear y ver listas",
    body: "Pulsa Crear/ver listas para gestionar listas compartidas del viaje: maleta, lista de compras, documentos pendientes, cosas que no hay que olvidar. Cada lista puede ser privada (solo tú) o compartida con todo el grupo. Los participantes pueden marcar ítems como completados.",
  },
  {
    id: "resources-upload", tab: "resources", target: '[data-tour="resources-upload-btn"]', placement: "bottom", emoji: "📎",
    title: "Adjuntar documento",
    body: "Sube PDFs o imágenes de reservas de hotel, billetes de avión o tren, entradas a museos o cualquier documento del viaje. Todos los participantes pueden verlos y descargarlos desde sus dispositivos. Nunca más buscar en el email en el aeropuerto.",
  },
  {
    id: "resources-analyze", tab: "resources", target: '[data-tour="resources-analyze-btn"]', placement: "bottom", emoji: "🔍",
    title: "Analizar documento (Premium)",
    body: "Sube una foto o PDF de una reserva y Kaviro extrae automáticamente los datos: tipo de documento, nombre del hotel, fechas, número de confirmación y dirección. Los datos se guardan directamente como recurso del viaje sin tener que rellenar nada a mano.",
  },

  // ════════ ASISTENTE IA — 2 pasos ════════

  {
    id: "ai-input", tab: "ai-chat", target: '[data-tour="ai-input"]', placement: "top", emoji: "💬",
    title: "Pregunta lo que quieras",
    body: "Escribe en lenguaje natural lo que necesitas: 'Crea un plan completo para el martes', 'Sugiere restaurantes vegetarianos cerca del centro', 'Reorganiza el itinerario para reducir desplazamientos' o '¿Qué hacer en Londres con lluvia?'. El asistente conoce tu destino, fechas, actividades y presupuesto.",
  },
  {
    id: "ai-suggestions", tab: "ai-chat", target: '[data-tour="ai-suggestions"]', placement: "bottom", emoji: "⚡",
    title: "Modo del asistente",
    body: "El asistente cambia de contexto según la sección donde estés. El modo activo aparece aquí como una píldora de color. Puedes pedirle que planifique actividades, analice gastos, sugiera rutas o responda preguntas sobre el destino. ¡El tour ha terminado — ya conoces Kaviro completo!",
  },
];
