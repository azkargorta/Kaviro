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

export const DEMO_SPOTLIGHT_TOUR: SpotlightStep[] = [
  // RESUMEN
  { id: "summary-1", tab: "home", target: '[data-tour="summary-stats"]', placement: "bottom", emoji: "📊", title: "Estadísticas del viaje", body: "Días, actividades, participantes y km planificados. Se actualizan en tiempo real cuando el grupo edita el plan." },
  { id: "summary-2", tab: "home", target: '[data-tour="summary-recap-cta"]', placement: "top", emoji: "🎬", title: "Recap del viaje", body: "Al terminar, genera una tarjeta visual con estadísticas para compartir por WhatsApp o Instagram Stories." },
  // PLAN
  { id: "plan-1", tab: "plan", target: '[data-tour="plan-add-btn"]', placement: "bottom", emoji: "➕", title: "Añadir actividad", body: "Crea una actividad con título, lugar en el mapa, hora y notas. El grupo la verá al instante." },
  { id: "plan-2", tab: "plan", target: '[data-tour="plan-activity-card"]', placement: "right", emoji: "☰", title: "Reordenar actividades", body: "Mantén pulsado el icono ≡ y arrastra la tarjeta a otro momento del día. El orden se guarda automáticamente." },
  { id: "plan-3", tab: "plan", target: '[data-tour="plan-explore-btn"]', placement: "bottom", emoji: "🧭", title: "Explorar lugares", body: "Busca restaurantes, museos o puntos de interés cercanos y añádelos directamente al plan con un clic." },
  { id: "plan-4", tab: "plan", target: '[data-tour="plan-pdf-btn"]', placement: "bottom", emoji: "📄", title: "Exportar PDF", body: "Genera un PDF del itinerario con portada Kaviro. Perfecto para imprimir o compartir antes del viaje." },
  { id: "plan-5", tab: "plan", target: '[data-tour="plan-calendar-btn"]', placement: "bottom", emoji: "📅", title: "Añadir al calendario", body: "Exporta cada actividad directamente a Google Calendar, Apple Calendar u Outlook." },
  // RUTAS
  { id: "map-1", tab: "map", target: '[data-tour="map-new-route-btn"]', placement: "bottom", emoji: "🗺️", title: "Crear una ruta", body: "Dibuja el trayecto entre paradas a pie, en coche o transporte. Kaviro calcula distancia y tiempo." },
  { id: "map-2", tab: "map", target: '[data-tour="map-ai-btn"]', placement: "bottom", emoji: "✨", title: "Rutas con IA", body: "El asistente genera rutas óptimas conectando todas tus actividades del día. Ahorra horas de planificación." },
  // GASTOS
  { id: "expenses-1", tab: "expenses", target: '[data-tour="expenses-add-btn"]', placement: "bottom", emoji: "💶", title: "Registrar un gasto", body: "Añade importe, quién pagó y entre quiénes se divide. Funciona con cualquier moneda." },
  { id: "expenses-2", tab: "expenses", target: '[data-tour="expenses-balance"]', placement: "top", emoji: "⚖️", title: "Balance automático", body: "Kaviro calcula quién debe dinero a quién. Al final del viaje todos saben exactamente qué transferir." },
  { id: "expenses-3", tab: "expenses", target: '[data-tour="expenses-csv-btn"]', placement: "bottom", emoji: "📥", title: "Exportar CSV", body: "Descarga todos los gastos en Excel. Útil para contabilidad o para compartir el resumen con el grupo." },
  // PARTICIPANTES
  { id: "participants-1", tab: "participants", target: '[data-tour="participants-invite-btn"]', placement: "bottom", emoji: "📨", title: "Invitar al grupo", body: "Comparte el enlace por WhatsApp. El invitado elige su rol: puede editar el plan o solo ver." },
  { id: "participants-2", tab: "participants", target: '[data-tour="participants-qr"]', placement: "top", emoji: "📱", title: "Código QR", body: "En el aeropuerto o reunión previa, escanea el QR para unirte al viaje sin buscar el enlace." },
  // DOCS
  { id: "resources-1", tab: "resources", target: '[data-tour="resources-add-btn"]', placement: "bottom", emoji: "📎", title: "Subir documentos", body: "Sube PDFs de reservas, billetes o entradas. Todos los participantes pueden verlos y descargarlos." },
  { id: "resources-2", tab: "resources", target: '[data-tour="resources-lodging-btn"]', placement: "bottom", emoji: "🏨", title: "Guardar alojamiento", body: "Añade los datos del hotel: nombre, dirección, check-in, check-out y código de reserva." },
  // IA
  { id: "ai-1", tab: "ai", target: '[data-tour="ai-input"]', placement: "top", emoji: "💬", title: "Pregunta lo que quieras", body: "Escribe en lenguaje natural: 'Crea un plan para el martes' o 'Reorganiza el itinerario del jueves'." },
  { id: "ai-2", tab: "ai", target: '[data-tour="ai-suggestions"]', placement: "bottom", emoji: "⚡", title: "Sugerencias rápidas", body: "Pulsa cualquier sugerencia para hacer la pregunta al instante. Kaviro conoce todo el contexto del viaje." },
];
