/** Datos estáticos del viaje demo: Londres, 4 días, GBP base, gastos multi-moneda. */

export const DEMO_TRIP_NAME = "Demo · Londres en grupo";
export const DEMO_TRIP_DESTINATION = "Londres, Reino Unido";
export const DEMO_TRIP_BASE_CURRENCY = "GBP";

export function demoTripDateRange(): { start_date: string; end_date: string } {
  const start = new Date();
  start.setDate(start.getDate() + 21);
  const end = new Date(start);
  end.setDate(end.getDate() + 3);
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return { start_date: fmt(start), end_date: fmt(end) };
}

export const DEMO_GHOST_PARTICIPANTS = [
  { display_name: "Ana", role: "editor" as const },
  { display_name: "Luis", role: "editor" as const },
  { display_name: "María", role: "viewer" as const },
];

export type DemoActivitySeed = {
  title: string;
  activity_date: string;
  activity_time: string;
  place_name: string;
  address: string;
  activity_kind: string;
  latitude: number;
  longitude: number;
  rating?: number | null;
  comment?: string | null;
};

export function buildDemoActivities(start_date: string): DemoActivitySeed[] {
  const d = (offset: number) => {
    const x = new Date(`${start_date}T12:00:00`);
    x.setDate(x.getDate() + offset);
    return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(x);
  };

  return [
    // ── Día 1 · Llegada y Westminster ────────────────────────────
    {
      title: "Llegada y check-in en el hotel",
      activity_date: d(0),
      activity_time: "13:00",
      place_name: "Hotel Park Plaza Westminster",
      address: "200 Westminster Bridge Rd, Londres",
      activity_kind: "lodging",
      latitude: 51.4984,
      longitude: -0.1144,
      rating: 4,
      comment: "Habitaciones amplias y bien situadas. La recepción tardó un poco pero el personal muy amable.",
    },
    {
      title: "St. James's Park",
      activity_date: d(0),
      activity_time: "14:00",
      place_name: "St. James's Park",
      address: "St. James's Park, Londres",
      activity_kind: "nature",
      latitude: 51.5021,
      longitude: -0.1334,
      rating: 5,
      comment: "Un paseo imprescindible nada más dejar las maletas. Los pelícanos del lago son una sorpresa increíble.",
    },
    {
      title: "Buckingham Palace y ceremonia del cambio de guardia",
      activity_date: d(0),
      activity_time: "14:45",
      place_name: "Buckingham Palace",
      address: "Buckingham Palace, Londres",
      activity_kind: "visit",
      latitude: 51.5014,
      longitude: -0.1419,
      rating: 4,
      comment: "Vale la pena llegar 20 minutos antes de la ceremonia para coger un buen sitio. Espectacular si hay buen tiempo.",
    },
    {
      title: "Paseo por Westminster y Big Ben",
      activity_date: d(0),
      activity_time: "16:30",
      place_name: "Palacio de Westminster",
      address: "Westminster, Londres",
      activity_kind: "visit",
      latitude: 51.4995,
      longitude: -0.1248,
      rating: 5,
      comment: "Impresionante al atardecer. Las luces reflejadas en el Támesis son de postal. No olvidar el puente de Westminster para la foto clásica.",
    },
    {
      title: "Paseo nocturno por el Southbank",
      activity_date: d(0),
      activity_time: "19:00",
      place_name: "Southbank Riverside Walk",
      address: "South Bank, Londres",
      activity_kind: "neighborhood",
      latitude: 51.5072,
      longitude: -0.1125,
      rating: 4,
      comment: "Uno de los mejores paseos nocturnos de Europa. Artistas callejeros, vistas al puente de la Torre y ambiente animado toda la semana.",
    },
    {
      title: "Cena en el Southbank",
      activity_date: d(0),
      activity_time: "20:30",
      place_name: "The Anchor Bankside",
      address: "34 Park St, Londres",
      activity_kind: "food",
      latitude: 51.5066,
      longitude: -0.0939,
      rating: 4,
      comment: "Pub histórico del siglo XVII con buena carta. El fish & chips estaba muy bien. Un poco lleno pero compensó el ambiente.",
    },

    // ── Día 2 · Museos y Covent Garden ───────────────────────────
    {
      title: "Desayuno en Covent Garden",
      activity_date: d(1),
      activity_time: "09:00",
      place_name: "Bill's Covent Garden",
      address: "The Piazza, Covent Garden, Londres",
      activity_kind: "food",
      latitude: 51.5119,
      longitude: -0.1232,
      rating: 5,
      comment: "El mejor desayuno del viaje. Los pancakes con arándanos estaban para repetir. Muy recomendado.",
    },
    {
      title: "British Museum",
      activity_date: d(1),
      activity_time: "10:30",
      place_name: "British Museum",
      address: "Great Russell St, Londres",
      activity_kind: "museum",
      latitude: 51.5194,
      longitude: -0.127,
      rating: 5,
      comment: "Podríamos habernos quedado el doble de tiempo. La sección de Egipto y la Piedra de Rosetta son increíbles. Entrada gratuita.",
    },
    {
      title: "Almuerzo en Dishoom",
      activity_date: d(1),
      activity_time: "13:30",
      place_name: "Dishoom Bloomsbury",
      address: "5 Upper St Martin's Ln, Londres",
      activity_kind: "restaurant",
      latitude: 51.5127,
      longitude: -0.1266,
      rating: 5,
      comment: "Lo mejor del viaje en tema gastronómico. El bacon naan y el dal negro son imprescindibles. Reservar con antelación.",
    },
    {
      title: "National Gallery",
      activity_date: d(1),
      activity_time: "15:00",
      place_name: "National Gallery",
      address: "Trafalgar Square, Londres",
      activity_kind: "museum",
      latitude: 51.5089,
      longitude: -0.1283,
      rating: 4,
      comment: "Colección impresionante. Especialmente los Velázquez e impresionistas. Gratis y vale mucho la pena.",
    },
    {
      title: "Trafalgar Square",
      activity_date: d(1),
      activity_time: "17:00",
      place_name: "Trafalgar Square",
      address: "Trafalgar Square, Londres",
      activity_kind: "visit",
      latitude: 51.5081,
      longitude: -0.1281,
      rating: 4,
      comment: "El corazón de Londres. Los leones de Nelson son imprescindibles para la foto. Mucho ambiente y siempre hay algo interesante.",
    },
    {
      title: "Mercado y cena en Borough Market",
      activity_date: d(1),
      activity_time: "19:30",
      place_name: "Borough Market",
      address: "Borough Market, Londres",
      activity_kind: "market",
      latitude: 51.5055,
      longitude: -0.091,
      rating: 4,
      comment: "Ambiente único y variedad enorme. Probamos quesos artesanales y embutidos. Llegar pronto para encontrar sitio.",
    },

    // ── Día 3 · East London y West End ───────────────────────────
    {
      title: "Tower Bridge y Tower of London",
      activity_date: d(2),
      activity_time: "09:30",
      place_name: "Tower Bridge",
      address: "Tower Bridge Rd, Londres",
      activity_kind: "visit",
      latitude: 51.5055,
      longitude: -0.0754,
      rating: 5,
      comment: "El paseo por el suelo de cristal da vértigo (en el buen sentido). La Torre de Londres merece al menos 2 horas.",
    },
    {
      title: "St. Katharine Docks",
      activity_date: d(2),
      activity_time: "11:30",
      place_name: "St. Katharine Docks",
      address: "St Katharine's Way, Londres",
      activity_kind: "neighborhood",
      latitude: 51.5054,
      longitude: -0.0705,
      rating: 4,
      comment: "Zona de marina histórica muy pintoresca. Perfecta para tomar un café viendo los barcos. Más tranquila que el centro.",
    },
    {
      title: "Almuerzo en Brick Lane",
      activity_date: d(2),
      activity_time: "13:00",
      place_name: "Beigel Bake Brick Lane",
      address: "159 Brick Lane, Londres",
      activity_kind: "food",
      latitude: 51.5233,
      longitude: -0.0711,
      rating: 5,
      comment: "Cola de 15 minutos pero completamente vale la pena. El bagel de salmón ahumado es legendario y costó solo £1,80.",
    },
    {
      title: "Shoreditch y street art",
      activity_date: d(2),
      activity_time: "14:30",
      place_name: "Shoreditch High Street",
      address: "Shoreditch, Londres",
      activity_kind: "neighborhood",
      latitude: 51.5241,
      longitude: -0.0796,
      rating: 4,
      comment: "Barrio muy chulo para explorar a pie. Tiendas vintage, murales y muchos cafés de especialidad. Imprescindible Boxpark.",
    },
    {
      title: "Churchill War Rooms",
      activity_date: d(2),
      activity_time: "16:30",
      place_name: "Churchill War Rooms",
      address: "Clive Steps, Londres",
      activity_kind: "museum",
      latitude: 51.5020,
      longitude: -0.1290,
      rating: 5,
      comment: "Uno de los museos más sorprendentes de Londres. Los búnkeres de la WWII están exactamente como en 1945. Requiere al menos 90 minutos.",
    },
    {
      title: "Musical en West End",
      activity_date: d(2),
      activity_time: "19:30",
      place_name: "West End — Lyceum Theatre",
      address: "21 Wellington St, Londres",
      activity_kind: "night",
      latitude: 51.5118,
      longitude: -0.1208,
      rating: 5,
      comment: "El Rey León en directo. Una producción espectacular. Comprar entradas con antelación y vale la pena pagar por buenas butacas.",
    },

    // ── Día 4 · Kensington y despedida ───────────────────────────
    {
      title: "Desayuno en el hotel y salida",
      activity_date: d(3),
      activity_time: "08:30",
      place_name: "Hotel Park Plaza Westminster",
      address: "200 Westminster Bridge Rd, Londres",
      activity_kind: "lodging",
      latitude: 51.4984,
      longitude: -0.1144,
      rating: 3,
      comment: "El desayuno del hotel es correcto pero un poco caro. Para el último día está bien no tener que buscar sitio.",
    },
    {
      title: "Hyde Park y Kensington Gardens",
      activity_date: d(3),
      activity_time: "10:00",
      place_name: "Hyde Park",
      address: "Hyde Park, Londres",
      activity_kind: "nature",
      latitude: 51.5073,
      longitude: -0.1657,
      rating: 5,
      comment: "Perfecto para el último día, tranquilo y verde. Los patos del lago y los ciclistas crean un ambiente muy relajado.",
    },
    {
      title: "Victoria & Albert Museum",
      activity_date: d(3),
      activity_time: "11:30",
      place_name: "Victoria and Albert Museum",
      address: "Cromwell Rd, Londres",
      activity_kind: "museum",
      latitude: 51.4966,
      longitude: -0.1722,
      rating: 5,
      comment: "Colección de diseño, moda y arte decorativo sin igual. La sala de los moldes de yeso es impresionante. Gratuito y enormemente infrautilizado.",
    },
    {
      title: "Picnic de despedida junto al lago",
      activity_date: d(3),
      activity_time: "13:30",
      place_name: "Serpentine Lake, Hyde Park",
      address: "Hyde Park, Londres",
      activity_kind: "gastro_experience",
      latitude: 51.5047,
      longitude: -0.1702,
      rating: 5,
      comment: "Compramos comida en Waitrose y nos sentamos a orillas del lago. El cierre perfecto del viaje. ¡Repetiremos seguro!",
    },
    {
      title: "Vuelta al aeropuerto — Heathrow Express",
      activity_date: d(3),
      activity_time: "16:00",
      place_name: "Aeropuerto Heathrow T2",
      address: "Heathrow Airport, Londres",
      activity_kind: "transport",
      latitude: 51.4700,
      longitude: -0.4543,
      rating: 4,
      comment: "El Heathrow Express desde Paddington es la opción más rápida (15 min). Mucho mejor que el metro con maletas. Vale cada libra.",
    },
  ];
}

