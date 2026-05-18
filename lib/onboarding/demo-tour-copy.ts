import type { TourStep } from "@/components/trip/common/trip-tour-types";
import { tripTabDocsImageClass } from "@/lib/trip-tab-assets";

/**
 * Recorrido guiado del viaje demo de Londres.
 * 7 pasos — uno por pestaña principal.
 * Cada paso explica QUÉ es la sección, QUÉ puede hacer el usuario y un tip para móvil.
 */
export const DEMO_TAB_TOUR: TourStep[] = [
  {
    id: "home",
    title: "Resumen",
    lead: "🏠 Paso 1 de 7 · Empezamos aquí",
    body: "El Resumen es la pantalla de entrada de cada viaje. Ves de un vistazo las fechas, quién viaja, cuántas actividades hay y el estado del presupuesto. También encontrarás el acceso al Recap cuando el viaje termine. En este demo hay 3 participantes de ejemplo y un plan de 3 días por Londres.",
    mobileTip: "En móvil, usa el menú inferior para moverte entre secciones. El botón ⋯ agrupa las secciones secundarias.",
    href: (id) => `/trip/${id}/summary`,
    visual: { type: "image", tabKey: "summary", alt: "Resumen" },
  },
  {
    id: "plan",
    title: "Plan",
    lead: "📅 Paso 2 de 7 · El corazón del viaje",
    body: "Aquí vive el itinerario: actividades ordenadas por día y hora, con lugar, duración y notas. Puedes arrastrar para reordenar, añadir con el botón +, explorar lugares cercanos en el mapa o exportar el plan como PDF con portada Kaviro. En tu viaje real, todos los participantes ven los cambios al instante.",
    mobileTip: "Pulsa el botón ⋯ junto al FAB para acceder a Explorar, Historial y exportar PDF desde el móvil.",
    href: (id) => `/trip/${id}/plan`,
    visual: { type: "image", tabKey: "plan", alt: "Plan" },
  },
  {
    id: "map",
    title: "Rutas",
    lead: "🗺️ Paso 3 de 7 · Visualiza los trayectos",
    body: "Conecta las paradas del plan sobre un mapa interactivo. Kaviro calcula la distancia y el tiempo estimado de cada tramo — a pie, en coche o transporte. El demo tiene una ruta de paseo por el centro de Londres. En tu viaje puedes crear tantas rutas como necesites y verlas todas a la vez.",
    mobileTip: "Usa dos dedos para hacer zoom en el mapa. Toca una ruta para ver sus detalles.",
    href: (id) => `/trip/${id}/map`,
    visual: { type: "image", tabKey: "map", alt: "Rutas" },
  },
  {
    id: "expenses",
    title: "Gastos",
    lead: "💶 Paso 4 de 7 · Sin pelearos con Excel",
    body: "Registra tickets y gastos del grupo, divídelos por participante y Kaviro calcula automáticamente quién debe qué a quién. El demo tiene gastos en GBP, EUR y USD — la moneda base es la libra y los balances se convierten al instante. Hay un conversor de divisas integrado y puedes exportar todo como CSV para Excel.",
    mobileTip: "Los botones Editar y Eliminar aparecen al expandir cada gasto. Mantén pulsado para ver opciones rápidas.",
    href: (id) => `/trip/${id}/expenses`,
    visual: { type: "image", tabKey: "expenses", alt: "Gastos" },
  },
  {
    id: "participants",
    title: "Gente",
    lead: "👥 Paso 5 de 7 · Viajad juntos",
    body: "Invita a tu grupo con un enlace o código QR. Cada persona puede tener un rol diferente: quién edita el plan, quién gestiona gastos, quién solo mira. El demo tiene a Ana, Luis y María como viajeros de ejemplo. En tu viaje real recibirán una notificación cuando alguien edite el plan.",
    mobileTip: "El punto rojo en el icono de Gente avisa cuando alguien nuevo se ha unido al viaje.",
    href: (id) => `/trip/${id}/participants`,
    visual: { type: "image", tabKey: "participants", alt: "Participantes" },
  },
  {
    id: "resources",
    title: "Docs",
    lead: "📎 Paso 6 de 7 · Todo en un lugar",
    body: "Guarda reservas de hotel, billetes de tren, entradas a museos y cualquier documento del viaje. Puedes añadir reservas con los datos del alojamiento (nombre, dirección, fechas, confirmación) o subir PDFs directamente. Todos los participantes tienen acceso. El asistente IA Premium puede escanear y extraer datos de tickets automáticamente.",
    mobileTip: "Toca un documento para abrirlo. Mantén pulsado para ver opciones de edición o borrado.",
    href: (id) => `/trip/${id}/resources`,
    visual: { type: "image", tabKey: "resources", alt: "Documentos", imageClassName: tripTabDocsImageClass },
  },
  {
    id: "ai",
    title: "Asistente IA",
    lead: "✨ Paso 7 de 7 · Tu planificador inteligente",
    body: "El Asistente IA conoce todo tu viaje: destino, fechas, participantes, presupuesto y actividades ya planificadas. Puedes pedirle que sugiera actividades para un día libre, que cree un itinerario completo, que resuelva dudas sobre el destino o que detecte huecos en el plan. Con Premium tienes acceso ilimitado. ¡Ya has visto todo Kaviro — empieza tu primer viaje real!",
    mobileTip: "El asistente es opcional — Kaviro funciona perfectamente sin IA para organizar el grupo.",
    href: (id) => `/trip/${id}/ai-chat`,
    visual: { type: "image", tabKey: "chat", alt: "Asistente" },
  },
];
