import { APP_NAME } from "@/lib/brand";

export type SeoLandingFaq = { q: string; a: string };
export type SeoLandingBenefit = { icon: string; title: string; description: string };
export type SeoLandingRelated = { href: string; label: string; description: string };

export type SeoLandingPageData = {
  slug: string;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
  hero: {
    eyebrow: string;
    h1: string;
    subtitle: string;
  };
  intro: string;
  benefits: SeoLandingBenefit[];
  steps?: { title: string; description: string }[];
  faqs: SeoLandingFaq[];
  relatedSlugs: string[];
};

const BASE = "https://www.kaviro.app";

export const SEO_LANDING_PAGES: Record<string, SeoLandingPageData> = {
  "organizador-viajes": {
    slug: "organizador-viajes",
    metadata: {
      title: `Organizador de viajes en grupo · ${APP_NAME}`,
      description:
        "Centraliza participantes, plan, gastos, documentos y rutas en un solo espacio. Kaviro es el organizador de viajes ideal para grupos de amigos, familia o trabajo.",
      keywords: [
        "organizador de viajes",
        "organizar viaje en grupo",
        "app organizar viajes",
        "planificador viaje amigos",
        "gestionar viaje grupal",
      ],
    },
    hero: {
      eyebrow: "Organización centralizada",
      h1: "Organizador de viajes para grupos que quieren ir a la misma página",
      subtitle:
        "Un solo lugar para el plan, la gente, los gastos y los documentos. Menos WhatsApp, más viaje.",
    },
    intro:
      "Coordinar un viaje en grupo suele significar mil mensajes, hojas de cálculo sueltas y nadie sabiendo qué toca hoy. Kaviro reúne todo lo que tu grupo necesita: quién va, qué hacéis cada día, cuánto habéis gastado y dónde están los billetes. Funciona en móvil y ordenador, sin instalar nada.",
    benefits: [
      {
        icon: "👥",
        title: "Participantes y roles",
        description: "Invita a tu grupo, asigna permisos y mantén la lista de viajeros siempre actualizada.",
      },
      {
        icon: "📅",
        title: "Plan e itinerario",
        description: "Itinerario día a día con horarios, lugares y notas. Todo el grupo ve el mismo plan.",
      },
      {
        icon: "💸",
        title: "Gastos compartidos",
        description: "Registra tickets, reparte costes y calcula quién debe a quién sin discusiones.",
      },
      {
        icon: "📎",
        title: "Documentos del viaje",
        description: "Billetes, reservas y seguros en un solo sitio, accesibles para quien los necesite.",
      },
      {
        icon: "🗺️",
        title: "Rutas y mapa",
        description: "Visualiza paradas, trayectos y puntos de interés del viaje en un mapa compartido.",
      },
      {
        icon: "📱",
        title: "Móvil y web",
        description: "Consulta el viaje desde el móvil en destino o prepara todo cómodamente en el PC.",
      },
    ],
    steps: [
      { title: "Crea tu viaje", description: "Pon nombre, fechas y destino en menos de un minuto." },
      { title: "Invita al grupo", description: "Comparte el enlace para que todos entren al mismo espacio." },
      { title: "Organiza sin caos", description: "Plan, gastos y documentos viven juntos durante todo el viaje." },
    ],
    faqs: [
      {
        q: "¿Kaviro sirve para viajes de amigos, familia o trabajo?",
        a: "Sí. Puedes usarlo con cualquier grupo: escapadas de fin de semana, interrail, despedidas, viajes en familia o salidas de equipo.",
      },
      {
        q: "¿Hace falta que todos tengan cuenta?",
        a: "Quien organice crea el viaje e invita al resto. Los participantes pueden unirse con cuenta gratuita para ver y colaborar.",
      },
      {
        q: "¿Puedo usar Kaviro solo para organizar sin pagar?",
        a: "Sí. El plan gratuito incluye plan, participantes, gastos, documentos y mapa para varios viajes.",
      },
      {
        q: "¿Sustituye a WhatsApp?",
        a: "No del todo, pero reduce muchísimo el ruido: el plan y los gastos dejan de perderse entre mensajes.",
      },
    ],
    relatedSlugs: ["itinerario-viaje", "control-gastos-viaje", "planificador-viajes-ia"],
  },

  "control-gastos-viaje": {
    slug: "control-gastos-viaje",
    metadata: {
      title: `Control de gastos de viaje en grupo · ${APP_NAME}`,
      description:
        "Divide gastos de viaje, registra tickets, calcula balances y sabe quién debe a quién. Kaviro simplifica las cuentas del grupo sin Excel.",
      keywords: [
        "control gastos viaje",
        "dividir gastos viaje",
        "app gastos compartidos viaje",
        "cuentas viaje amigos",
        "repartir gastos grupo",
      ],
    },
    hero: {
      eyebrow: "Gastos sin líos",
      h1: "Control de gastos de viaje: quién pagó, quién debe y cuánto",
      subtitle:
        "Añade tickets, reparte entre el grupo y obtén balances automáticos. Ideal para viajes, pisos compartidos y escapadas.",
    },
    intro:
      "Al final del viaje nadie recuerda quién pagó la cena del jueves ni cuánto costó el apartamento. Kaviro registra cada gasto con concepto, importe y participantes, calcula balances en tiempo real y sugiere los pagos mínimos para saldar cuentas. También puedes crear un grupo de gastos sin fechas de viaje, perfecto para pisos o gastos recurrentes.",
    benefits: [
      {
        icon: "🧾",
        title: "Tickets y conceptos",
        description: "Anota cenas, transporte, entradas o compras con fecha y categoría.",
      },
      {
        icon: "⚖️",
        title: "Balances automáticos",
        description: "Kaviro calcula quién ha pagado de más y quién debe sin fórmulas manuales.",
      },
      {
        icon: "🔄",
        title: "Pagos sugeridos",
        description: "Recibe la lista mínima de transferencias para dejar todas las cuentas a cero.",
      },
      {
        icon: "💬",
        title: "Recordatorio por WhatsApp",
        description: "Comparte el resumen de lo que cada persona debe con un solo clic.",
      },
      {
        icon: "👥",
        title: "Grupo de gastos",
        description: "Modo dedicado para repartir gastos sin necesidad de crear un viaje completo.",
      },
      {
        icon: "📊",
        title: "Resumen visual",
        description: "Consulta totales, categorías y tu balance personal de un vistazo.",
      },
    ],
    steps: [
      { title: "Añade el gasto", description: "Importe, quién pagó y entre quién se reparte." },
      { title: "Revisa balances", description: "Cada persona ve cuánto ha puesto y cuánto le corresponde." },
      { title: "Salda cuentas", description: "Marca pagos realizados y comparte el resumen con el grupo." },
    ],
    faqs: [
      {
        q: "¿Funciona con distintas monedas?",
        a: "Puedes registrar gastos en la moneda del ticket y consultar balances en la moneda base del viaje.",
      },
      {
        q: "¿Puedo repartir un gasto solo entre algunas personas?",
        a: "Sí. En cada ticket eliges quién pagó y entre quién se divide, incluso con importes desiguales.",
      },
      {
        q: "¿Qué es un grupo de gastos?",
        a: "Es un espacio centrado solo en finanzas compartidas: pisos, cenas recurrentes o gastos de un evento sin itinerario.",
      },
      {
        q: "¿Necesito Premium para dividir gastos?",
        a: "No. Los gastos compartidos y balances están en el plan gratuito. Premium añade OCR para leer tickets automáticamente.",
      },
    ],
    relatedSlugs: ["organizador-viajes", "itinerario-viaje", "planificador-viajes-ia"],
  },

  "itinerario-viaje": {
    slug: "itinerario-viaje",
    metadata: {
      title: `Itinerario de viaje colaborativo · ${APP_NAME}`,
      description:
        "Crea y comparte el itinerario de tu viaje día a día. Horarios, actividades, lugares y mapa en una sola app para todo el grupo.",
      keywords: [
        "itinerario viaje",
        "planificar itinerario",
        "itinerario viaje grupo",
        "app itinerario viaje",
        "plan viaje día a día",
      ],
    },
    hero: {
      eyebrow: "Plan día a día",
      h1: "Itinerario de viaje claro para que todo el grupo sepa qué toca",
      subtitle:
        "Actividades, horarios, ubicaciones y notas en un plan vivo que podéis editar juntos antes y durante el viaje.",
    },
    intro:
      "Un buen itinerario no es un PDF que nadie abre: es la referencia diaria del grupo. En Kaviro añades actividades con hora, lugar y descripción; el plan se organiza por días y se puede consultar en modo «Hoy» cuando estáis en destino. Vincula paradas al mapa para ver rutas y no perder tiempo decidiendo sobre la marcha.",
    benefits: [
      {
        icon: "📆",
        title: "Vista por días",
        description: "Cada jornada con sus actividades ordenadas. Fácil de leer en móvil.",
      },
      {
        icon: "⏰",
        title: "Horarios y lugares",
        description: "Hora de salida, nombre del sitio, dirección y notas útiles para el grupo.",
      },
      {
        icon: "🗺️",
        title: "Mapa integrado",
        description: "Las paradas del plan aparecen en el mapa para orientar rutas y desplazamientos.",
      },
      {
        icon: "☀️",
        title: "Modo «Hoy»",
        description: "Durante el viaje, consulta solo lo que toca hoy: actividad actual, siguiente parada y clima.",
      },
      {
        icon: "✏️",
        title: "Edición colaborativa",
        description: "Varios miembros pueden proponer cambios según los permisos del viaje.",
      },
      {
        icon: "📤",
        title: "Compartir con el grupo",
        description: "Todos ven el mismo itinerario actualizado, sin versiones distintas por persona.",
      },
    ],
    steps: [
      { title: "Estructura los días", description: "Define fechas y añade actividades a cada jornada." },
      { title: "Detalla cada parada", description: "Hora, lugar, tipo de actividad y notas para el grupo." },
      { title: "Viaja con el plan", description: "Usa el modo Hoy y el mapa para seguir el itinerario en destino." },
    ],
    faqs: [
      {
        q: "¿Puedo importar un itinerario que ya tengo?",
        a: "Puedes copiar actividades manualmente o usar el planificador con IA (Premium) para generar un borrador desde cero.",
      },
      {
        q: "¿El itinerario se ve en el móvil?",
        a: "Sí. Kaviro está pensado para usarse en destino: plan, mapa y modo Hoy funcionan en móvil.",
      },
      {
        q: "¿Puedo cambiar el plan durante el viaje?",
        a: "Por supuesto. Añade, mueve o elimina actividades; el grupo ve los cambios al instante.",
      },
      {
        q: "¿Incluye rutas entre actividades?",
        a: "Sí. El mapa del viaje ayuda a visualizar paradas y planificar desplazamientos entre puntos.",
      },
    ],
    relatedSlugs: ["organizador-viajes", "planificador-viajes-ia", "control-gastos-viaje"],
  },

  "planificador-viajes-ia": {
    slug: "planificador-viajes-ia",
    metadata: {
      title: `Planificador de viajes con IA · ${APP_NAME}`,
      description:
        "Genera itinerarios con inteligencia artificial a partir de destino, fechas y estilo de viaje. Revisa, ajusta y guarda el plan en Kaviro.",
      keywords: [
        "planificador viajes ia",
        "planificar viaje con inteligencia artificial",
        "itinerario automático viaje",
        "ia viajes",
        "generar itinerario ia",
      ],
    },
    hero: {
      eyebrow: "Premium · Inteligencia artificial",
      h1: "Planificador de viajes con IA: de la idea al itinerario en minutos",
      subtitle:
        "Indica destino, fechas y estilo. La IA propone días, ciudades y actividades reales que puedes revisar y guardar en tu viaje.",
    },
    intro:
      "Empezar un viaje desde cero puede llevar horas de búsqueda. El planificador inteligente de Kaviro analiza tus destinos, el número de días y tus preferencias (cultura, gastronomía, naturaleza…) para proponer un reparto de jornadas y un itinerario con lugares concretos. Tú revisas, ajustas con el asistente y guardas el resultado directamente en el plan del viaje.",
    benefits: [
      {
        icon: "✨",
        title: "Borrador en minutos",
        description: "Evita la página en blanco: la IA estructura los días según tu destino y fechas.",
      },
      {
        icon: "🎯",
        title: "Estilo de viaje",
        description: "Elige plantillas (city break, playa, familia, aventura…) o describe lo que buscas en texto libre.",
      },
      {
        icon: "📍",
        title: "Lugares reales",
        description: "Actividades con nombre, horario sugerido y ubicación para pasarlas al mapa.",
      },
      {
        icon: "💬",
        title: "Ajustes conversacionales",
        description: "Pide cambios al asistente: más museos, menos caminata, otro ritmo…",
      },
      {
        icon: "💾",
        title: "Guardado en tu viaje",
        description: "Un clic y el itinerario pasa al plan colaborativo de Kaviro, listo para compartir.",
      },
      {
        icon: "🤝",
        title: "Tú tienes el control",
        description: "La IA propone; tú decides qué mantener, editar o descartar antes de publicar al grupo.",
      },
    ],
    steps: [
      { title: "Define destino y fechas", description: "Ciudades, duración y preferencias de viaje." },
      { title: "Revisa la propuesta", description: "Comprueba el reparto de días y el detalle de actividades." },
      { title: "Guarda y comparte", description: "Crea el viaje en Kaviro e invita al grupo al plan terminado." },
    ],
    faqs: [
      {
        q: "¿El planificador con IA es gratuito?",
        a: "Forma parte de Kaviro Premium. El plan gratuito incluye crear el itinerario manualmente y todas las funciones de organización.",
      },
      {
        q: "¿Puedo editar lo que genera la IA?",
        a: "Sí, siempre. El resultado es un borrador que puedes modificar actividad por actividad o pedir cambios al asistente.",
      },
      {
        q: "¿Funciona para varios destinos en un mismo viaje?",
        a: "Sí. Puedes indicar varias ciudades o regiones y la IA propone cómo repartir los días entre ellas.",
      },
      {
        q: "¿Sustituye a un guía de viaje?",
        a: "Es un punto de partida muy útil, pero conviene revisar horarios, reservas y disponibilidad antes de viajar.",
      },
    ],
    relatedSlugs: ["itinerario-viaje", "organizador-viajes", "control-gastos-viaje"],
  },
};

export function getSeoLandingPage(slug: string): SeoLandingPageData | null {
  return SEO_LANDING_PAGES[slug] ?? null;
}

export function getSeoLandingCanonical(slug: string): string {
  return `${BASE}/${slug}`;
}

export const SEO_LANDING_SLUGS = Object.keys(SEO_LANDING_PAGES);