export type DemoExpenseSeed = {
  title: string;
  category: string;
  amount: number;
  currency: string;
  expense_date: string;
  payer_name: string;
  participant_names: string[];
  paid_by_names: string[];
  owed_by_names: string[];
  notes: string;
};

export function buildDemoExpenses(start_date: string, ownerName: string): DemoExpenseSeed[] {
  const all = [ownerName, "Ana", "Luis", "María"];
  const d1 = start_date;

  return [
    {
      title: "Cena en Borough Market",
      category: "food",
      amount: 86,
      currency: "GBP",
      expense_date: d1,
      payer_name: "Ana",
      participant_names: all,
      paid_by_names: ["Ana"],
      owed_by_names: all,
      notes: "Ejemplo en libras (moneda base del viaje).",
    },
    {
      title: "Entradas British Museum",
      category: "culture",
      amount: 48,
      currency: "EUR",
      expense_date: d1,
      payer_name: "Luis",
      participant_names: all,
      paid_by_names: ["Luis"],
      owed_by_names: all,
      notes: "Pagado en euros: el balance convierte a GBP.",
    },
    {
      title: "Oyster / transporte día 2",
      category: "transport",
      amount: 32,
      currency: "GBP",
      expense_date: d1,
      payer_name: ownerName,
      participant_names: [ownerName, "Ana", "Luis"],
      paid_by_names: [ownerName],
      owed_by_names: [ownerName, "Ana", "Luis"],
      notes: "Solo parte del grupo en este gasto.",
    },
    {
      title: "Souvenirs Covent Garden",
      category: "shopping",
      amount: 25,
      currency: "USD",
      expense_date: d1,
      payer_name: "María",
      participant_names: all,
      paid_by_names: ["María"],
      owed_by_names: all,
      notes: "Ejemplo en dólares: prueba el conversor en Gastos.",
    },
  ];
}

