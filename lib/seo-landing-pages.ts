import { APP_NAME } from "@/lib/brand";

export type SeoLandingFaq = { q: string; a: string };
export type SeoLandingBenefit = { icon: string; title: string; description: string };
export type SeoLandingHowItWorks = { title: string; description: string };
export type SeoLandingAudience = { icon: string; title: string; description: string };
export type SeoLandingComparison = { method: string; problem: string; kaviro: string };
export type SeoLandingFinalCta = {
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

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
  howItWorks: SeoLandingHowItWorks[];
  audience: SeoLandingAudience[];
  comparison: SeoLandingComparison[];
  faqs: SeoLandingFaq[];
  finalCta: SeoLandingFinalCta;
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
        "herramienta organización viajes",
      ],
    },
    hero: {
      eyebrow: "Organización centralizada",
      h1: "Organizador de viajes para grupos que quieren ir a la misma página",
      subtitle:
        "Un solo lugar para el plan, la gente, los gastos y los documentos. Menos WhatsApp, más viaje.",
    },
    intro:
      "Coordinar un viaje en grupo suele significar mil mensajes, hojas de cálculo sueltas y nadie sabiendo qué toca hoy. Kaviro reúne todo lo que tu grupo necesita: quién va, qué hacéis cada día, cuánto habéis gastado y dónde están los billetes. Funciona en móvil y ordenador, sin instalar nada. Si también necesitas un itinerario detallado o repartir gastos, puedes combinarlo con nuestras guías de itinerario y control de gastos.",
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
    howItWorks: [
      {
        title: "Crea el espacio del viaje",
        description:
          "Regístrate gratis, pon nombre, destino y fechas. En menos de un minuto tienes un hub central para todo el grupo.",
      },
      {
        title: "Invita a los participantes",
        description:
          "Comparte el enlace de invitación. Cada persona entra al mismo viaje con su cuenta y ve la información actualizada.",
      },
      {
        title: "Centraliza plan, gastos y documentos",
        description:
          "Añade el itinerario, sube billetes, registra gastos y consulta el mapa. Todo vive en el mismo espacio, no en chats sueltos.",
      },
      {
        title: "Viaja con el grupo alineado",
        description:
          "En destino, el modo «Hoy», los avisos y el plan compartido evitan preguntas repetidas y malentendidos.",
      },
    ],
    audience: [
      {
        icon: "🎒",
        title: "Grupos de amigos",
        description: "Interrail, despedidas, festivales o escapadas donde varios organizan y pagan a medias.",
      },
      {
        icon: "👨‍👩‍👧",
        title: "Familias",
        description: "Vacaciones con hijos, varios destinos o varios miembros repartiendo reservas y gastos.",
      },
      {
        icon: "💼",
        title: "Equipos y empresas",
        description: "Viajes de trabajo, offsites o eventos donde conviene un plan y unas cuentas claras.",
      },
      {
        icon: "🧭",
        title: "Quien organiza «por defecto»",
        description: "Si siempre eres tú quien lleva el Excel y el grupo de WhatsApp, Kaviro te quita ese peso.",
      },
    ],
    comparison: [
      {
        method: "Grupo de WhatsApp",
        problem: "Mensajes enterrados, versiones distintas del plan y cero histórico ordenado.",
        kaviro: "Un espacio único con plan, gastos y documentos siempre actualizados para todos.",
      },
      {
        method: "Google Docs + Excel",
        problem: "Varios archivos, permisos confusos y nadie abre el documento en el aeropuerto.",
        kaviro: "Todo en la app web y móvil: consulta rápida y edición según rol.",
      },
      {
        method: "Varias apps sueltas",
        problem: "Una para mapas, otra para gastos, otra para notas… el grupo se pierde.",
        kaviro: "Plan, gastos, mapa, documentos y participantes integrados en un solo viaje.",
      },
      {
        method: "Cuaderno o notas sueltas",
        problem: "Solo lo ve quien escribió; imposible repartir tareas o gastos en tiempo real.",
        kaviro: "Colaboración en vivo: invitaciones, permisos y visibilidad para todo el grupo.",
      },
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
      {
        q: "¿Puedo combinar organización con itinerario y gastos?",
        a: "Sí. Kaviro integra itinerario colaborativo y control de gastos en el mismo viaje. También puedes crear solo un grupo de gastos si no necesitas plan.",
      },
    ],
    finalCta: {
      title: "Organiza tu próximo viaje en grupo sin caos",
      description:
        "Crea tu espacio gratis, invita a quien viaja contigo y ten plan, gastos y documentos en un solo sitio desde el primer día.",
      primaryLabel: "Crear mi viaje gratis",
      primaryHref: "/auth/register",
      secondaryLabel: "Ver itinerario colaborativo",
      secondaryHref: "/itinerario-viaje",
    },
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
        "splitwise viaje alternativa",
      ],
    },
    hero: {
      eyebrow: "Gastos sin líos",
      h1: "Control de gastos de viaje: quién pagó, quién debe y cuánto",
      subtitle:
        "Añade tickets, reparte entre el grupo y obtén balances automáticos. Ideal para viajes, pisos compartidos y escapadas.",
    },
    intro:
      "Al final del viaje nadie recuerda quién pagó la cena del jueves ni cuánto costó el apartamento. Kaviro registra cada gasto con concepto, importe y participantes, calcula balances en tiempo real y sugiere los pagos mínimos para saldar cuentas. También puedes crear un grupo de gastos sin fechas de viaje, perfecto para pisos o gastos recurrentes. Si además necesitas organizar el viaje completo, combínalo con nuestro organizador de viajes.",
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
    howItWorks: [
      {
        title: "Crea un viaje o grupo de gastos",
        description:
          "Elige un viaje completo o un espacio solo de finanzas compartidas. Añade a las personas que participan.",
      },
      {
        title: "Registra cada ticket",
        description:
          "Importe, concepto, quién pagó y entre quién se divide. Puedes repartir de forma igual o personalizada.",
      },
      {
        title: "Consulta balances al instante",
        description:
          "Kaviro actualiza en tiempo real cuánto ha puesto cada uno y cuánto le corresponde pagar.",
      },
      {
        title: "Salda cuentas con claridad",
        description:
          "Sigue los pagos sugeridos, marca transferencias hechas y comparte el resumen por WhatsApp si hace falta.",
      },
    ],
    audience: [
      {
        icon: "✈️",
        title: "Viajes en grupo",
        description: "Escapadas, road trips o vacaciones donde se comparten cenas, alojamiento y actividades.",
      },
      {
        icon: "🏠",
        title: "Pisos compartidos",
        description: "Alquiler, suministros y compras del hogar sin pelear por quién puso cada factura.",
      },
      {
        icon: "🎉",
        title: "Eventos puntuales",
        description: "Bodas, despedidas o cenas grandes donde varias personas adelantan dinero.",
      },
      {
        icon: "📱",
        title: "Quien odia el Excel",
        description: "Si llevas las cuentas en una hoja que nadie entiende, aquí todo se calcula solo.",
      },
    ],
    comparison: [
      {
        method: "Excel o Google Sheets",
        problem: "Fórmulas frágiles, versiones distintas y errores al repartir entre personas.",
        kaviro: "Balances automáticos, reparto flexible y un solo sitio de verdad para el grupo.",
      },
      {
        method: "Anotar en el móvil",
        problem: "Notas sueltas sin reparto ni totales; al volver nadie cuadra las cifras.",
        kaviro: "Cada gasto queda registrado con participantes y categoría desde el primer momento.",
      },
      {
        method: "Apps solo de gastos",
        problem: "Útiles para dividir, pero desconectadas del plan y documentos del viaje.",
        kaviro: "Gastos integrados en el viaje: ves el plan y las cuentas en el mismo espacio.",
      },
      {
        method: "«A ver al final cuadramos»",
        problem: "Olvidos, discusiones y horas perdidas recordando quién pagó qué.",
        kaviro: "Historial claro, pagos sugeridos y resumen compartible en cualquier momento.",
      },
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
      {
        q: "¿Puedo usar solo gastos sin crear un itinerario?",
        a: "Sí. El modo grupo de gastos está pensado para eso. Si más adelante organizas un viaje, todo puede vivir junto en Kaviro.",
      },
    ],
    finalCta: {
      title: "Deja las cuentas del viaje resueltas",
      description:
        "Registra el primer gasto en minutos y deja que Kaviro calcule balances y pagos sugeridos para todo el grupo.",
      primaryLabel: "Crear grupo de gastos",
      primaryHref: "/auth/register",
      secondaryLabel: "Organizar viaje completo",
      secondaryHref: "/organizador-viajes",
    },
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
        "itinerario colaborativo",
      ],
    },
    hero: {
      eyebrow: "Plan día a día",
      h1: "Itinerario de viaje claro para que todo el grupo sepa qué toca",
      subtitle:
        "Actividades, horarios, ubicaciones y notas en un plan vivo que podéis editar juntos antes y durante el viaje.",
    },
    intro:
      "Un buen itinerario no es un PDF que nadie abre: es la referencia diaria del grupo. En Kaviro añades actividades con hora, lugar y descripción; el plan se organiza por días y se puede consultar en modo «Hoy» cuando estáis en destino. Vincula paradas al mapa para ver rutas y no perder tiempo decidiendo sobre la marcha. Si prefieres un borrador inicial con IA, prueba el planificador de viajes con inteligencia artificial.",
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
    howItWorks: [
      {
        title: "Define fechas y estructura",
        description:
          "Crea el viaje con fechas de inicio y fin. Kaviro organiza automáticamente los días del calendario.",
      },
      {
        title: "Añade actividades al plan",
        description:
          "Para cada día: hora, título, lugar, tipo de actividad y notas. Puedes enlazar ubicaciones al mapa.",
      },
      {
        title: "Comparte con el grupo",
        description:
          "Invita participantes. Todos consultan el mismo itinerario desde móvil o PC, según sus permisos.",
      },
      {
        title: "Sigue el plan en destino",
        description:
          "Usa el modo «Hoy» para ver la actividad actual, la siguiente parada y cómo llegar sin buscar en chats.",
      },
    ],
    audience: [
      {
        icon: "🗺️",
        title: "Viajes multi-ciudad",
        description: "Rutas con varias paradas donde ordenar días y traslados es clave.",
      },
      {
        icon: "👫",
        title: "Grupos que deciden juntos",
        description: "Cuando varias personas proponen actividades y quieren un plan común visible.",
      },
      {
        icon: "👪",
        title: "Familias con niños",
        description: "Horarios claros, sitios concretos y menos improvisación estresante cada mañana.",
      },
      {
        icon: "⏱️",
        title: "Viajes cortos e intensos",
        description: "City breaks o escapadas de fin de semana donde cada hora cuenta.",
      },
    ],
    comparison: [
      {
        method: "PDF o documento estático",
        problem: "Nadie lo abre en el móvil; un cambio obliga a reenviar otra versión.",
        kaviro: "Itinerario vivo, editable y siempre accesible para todo el grupo.",
      },
      {
        method: "Mensajes en WhatsApp",
        problem: "Ideas sueltas sin orden cronológico ni mapa; se pierden entre cientos de mensajes.",
        kaviro: "Plan por días con horarios, lugares y vista «Hoy» en destino.",
      },
      {
        method: "Notion o Google Docs",
        problem: "Funciona para planificar, pero en ruta cuesta consultar y no integra mapa ni modo día.",
        kaviro: "Pensado para viajar: móvil, mapa, clima y actividad actual en un clic.",
      },
      {
        method: "Guías impresas o blogs",
        problem: "Inspiración útil, pero no adaptada a vuestro grupo, fechas ni reservas reales.",
        kaviro: "Vuestro itinerario real, colaborativo y ajustable hasta el último momento.",
      },
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
      {
        q: "¿El itinerario se puede combinar con gastos del viaje?",
        a: "Sí. En el mismo viaje tienes plan, gastos compartidos, documentos y participantes sin cambiar de herramienta.",
      },
    ],
    finalCta: {
      title: "Monta el itinerario de tu próximo viaje",
      description:
        "Estructura los días, invita al grupo y consulta el plan en modo «Hoy» cuando estéis en destino.",
      primaryLabel: "Crear itinerario gratis",
      primaryHref: "/auth/register",
      secondaryLabel: "Planificar con IA",
      secondaryHref: "/planificador-viajes-ia",
    },
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
        "asistente viajes ia",
      ],
    },
    hero: {
      eyebrow: "Premium · Inteligencia artificial",
      h1: "Planificador de viajes con IA: de la idea al itinerario en minutos",
      subtitle:
        "Indica destino, fechas y estilo. La IA propone días, ciudades y actividades reales que puedes revisar y guardar en tu viaje.",
    },
    intro:
      "Empezar un viaje desde cero puede llevar horas de búsqueda. El planificador inteligente de Kaviro analiza tus destinos, el número de días y tus preferencias (cultura, gastronomía, naturaleza…) para proponer un reparto de jornadas y un itinerario con lugares concretos. Tú revisas, ajustas con el asistente y guardas el resultado directamente en el plan colaborativo del viaje. Después puedes afinar el itinerario manualmente o repartir gastos con el resto del grupo.",
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
    howItWorks: [
      {
        title: "Indica destino, fechas y estilo",
        description:
          "Ciudades, duración, ritmo del viaje y preferencias: cultura, gastronomía, naturaleza, familia…",
      },
      {
        title: "La IA genera un borrador",
        description:
          "Recibes un reparto de días con actividades concretas, horarios sugeridos y ubicaciones.",
      },
      {
        title: "Revisa y pide cambios",
        description:
          "Edita actividad por actividad o conversa con el asistente para ajustar el plan a tu gusto.",
      },
      {
        title: "Guarda en tu viaje Kaviro",
        description:
          "El itinerario pasa al plan colaborativo. Invita al grupo, añade gastos y documentos cuando quieras.",
      },
    ],
    audience: [
      {
        icon: "🆕",
        title: "Primer viaje a un destino",
        description: "Cuando no conoces la zona y quieres un punto de partida sólido sin investigar durante horas.",
      },
      {
        icon: "⏳",
        title: "Poca tiempo para planificar",
        description: "Trabajo, familia o imprevistos: necesitas un borrador rápido que luego puedas pulir.",
      },
      {
        icon: "🎨",
        title: "Viajeros con preferencias claras",
        description: "Más museos, menos turismo masivo, ritmo relajado… la IA adapta la propuesta a tu estilo.",
      },
      {
        icon: "🌍",
        title: "Rutas con varias ciudades",
        description: "La IA ayuda a repartir días entre destinos cuando no sabes por dónde empezar.",
      },
    ],
    comparison: [
      {
        method: "Horas en blogs y foros",
        problem: "Mucha información dispersa y difícil de convertir en un plan día a día coherente.",
        kaviro: "Borrador estructurado en minutos, listo para revisar y guardar en tu viaje.",
      },
      {
        method: "Copiar itinerarios de internet",
        problem: "Planes genéricos que no encajan con tus fechas, grupo ni reservas ya hechas.",
        kaviro: "Propuesta personalizada según destino, duración y preferencias que tú ajustas.",
      },
      {
        method: "ChatGPT suelto",
        problem: "Texto sin integrar en un plan compartido, mapa ni espacio de grupo.",
        kaviro: "La IA guarda el resultado directamente en el itinerario colaborativo de Kaviro.",
      },
      {
        method: "Planificar todo a mano",
        problem: "Máximo control, pero lento si empiezas de cero o viajas a sitios nuevos.",
        kaviro: "La IA acelera el inicio; tú mantienes el control final sobre cada actividad.",
      },
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
      {
        q: "¿Qué pasa después de generar el itinerario?",
        a: "Queda guardado en tu viaje Kaviro. Puedes compartirlo con el grupo, usar el mapa, el modo «Hoy» y el control de gastos en el mismo espacio.",
      },
    ],
    finalCta: {
      title: "Genera tu itinerario con IA y compártelo con el grupo",
      description:
        "Activa Premium, describe tu viaje y obtén un borrador que puedes editar y publicar en minutos.",
      primaryLabel: "Ver planes Premium",
      primaryHref: "/pricing",
      secondaryLabel: "Crear itinerario manual",
      secondaryHref: "/itinerario-viaje",
    },
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

/** Etiquetas cortas para enlaces internos entre landings SEO */
export const SEO_LANDING_LINK_LABELS: Record<string, string> = {
  "organizador-viajes": "Organizador de viajes",
  "control-gastos-viaje": "Control de gastos",
  "itinerario-viaje": "Itinerario colaborativo",
  "planificador-viajes-ia": "Planificador con IA",
};
