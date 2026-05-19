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
};

export function buildDemoActivities(start_date: string): DemoActivitySeed[] {
  const d = (offset: number) => {
    const x = new Date(`${start_date}T12:00:00`);
    x.setDate(x.getDate() + offset);
    return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(x);
  };

  return [
    {
      title: "Llegada y paseo por Westminster",
      activity_date: d(0),
      activity_time: "15:00",
      place_name: "Palacio de Westminster",
      address: "Westminster, Londres",
      activity_kind: "visit",
      latitude: 51.4995,
      longitude: -0.1248,
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
    },
    {
      title: "Mercado y cena en Borough",
      activity_date: d(1),
      activity_time: "19:30",
      place_name: "Borough Market",
      address: "Borough Market, Londres",
      activity_kind: "food",
      latitude: 51.5055,
      longitude: -0.091,
    },
    {
      title: "Tower Bridge y Tower of London",
      activity_date: d(2),
      activity_time: "11:00",
      place_name: "Tower Bridge",
      address: "Tower Bridge Rd, Londres",
      activity_kind: "visit",
      latitude: 51.5055,
      longitude: -0.0754,
    },
    {
      title: "Musical en West End",
      activity_date: d(2),
      activity_time: "20:00",
      place_name: "West End",
      address: "Soho, Londres",
      activity_kind: "night",
      latitude: 51.5136,
      longitude: -0.1313,
    },
    {
      title: "Hyde Park y despedida",
      activity_date: d(3),
      activity_time: "10:00",
      place_name: "Hyde Park",
      address: "Hyde Park, Londres",
      activity_kind: "nature",
      latitude: 51.5073,
      longitude: -0.1657,
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