export type DemoRouteSeed = {
  title: string;
  day_offset: number;
  travel_mode: string;
  origin_name: string;
  destination_name: string;
  distance_text: string;
  duration_text: string;
};

export const DEMO_ROUTES: DemoRouteSeed[] = [
  // ── Día 1 ────────────────────────────────────────────────────
  {
    title: "Día 1 · Buckingham → Westminster",
    day_offset: 0,
    travel_mode: "walking",
    origin_name: "Buckingham Palace",
    destination_name: "Palacio de Westminster",
    distance_text: "1,3 km",
    duration_text: "16 min",
  },
  {
    title: "Día 1 · Westminster → Southbank",
    day_offset: 0,
    travel_mode: "walking",
    origin_name: "Puente de Westminster",
    destination_name: "Southbank Riverside Walk",
    distance_text: "0,5 km",
    duration_text: "7 min",
  },
  // ── Día 2 ────────────────────────────────────────────────────
  {
    title: "Día 2 · British Museum → National Gallery",
    day_offset: 1,
    travel_mode: "walking",
    origin_name: "British Museum",
    destination_name: "National Gallery",
    distance_text: "1,1 km",
    duration_text: "14 min",
  },
  {
    title: "Día 2 · Trafalgar Square → Borough Market",
    day_offset: 1,
    travel_mode: "transit",
    origin_name: "Trafalgar Square",
    destination_name: "Borough Market",
    distance_text: "3,2 km",
    duration_text: "18 min",
  },
  // ── Día 3 ────────────────────────────────────────────────────
  {
    title: "Día 3 · Tower Bridge → Brick Lane",
    day_offset: 2,
    travel_mode: "walking",
    origin_name: "Tower Bridge",
    destination_name: "Brick Lane",
    distance_text: "2,1 km",
    duration_text: "26 min",
  },
  {
    title: "Día 3 · Shoreditch → West End",
    day_offset: 2,
    travel_mode: "transit",
    origin_name: "Shoreditch High Street",
    destination_name: "Lyceum Theatre",
    distance_text: "4,8 km",
    duration_text: "22 min",
  },
  // ── Día 4 ────────────────────────────────────────────────────
  {
    title: "Día 4 · Hyde Park → V&A Museum",
    day_offset: 3,
    travel_mode: "walking",
    origin_name: "Hyde Park (entrada sur)",
    destination_name: "Victoria & Albert Museum",
    distance_text: "0,9 km",
    duration_text: "11 min",
  },
  {
    title: "Día 4 · Kensington → Heathrow",
    day_offset: 3,
    travel_mode: "transit",
    origin_name: "Paddington Station",
    destination_name: "Heathrow Terminal 2",
    distance_text: "24 km",
    duration_text: "15 min",
  },
];

