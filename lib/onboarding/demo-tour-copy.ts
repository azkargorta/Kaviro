import type { TourStep, SpotlightStep } from "@/components/trip/common/trip-tour-types";
import { tripTabDocsImageClass } from "@/lib/trip-tab-assets";

export const DEMO_TAB_TOUR: TourStep[] = [
  { id: "home", title: "Resumen", lead: "🏠", body: "Vista general.", mobileTip: "", href: (id) => `/trip/${id}/summary`, visual: { type: "image", tabKey: "summary", alt: "Resumen" } },
  { id: "plan", title: "Plan", lead: "📅", body: "Itinerario coral por días, IA sugiere y RSVP.", mobileTip: "", href: (id) => `/trip/${id}/plan`, visual: { type: "image", tabKey: "plan", alt: "Plan" } },
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
    body: "Este es tu viaje de demostración (Londres). Te guiaré por todas las pestañas con datos de ejemplo. Usa Siguiente →, Anterior ← o cierra con ✕. Si sales, vuelve desde Mis viajes → «Iniciar tour» o el botón 🗺️ Tour en cualquier pestaña del demo.",
  },
  {
    id: "summary-hero-toolbar", tab: "summary", target: '[data-tour="trip-hero-toolbar"]', placement: "bottom", emoji: "🔧",
    title: "Barra del viaje (arriba)",
    body: "A la izquierda, el logo Kaviro vuelve al panel; en el centro, destino y nombre del viaje. A la derecha: salvavidas 🛟 (ayuda y tour), campana 🔔, modo oscuro y menú 👤. Debajo, compartir el plan y «Mis viajes» (blanco y coral) en la misma fila.",
  },
  {
    id: "summary-feed", tab: "summary", target: '[data-tour="topbar-novedades"]', placement: "bottom", emoji: "🔔",
    title: "Novedades del viaje",
    body: "La campana 🔔 abre el feed de actividad del grupo: cambios en el plan, nuevos gastos, invitaciones y reacciones RSVP. El punto rojo indica avisos sin leer; pulsa un evento para ir directo a esa sección.",
  },
  {
    id: "summary-sidebar", tab: "summary", target: '[data-tour="sidebar-nav"]', targetAlt: '[data-tour="mobile-bottom-nav"]', placement: "top", emoji: "🗂️",
    title: "Navegación del viaje",
    body: "En escritorio: menú lateral con Resumen, Plan, Rutas, Gastos, Gente, Docs y Asistente IA. En móvil: barra inferior (Inicio, Plan, Gastos, IA) y «Más» para Rutas, Gente, Docs y Ajustes.",
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
    id: "summary-search", tab: "summary", target: '[data-tour="summary-search-travel"]', targetAlt: '[data-tour="summary-search-toggle"]', placement: "top", action: "open-summary-search", emoji: "🔎",
    title: "Buscar hotel y transporte",
    body: "Desde el resumen puedes abrir búsquedas con los datos del viaje ya rellenados: hotel, vuelo, tren, ferry, autobús o coche de alquiler. Elige categoría y pulsa una plataforma (Booking, Google Flights, Omio, etc.) para reservar en su web.",
  },
  {
    id: "summary-recap", tab: "summary", target: '[data-tour="summary-recap-cta"]', placement: "top", emoji: "🎬",
    title: "Recap del viaje",
    body: "Al terminar el viaje, genera una tarjeta visual con estadísticas: días, actividades, km recorridos y foto del destino. Se comparte directamente por WhatsApp o se descarga en formato Stories para Instagram.",
  },

  // ════════ PLAN — 5 pasos ════════

  {
    id: "plan-add", tab: "plan", target: '[data-tour="plan-toolbar"]', placement: "bottom", emoji: "➕",
    title: "Añadir y gestionar el plan",
    body: "Pulsa + Añadir plan para crear una actividad: nombre, lugar con autocompletado, hora, categoría y valoración. Al guardar puedes elegir quién la ve: todo el viaje, solo tú o participantes concretos. La barra incluye 🧭 Explorar, 🕐 Historial, 📄 PDF y 📅 Calendario (Google, Apple o .ics).",
  },
  {
    id: "plan-itinerary", tab: "plan", target: '[data-tour="plan-itinerary-highlight"]', placement: "bottom", emoji: "📋",
    title: "Itinerario del día",
    body: "La cabecera coral concentra el viaje: destino, avatares del grupo y botones Añadir plan e IA sugiere. Debajo, las pestañas por día (con flechas si hay muchos días) cambian la agenda sin salir del plan. Más abajo verás las actividades y el resumen de gastos del grupo.",
  },
  {
    id: "plan-ai-suggest", tab: "plan", target: '[data-tour="plan-ai-suggest"]', placement: "bottom", emoji: "✨",
    title: "IA sugiere (Premium)",
    body: "Desde la cabecera del itinerario, IA sugiere analiza todo el plan: detecta huecos, solapes y propone mejoras aplicables. Abre el asistente en modo optimizador con el contexto del día que estés viendo. Disponible con Premium.",
  },
  {
    id: "plan-card", tab: "plan", target: '[data-tour="plan-activity-card"]', placement: "right", emoji: "☰",
    title: "Filas de actividad",
    body: "Cada fila compacta muestra hora, lugar y tipo de actividad. Arrastra con ≡ para reordenar el día. Pulsa una fila para editar o abrir el detalle: ahí verás valoraciones, comentarios y RSVP (¿Te apuntas? / No / Quizá) con contadores del grupo.",
  },
  {
    id: "plan-calendar-mode", tab: "plan", target: '[data-tour="plan-calendar-mode"]', placement: "bottom",
    action: "calendar-mode", emoji: "📆",
    title: "Vista Calendario",
    body: "Alterna entre Lista y Calendario con este botón. La vista de cuadrícula es ideal para detectar días vacíos y comparar jornadas de un vistazo. Pulsa Lista para volver a la vista anterior.",
  },

  // ════════ RUTAS — 4 pasos ════════

  {
    id: "map-new-route", tab: "map", target: '[data-tour="map-new-route-btn"]', placement: "bottom", emoji: "🗺️",
    title: "Crear una ruta",
    body: "Pulsa Nueva ruta para diseñar un trayecto sobre el mapa. Elige origen, paradas intermedias y destino. Kaviro calcula la distancia y el tiempo estimado a pie, en coche o transporte. Cada ruta tiene su propio nombre y color.",
  },
  {
    id: "map-ai", tab: "map", target: '[data-tour="map-ai-section"]', targetAlt: '[data-tour="map-ai-btn"]',
    action: "open-map-auto-routes", placement: "bottom", emoji: "✨",
    title: "Generar rutas con IA (Premium)",
    body: "En «Crear rutas automáticamente» pulsa Abrir, indica preferencias de transporte y luego Crear rutas. La IA enlaza tus planes del día (o del viaje) en un borrador que revisas antes de guardar. Requiere Premium.",
  },
  {
    id: "map-routes-list", tab: "map", target: '[data-tour="map-routes-list-panel"]', placement: "top", emoji: "📋",
    title: "Lista de rutas",
    body: "Despliega esta sección para ver todas las rutas creadas del viaje. Cada ruta muestra su nombre, color, distancia y tiempo. Desde aquí puedes editar, duplicar o eliminar cada ruta. Pulsa una ruta para centrarla en el mapa.",
  },
  {
    id: "map-container", tab: "map", target: '[data-tour="map-container"]', placement: "top", emoji: "🌍",
    title: "Mapa interactivo",
    body: "El mapa muestra todas tus rutas dibujadas con sus colores. Haz zoom con la rueda del ratón o los botones + / −. Pulsa cualquier marcador para ver los datos de esa parada. En móvil usa dos dedos para hacer zoom y desplazarte.",
  },

  // ════════ GASTOS — 6 pasos ════════

  {
    id: "expenses-toolbar", tab: "expenses", target: '[data-tour="expenses-toolbar"]', placement: "bottom", emoji: "🔧",
    title: "Barra de gastos",
    body: "Cuatro acciones principales: Historial muestra todos los cambios de gastos y quién los hizo. Exportar CSV descarga todos los gastos en Excel. Añadir ticket abre el formulario para registrar un nuevo gasto. Analizar ticket (Premium) extrae datos de imágenes o PDFs de tickets automáticamente.",
  },
  {
    id: "expenses-list", tab: "expenses", target: '[data-tour="expenses-list-details"]', placement: "top",
    action: "open-expenses-list", emoji: "📋",
    title: "Listado de gastos",
    body: "Despliega para ver todos los tickets registrados del viaje. Cada gasto muestra el importe, quién pagó, la categoría y entre quiénes se divide. Pulsa cualquier gasto para editarlo o eliminar. Puedes filtrar por persona o categoría.",
  },
  {
    id: "expenses-currency", tab: "expenses", target: '[data-tour="expenses-currency-details"]', placement: "top",
    action: "open-expenses-currency", emoji: "💱",
    title: "Convertidor de moneda",
    body: "Despliega para convertir importes entre divisas al tipo de cambio actual. También puedes cambiar aquí la moneda principal del balance — si el viaje es en libras pero tú prefieres ver los totales en euros, cámbialo aquí.",
  },
  {
    id: "expenses-balance", tab: "expenses", target: '[data-tour="expenses-balance-panel"]', placement: "top", emoji: "⚖️",
    title: "Balances y pagos",
    body: "Kaviro calcula automáticamente quién debe dinero a quién. La pestaña Balances muestra el resumen por persona. La pestaña Métodos de pago permite configurar el Bizum, PayPal o cuenta bancaria de cada participante para que los enlaces de pago vayan directos.",
  },
  {
    id: "expenses-stats", tab: "expenses", target: '[data-tour="expenses-stats-btn"]', placement: "bottom",
    action: "open-expenses-stats", emoji: "📊",
    title: "Estadísticas de gastos",
    body: "Pulsa Estadísticas para ver gráficos del gasto: distribución por categoría (restaurantes, transporte, alojamiento...), gasto por persona y evolución diaria del presupuesto. Muy útil para saber en qué se va el dinero y comparar con el presupuesto previsto.",
  },
  {
    id: "expenses-stats-charts", tab: "expenses", target: '[data-tour="expenses-stats-charts"]', placement: "top", emoji: "🥧",
    title: "Desglose de estadísticas",
    body: "El primer gráfico de rosca muestra el reparto del gasto por categoría: cada sector es un tipo de gasto con su porcentaje e importe. Debajo, las barras horizontales indican cuánto ha pagado cada persona del grupo. Si el viaje abarca más de un mes, aparece un tercer gráfico con la evolución mensual del presupuesto.",
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
    id: "participants-qr", tab: "participants", target: '[data-tour="participants-qr"]', placement: "top",
    action: "open-participants-qr", emoji: "📱",
    title: "Código QR de invitación",
    body: "Tras pulsar Invitar por WhatsApp aparece el panel con enlace y QR. En el aeropuerto o la reunión previa al viaje muéstralo en pantalla: todos escanean con la cámara y entran al viaje sin copiar enlaces.",
  },

  // ════════ DOCS — 3 pasos ════════

  {
    id: "resources-lists", tab: "resources", target: '[data-tour="resources-lists-section"]', placement: "bottom",
    action: "open-resources-lists", emoji: "📝",
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

  // ════════ ASISTENTE IA — 3 pasos ════════

  {
    id: "ai-history", tab: "ai-chat", target: '[data-tour="ai-history"]', placement: "right", emoji: "🕐",
    title: "Historial de conversaciones",
    body: "Kaviro guarda todas tus conversaciones con el asistente. Pulsa cualquier conversación del historial para retomar el hilo. Crea una nueva con el botón Nueva para empezar un tema diferente. Los chats se organizan automáticamente por fecha y modo.",
  },
  {
    id: "ai-input", tab: "ai-chat", target: '[data-tour="ai-input"]', placement: "top", emoji: "💬",
    title: "Pregunta lo que quieras",
    body: "Escribe en lenguaje natural lo que necesitas: 'Crea un plan completo para el martes', 'Sugiere restaurantes vegetarianos cerca del centro', 'Reorganiza el itinerario para reducir desplazamientos' o '¿Qué hacer en Londres con lluvia?'. El asistente conoce tu destino, fechas, actividades y presupuesto.",
  },
  {
    id: "ai-suggestions", tab: "ai-chat", target: '[data-tour="ai-suggestions"]', placement: "bottom", emoji: "⚡",
    title: "Modos del asistente",
    body: "Elige el foco del chat: Planificador, Desplazamientos (un día), Buscar (hoteles y transporte con enlaces), Documentos (visados y requisitos), o chat general. Premium desbloquea itinerarios ejecutables y análisis avanzados. ¡Tour completado — ya conoces Kaviro!",
  },
];

export const DEMO_SPOTLIGHT_STEP_COUNT = DEMO_SPOTLIGHT_TOUR.length;
