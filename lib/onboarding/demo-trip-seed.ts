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
    // ── Día 1 ──────────────────────────────────────────────────
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
      title: "Paseo por Westminster y Big Ben",
      activity_date: d(0),
      activity_time: "15:00",
      place_name: "Palacio de Westminster",
      address: "Westminster, Londres",
      activity_kind: "visit",
      latitude: 51.4995,
      longitude: -0.1248,
      rating: 5,
      comment: "Impresionante en persona. Vale la pena llegar al atardecer para ver las luces reflejadas en el Támesis.",
    },
    {
      title: "Cena en el Southbank",
      activity_date: d(0),
      activity_time: "20:00",
      place_name: "The Anchor Bankside",
      address: "34 Park St, Londres",
      activity_kind: "food",
      latitude: 51.5066,
      longitude: -0.0939,
      rating: 4,
      comment: "Pub tradicional con buena carta. El fish & chips estaba muy bien. Un poco lleno pero compensó el ambiente.",
    },
    // ── Día 2 ──────────────────────────────────────────────────
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
      title: "Almuerzo en Bloomsbury",
      activity_date: d(1),
      activity_time: "13:30",
      place_name: "Dishoom Bloomsbury",
      address: "5 Upper St Martin's Ln, Londres",
      activity_kind: "restaurant",
      latitude: 51.5127,
      longitude: -0.1266,
      rating: 5,
      comment: "Lo mejor del viaje en tema gastronómico. El bacon naan de desayuno y el dal negro son imprescindibles. Reservar con antelación.",
    },
    {
      title: "National Gallery",
      activity_date: d(1),
      activity_time: "15:30",
      place_name: "National Gallery",
      address: "Trafalgar Square, Londres",
      activity_kind: "museum",
      latitude: 51.5089,
      longitude: -0.1283,
      rating: 4,
      comment: "Colección impresionante. Especialmente los Velázquez e impresionistas. Gratis y vale mucho la pena.",
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
      comment: "Ambiente único y variedad enorme. Probamos quesos artesanales y una tabla de embutidos. Llegar pronto para encontrar sitio.",
    },
    // ── Día 3 ──────────────────────────────────────────────────
    {
      title: "Tower Bridge y Tower of London",
      activity_date: d(2),
      activity_time: "10:00",
      place_name: "Tower Bridge",
      address: "Tower Bridge Rd, Londres",
      activity_kind: "visit",
      latitude: 51.5055,
      longitude: -0.0754,
      rating: 5,
      comment: "El paseo por el puente de cristal da vértigo (en el buen sentido). La Torre de Londres merece al menos 2 horas.",
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
      rating: 4,
      comment: "Cola de 15 minutos pero completamente vale la pena. El bagel de salmón ahumado es legendario y muy barato.",
    },
    {
      title: "Shoreditch y street art",
      activity_date: d(2),
      activity_time: "15:00",
      place_name: "Shoreditch High Street",
      address: "Shoreditch, Londres",
      activity_kind: "neighborhood",
      latitude: 51.5241,
      longitude: -0.0796,
      rating: 4,
      comment: "Barrio muy chulo para explorar a pie. Tiendas vintage, murales de Banksy y muchos cafés de especialidad. Imprescindible la zona de Boxpark.",
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
    // ── Día 4 ──────────────────────────────────────────────────
    {
      title: "Desayuno en el hotel y salida",
      activity_date: d(3),
      activity_time: "08:30",
      place_name: "Hotel Park Plaza Westminster",
      address: "200 Westminster Bridge Rd, Londres",
      activity_kind: "lodging",
      latitude: 51.4984,
      longitude: -0.1144,
      rating: null,
      comment: null,
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
      rating: 4,
      comment: "Perfecto para el último día, tranquilo y verde. Los patos del lago y los ciclistas crean un ambiente muy relajado.",
    },
    {
      title: "Picnic de despedida",
      activity_date: d(3),
      activity_time: "12:30",
      place_name: "Serpentine Lake, Hyde Park",
      address: "Hyde Park, Londres",
      activity_kind: "gastro_experience",
      latitude: 51.5047,
      longitude: -0.1702,
      rating: 5,
      comment: "Compramos comida en Waitrose y nos sentamos a orillas del lago. El cierre perfecto del viaje. ¡Repetiremos!",
    },
    {
      title: "Vuelta al aeropuerto",
      activity_date: d(3),
      activity_time: "16:00",
      place_name: "Aeropuerto Heathrow T2",
      address: "Heathrow Airport, Londres",
      activity_kind: "transport",
      latitude: 51.4700,
      longitude: -0.4543,
      rating: null,
      comment: null,
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

export const DEMO_ROUTE_SEED = {
  title: "Día 1 · Centro histórico",
  route_date: null as string | null,
  travel_mode: "walking",
  origin_name: "Westminster",
  destination_name: "Covent Garden",
  distance_text: "2,4 km",
  duration_text: "32 min",
};

export const DEMO_ROUTE_SEED_2 = {
  title: "Día 2 · East London",
  route_date: null as string | null,
  travel_mode: "walking",
  origin_name: "Tower Bridge",
  destination_name: "Borough Market",
  distance_text: "1,8 km",
  duration_text: "22 min",
};

export const DEMO_ROUTE_SEED_3 = {
  title: "Día 3 · Parks & Museums",
  route_date: null as string | null,
  travel_mode: "transit",
  origin_name: "Hyde Park",
  destination_name: "British Museum",
  distance_text: "4,2 km",
  duration_text: "18 min",
};
