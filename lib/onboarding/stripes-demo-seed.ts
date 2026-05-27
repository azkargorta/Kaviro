/**
 * Stripes × Kaviro — Viaje demo: Chicago + Green Bay, 7 días, octubre 2026
 *
 * Itinerario real basado en el programa oficial de Stripes:
 * - Sáb 10 oct: Llegada Madrid → Chicago (vuelo nocturno / traslado aeropuerto)
 * - Dom 11 oct: EXCURSIÓN Lambeau Field — Bears AT Packers (Week 5 NFL, 3:25 PM CT)
 * - Lun 12 oct: Chicago — arquitectura, Navy Pier, Magnificent Mile
 * - Mar 13 oct: Chicago — Art Institute, teatro, comida local
 * - Mié 14 oct: Chicago — Chicago Bulls vs [TBD] (NBA Opening Week, United Center)
 * - Jue 15 oct: Chicago — Second City, blues, jazz, vida nocturna
 * - Vie 16 oct: Chicago Bears vs Patriots (TNF Week 7, 22 oct) ← ajuste al vie 16 para el demo
 *   [Nota: el partido de Bears en casa es 22 oct. Para el demo se usa el 16 como actividad
 *    de "partido en Soldier Field" dentro de la semana 11-17]
 * - Sáb 17 oct: Regreso — traslado aeropuerto, vuelo Chicago → Madrid
 *
 * Formato guardado en BD igual que demo-trip-seed.ts
 */

export const STRIPES_TRIP_NAME = "Stripes × Kaviro — Chicago & Lambeau Field 🏈";
export const STRIPES_TRIP_DESTINATION = "Chicago, Illinois, USA";
export const STRIPES_TRIP_BASE_CURRENCY = "USD";

export const STRIPES_GHOST_PARTICIPANTS = [
  { display_name: "Fidel", role: "organizer" as const },
  { display_name: "Txema", role: "editor" as const },
  { display_name: "Carlos", role: "editor" as const },
  { display_name: "Marta", role: "editor" as const },
  { display_name: "Javi", role: "viewer" as const },
  { display_name: "Ana", role: "viewer" as const },
  { display_name: "Roberto", role: "viewer" as const },
  { display_name: "Silvia", role: "viewer" as const },
  { display_name: "Pablo", role: "viewer" as const },
  { display_name: "Lucía", role: "viewer" as const },
  { display_name: "Marcos", role: "viewer" as const },
  { display_name: "Elena", role: "viewer" as const },
];

export type StripesActivitySeed = {
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
  notes?: string | null;
};

export function buildStripesActivities(start_date: string): StripesActivitySeed[] {
  const d = (offset: number) => {
    const x = new Date(`${start_date}T12:00:00`);
    x.setDate(x.getDate() + offset);
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric", month: "2-digit", day: "2-digit"
    }).format(x);
  };

  return [
    // ── DÍA 1 · Sábado — Llegada desde Madrid ──────────────────────────────
    {
      title: "Vuelo Madrid (MAD) → Chicago O'Hare (ORD)",
      activity_date: d(0),
      activity_time: "07:30",
      place_name: "Aeropuerto Adolfo Suárez Madrid-Barajas T4",
      address: "Av. de la Hispanidad, s/n, 28042 Madrid",
      activity_kind: "transport",
      latitude: 40.4983,
      longitude: -3.5676,
      comment: "Salir de casa 3 horas antes — recomendamos estar en T4 a las 07:30 para el vuelo de las 10:25. Vuelo directo IB6251 o similar (~9h). Llegada a O'Hare ~12:30 hora local (7h de diferencia).",
      notes: "Llevar pasaporte, ESTA tramitado y seguro de viaje. Franquicia de equipaje incluida.",
    },
    {
      title: "Llegada a O'Hare y trámites de inmigración",
      activity_date: d(0),
      activity_time: "12:30",
      place_name: "Chicago O'Hare International Airport (ORD)",
      address: "10000 W O'Hare Ave, Chicago, IL 60666",
      activity_kind: "transport",
      latitude: 41.9742,
      longitude: -87.9073,
      comment: "Calcular ~1h para inmigración + recogida de maletas. El grupo se reagrupa en la zona de llegadas T5 (internacional). Blue Line directa al centro: 45 min, 2.50$.",
      notes: "Alternativa: tren Blue Line al centro (~45 min, 2.50$) o Uber compartido (~35$).",
    },
    {
      title: "Check-in — Hotel Hyatt Regency Chicago",
      activity_date: d(0),
      activity_time: "15:30",
      place_name: "Hyatt Regency Chicago",
      address: "151 E Wacker Dr, Chicago, IL 60601",
      activity_kind: "lodging",
      latitude: 41.8863,
      longitude: -87.6225,
      rating: 5,
      comment: "Ubicación perfecta junto al río Chicago y a 10 min a pie del Millennium Park. El check-in es a las 15:00 — si llegáis antes podéis dejar maletas y salir.",
    },
    {
      title: "Primera toma de contacto con Chicago — Riverwalk",
      activity_date: d(0),
      activity_time: "17:00",
      place_name: "Chicago Riverwalk",
      address: "Chicago Riverwalk, Chicago, IL 60601",
      activity_kind: "visit",
      latitude: 41.8875,
      longitude: -87.6281,
      comment: "El paseo junto al río es perfecto para los primeros pasos. Bares y restaurantes con terraza, vistas a los rascacielos. Ideal para sacudirse el jet lag.",
    },
    {
      title: "Cena de bienvenida — Grupo Stripes",
      activity_date: d(0),
      activity_time: "19:30",
      place_name: "Portillo's Hot Dogs — Navy Pier",
      address: "700 E Grand Ave, Chicago, IL 60611",
      activity_kind: "restaurant",
      latitude: 41.8917,
      longitude: -87.6033,
      comment: "Primera toma de contacto con la gastronomía de Chicago: el Chicago Dog y el Italian Beef son obligatorios. Sin ketchup, que aquí es un sacrilegio 😄",
    },

    // ── DÍA 2 · Domingo — EXCURSIÓN LAMBEAU FIELD ──────────────────────────
    {
      title: "Salida en autobús a Green Bay (Lambeau Field)",
      activity_date: d(1),
      activity_time: "07:00",
      place_name: "Hotel Hyatt Regency Chicago — Salida grupo",
      address: "151 E Wacker Dr, Chicago, IL 60601",
      activity_kind: "excursion",
      latitude: 41.8863,
      longitude: -87.6225,
      comment: "Bus privado Stripes. Salida puntual a las 07:00 — el viaje son ~2h 45min. Se para en una gasolinera a mitad para estirar las piernas. Llevar ropa de abrigo: octubre en Green Bay hace frío.",
      notes: "🏈 PARTIDO: Chicago Bears AT Green Bay Packers · Week 5 NFL · Lambeau Field · 15:25 CT (FOX). Precio estimado entradas: 180-350$ por persona.",
    },
    {
      title: "Tailgate en el aparcamiento de Lambeau Field",
      activity_date: d(1),
      activity_time: "11:00",
      place_name: "Lambeau Field Parking — Tailgate Zone",
      address: "1265 Lombardi Ave, Green Bay, WI 54304",
      activity_kind: "activity",
      latitude: 44.5013,
      longitude: -88.0622,
      comment: "La experiencia del tailgate es tan buena como el partido. Barbacoas, cerveza, fans vestidos de verde y amarillo (y algún valiente de azul marino). Llegar con 2h de antelación.",
    },
    {
      title: "🏈 NFL · Chicago Bears AT Green Bay Packers",
      activity_date: d(1),
      activity_time: "15:25",
      place_name: "Lambeau Field",
      address: "1265 Lombardi Ave, Green Bay, WI 54304",
      activity_kind: "activity",
      latitude: 44.5013,
      longitude: -88.0622,
      rating: 5,
      comment: "Lambeau Field es uno de los estadios más legendarios del fútbol americano. La rivalidad Bears-Packers es la más larga y antigua de la NFL (desde 1921). Temperatura estimada: 8-14°C. Llevar abrigo, bufanda y ganas de gritar.",
      notes: "Week 5 NFL · FOX · 4:25 PM ET / 3:25 PM CT. Bears vs Packers — rivalidad histórica desde 1921.",
    },
    {
      title: "Regreso a Chicago en autobús",
      activity_date: d(1),
      activity_time: "19:30",
      place_name: "Lambeau Field — Salida tras el partido",
      address: "1265 Lombardi Ave, Green Bay, WI 54304",
      activity_kind: "transport",
      latitude: 44.5013,
      longitude: -88.0622,
      comment: "Salida ~30 min tras el final del partido. Llegada al hotel sobre las 22:30-23:00. Cena libre en el autobús o en el hotel.",
    },

    // ── DÍA 3 · Lunes — Chicago: Arquitectura y lago ───────────────────────
    {
      title: "Crucero de arquitectura por el río Chicago",
      activity_date: d(2),
      activity_time: "10:00",
      place_name: "Chicago Architecture Center River Cruise",
      address: "111 E Wacker Dr, Chicago, IL 60601",
      activity_kind: "tour",
      latitude: 41.8863,
      longitude: -87.6232,
      rating: 5,
      comment: "El tour de arquitectura en barco es una de las mejores experiencias de Chicago. 90 minutos navegando por el río mientras el guía explica los edificios más icónicos. Reservar con antelación.",
      notes: "Precio: ~45$/persona. Dura 90 min. Salen cada hora desde las 9:00.",
    },
    {
      title: "Millennium Park y la Cloud Gate (El Frijol)",
      activity_date: d(2),
      activity_time: "12:00",
      place_name: "Millennium Park",
      address: "201 E Randolph St, Chicago, IL 60602",
      activity_kind: "visit",
      latitude: 41.8826,
      longitude: -87.6226,
      rating: 5,
      comment: "La Cloud Gate (aka 'El Frijol') es el símbolo de Chicago. Gratis, foto obligatoria. El parque también tiene la Crown Fountain y el Pritzker Pavilion.",
    },
    {
      title: "Comida en Publican Quality Meats",
      activity_date: d(2),
      activity_time: "13:30",
      place_name: "Publican Quality Meats",
      address: "825 W Fulton Market, Chicago, IL 60607",
      activity_kind: "restaurant",
      latitude: 41.8863,
      longitude: -87.6486,
      comment: "Uno de los mejores sitios de Chicago para carne. El barrio de Fulton Market es el epicentro gastronómico de la ciudad. Reserva recomendada.",
    },
    {
      title: "Navy Pier y lago Michigan",
      activity_date: d(2),
      activity_time: "15:30",
      place_name: "Navy Pier",
      address: "600 E Grand Ave, Chicago, IL 60611",
      activity_kind: "visit",
      latitude: 41.8916,
      longitude: -87.6065,
      comment: "Paseo por el muelle más famoso de Chicago con vistas al lago Michigan. La noria Centennial Wheel tiene unas vistas espectaculares. Entrada libre al paseo, la noria cuesta ~18$.",
    },
    {
      title: "Chicago Deep Dish en Lou Malnati's",
      activity_date: d(2),
      activity_time: "19:00",
      place_name: "Lou Malnati's Pizzeria — River North",
      address: "439 N Wells St, Chicago, IL 60654",
      activity_kind: "restaurant",
      latitude: 41.8896,
      longitude: -87.6341,
      rating: 5,
      comment: "La pizza deep dish de Chicago es casi una religión. Lou Malnati's es el templo. Pedir la Malnati Chicago Classic. La pizza tarda 45 min en hacerse — llegar con hambre.",
    },

    // ── DÍA 4 · Martes — Arte, cultura y teatro ────────────────────────────
    {
      title: "Art Institute of Chicago",
      activity_date: d(3),
      activity_time: "09:30",
      place_name: "Art Institute of Chicago",
      address: "111 S Michigan Ave, Chicago, IL 60603",
      activity_kind: "museum",
      latitude: 41.8796,
      longitude: -87.6237,
      rating: 5,
      comment: "Uno de los mejores museos de arte del mundo. Ver obligatoriamente: Un Dimanche sur La Grande Jatte (Seurat), Nighthawks (Hopper) y la colección de armaduras medievales. Calcular 2-3 horas.",
      notes: "Precio: 25$/adulto. Abierto 10:30-17:00. Cerrado los martes — verificar.",
    },
    {
      title: "Comida en el mercado de Eataly Chicago",
      activity_date: d(3),
      activity_time: "13:00",
      place_name: "Eataly Chicago",
      address: "43 E Ohio St, Chicago, IL 60611",
      activity_kind: "food",
      latitude: 41.8921,
      longitude: -87.6278,
      comment: "El supermercado-restaurante italiano más grande de Chicago. Perfecta para una comida informal en grupo — cada uno elige su puesto. Pasta, pizza, embutidos, vino.",
    },
    {
      title: "Tour en bici por el lakeside path",
      activity_date: d(3),
      activity_time: "15:00",
      place_name: "Millennium Park Bike Station",
      address: "Millennium Park, Chicago, IL 60602",
      activity_kind: "tour",
      latitude: 41.8826,
      longitude: -87.6226,
      comment: "El camino junto al lago es uno de los más bonitos de cualquier ciudad americana. En bici se llega hasta el Navy Pier y más allá. Alquiler de bicis en Divvy (~30$/3h).",
      notes: "~18 km de recorrido junto al lago. Ideal con buen tiempo.",
    },
    {
      title: "The Second City — Comedia en vivo",
      activity_date: d(3),
      activity_time: "20:00",
      place_name: "The Second City",
      address: "1616 N Wells St, Chicago, IL 60614",
      activity_kind: "culture",
      latitude: 41.9118,
      longitude: -87.6356,
      rating: 5,
      comment: "El teatro de comedia improvisada más famoso del mundo. De aquí salieron Bill Murray, Tina Fey, Steve Carell y muchos más. Aunque el humor es en inglés, la actuación es tan física que se entiende perfectamente.",
      notes: "Precio: ~30$/persona. Reserva obligatoria. Hay bar en el local.",
    },

    // ── DÍA 5 · Miércoles — NBA Chicago Bulls ──────────────────────────────
    {
      title: "Visita al barrio de Wicker Park",
      activity_date: d(4),
      activity_time: "10:00",
      place_name: "Wicker Park, Chicago",
      address: "Wicker Park, Chicago, IL 60622",
      activity_kind: "neighborhood",
      latitude: 41.9082,
      longitude: -87.6786,
      comment: "El barrio más hipster de Chicago: murales, cafés de especialidad, tiendas vintage y la mejor brunch scene de la ciudad. El mercado de Wicker Park es perfecto para souvenirs.",
    },
    {
      title: "Willis Tower — Skydeck y The Ledge",
      activity_date: d(4),
      activity_time: "13:00",
      place_name: "Willis Tower Skydeck",
      address: "233 S Wacker Dr, Chicago, IL 60606",
      activity_kind: "visit",
      latitude: 41.8789,
      longitude: -87.6359,
      rating: 4,
      comment: "El edificio más alto de Chicago (442m). The Ledge son cajas de cristal que sobresalen del edificio — las vistas y el vértigo están garantizados. Comprar entradas online para evitar colas.",
      notes: "Precio: ~28$/adulto. El Ledge puede estar cerrado por meteorología.",
    },
    {
      title: "Comida en Giordano's (otra deep dish, pero diferente estilo)",
      activity_date: d(4),
      activity_time: "15:00",
      place_name: "Giordano's — Chicago Loop",
      address: "130 E Randolph St, Chicago, IL 60601",
      activity_kind: "restaurant",
      latitude: 41.8849,
      longitude: -87.6233,
      comment: "Si Lou Malnati's es la referencia de la pizza deep dish, Giordano's es su rival eterno. Este hace la pizza más rellena y con doble masa. Debate asegurado en el grupo: ¿cuál es mejor?",
    },
    {
      title: "🏀 NBA · Chicago Bulls — Partido en United Center",
      activity_date: d(4),
      activity_time: "19:30",
      place_name: "United Center",
      address: "1901 W Madison St, Chicago, IL 60612",
      activity_kind: "activity",
      latitude: 41.8806,
      longitude: -87.6742,
      rating: 5,
      comment: "El templo del basket de Chicago. La NBA arranca el 20 de octubre — primera semana de la temporada. Entrada al recinto 1 hora antes para ver el calentamiento. Estatua de Michael Jordan en el exterior: foto obligatoria.",
      notes: "🏀 NBA Opening Week 2026-27. Precio estimado entradas: 80-200$ por persona. Confirmar partido en nba.com cuando salga el calendario.",
    },
    {
      title: "Cena tras el partido en el barrio de West Loop",
      activity_date: d(4),
      activity_time: "22:30",
      place_name: "Girl & The Goat",
      address: "800 W Randolph St, Chicago, IL 60607",
      activity_kind: "restaurant",
      latitude: 41.8842,
      longitude: -87.6476,
      rating: 5,
      comment: "Uno de los restaurantes más famosos de Chicago, del chef Stephanie Izard. Cocina americana de autor con mucho producto local. Reserva con semanas de antelación.",
    },

    // ── DÍA 6 · Jueves — Blues, jazz y vida nocturna ───────────────────────
    {
      title: "Chicago History Museum",
      activity_date: d(5),
      activity_time: "10:00",
      place_name: "Chicago History Museum",
      address: "1601 N Clark St, Chicago, IL 60614",
      activity_kind: "museum",
      latitude: 41.9120,
      longitude: -87.6319,
      comment: "El museo más importante sobre la historia de Chicago: el Gran Incendio de 1871, la era de Al Capone, el movimiento de los derechos civiles y la historia de los Bulls. Muy visual e interactivo.",
    },
    {
      title: "Tour en bus panorámico por Chicago",
      activity_date: d(5),
      activity_time: "13:00",
      place_name: "Big Bus Chicago — Parada Navy Pier",
      address: "600 E Grand Ave, Chicago, IL 60611",
      activity_kind: "tour",
      latitude: 41.8916,
      longitude: -87.6065,
      comment: "El bus con techo abierto es perfecto para ver los barrios que no hemos recorrido a pie: Lincoln Park, Lakeview, el Grant Park. Hop on-hop off — se puede subir y bajar en cada parada.",
      notes: "Precio: ~40$/persona. Día completo. Sale cada 30 minutos.",
    },
    {
      title: "Comida en Boka — Lincoln Park",
      activity_date: d(5),
      activity_time: "13:30",
      place_name: "Boka Restaurant",
      address: "1729 N Halsted St, Chicago, IL 60614",
      activity_kind: "restaurant",
      latitude: 41.9136,
      longitude: -87.6489,
      comment: "Cocina de temporada con producto local. Uno de los restaurantes con mejor relación calidad-precio del barrio de Lincoln Park.",
    },
    {
      title: "Blues en vivo — Buddy Guy's Legends",
      activity_date: d(5),
      activity_time: "19:00",
      place_name: "Buddy Guy's Legends",
      address: "700 S Wabash Ave, Chicago, IL 60605",
      activity_kind: "night",
      latitude: 41.8752,
      longitude: -87.6263,
      rating: 5,
      comment: "El local de blues más famoso de Chicago, propiedad de uno de los guitarristas de blues más importantes del mundo. Música en directo todos los días. Atmosphere auténtica, precios razonables y muy buen bourbon.",
    },
    {
      title: "Jazz en vivo — Andy's Jazz Club",
      activity_date: d(5),
      activity_time: "21:30",
      place_name: "Andy's Jazz Club",
      address: "11 E Hubbard St, Chicago, IL 60611",
      activity_kind: "night",
      latitude: 41.8906,
      longitude: -87.6282,
      comment: "Chicago es la cuna del jazz además del blues. Andy's lleva décadas siendo referencia en el barrio de River North. Sesiones a partir de las 21:00.",
    },

    // ── DÍA 7 · Viernes — Mañana libre y regreso ───────────────────────────
    {
      title: "Mañana libre — Magnificent Mile y compras",
      activity_date: d(6),
      activity_time: "09:00",
      place_name: "Magnificent Mile",
      address: "N Michigan Ave, Chicago, IL 60611",
      activity_kind: "shopping",
      latitude: 41.8946,
      longitude: -87.6241,
      comment: "La gran avenida comercial de Chicago. Últimas compras, souvenirs y el desayuno en cualquiera de los cafés de la zona. Tiempo libre para quien quiera explorar por su cuenta.",
    },
    {
      title: "Almuerzo de despedida — Chicago chophouse",
      activity_date: d(6),
      activity_time: "12:00",
      place_name: "Chicago Cut Steakhouse",
      address: "300 N LaSalle Dr, Chicago, IL 60654",
      activity_kind: "restaurant",
      latitude: 41.8881,
      longitude: -87.6317,
      rating: 5,
      comment: "La mejor despedida de Chicago es una buena chuleta con vistas al río. El Chicago Cut es uno de los mejores steakhouses de la ciudad. El grupo se despide aquí antes de ir al aeropuerto.",
    },
    {
      title: "Traslado hotel → Aeropuerto O'Hare",
      activity_date: d(6),
      activity_time: "15:00",
      place_name: "Chicago O'Hare International Airport (ORD)",
      address: "10000 W O'Hare Ave, Chicago, IL 60666",
      activity_kind: "transport",
      latitude: 41.9742,
      longitude: -87.9073,
      comment: "Salir del hotel a las 15:00 para llegar al aeropuerto con 3 horas de antelación. El vuelo de regreso a Madrid suele ser nocturno (19:00-21:00 CT). Llegada a Madrid al día siguiente por la mañana.",
      notes: "Revisar documentación: pasaporte, tarjeta de embarque, seguro de viaje. El equipaje facturado debe estar en el mostrador 2h antes del vuelo internacional.",
    },
  ];
}

// ── Gastos del viaje ────────────────────────────────────────────────────────
export type StripesExpenseSeed = {
  description: string;
  amount: number;
  currency: string;
  category: string;
  paid_by_name: string;
  split_among: "all" | string[];
  date: string;
};

export function buildStripesExpenses(start_date: string): StripesExpenseSeed[] {
  const d = (offset: number) => {
    const x = new Date(`${start_date}T12:00:00`);
    x.setDate(x.getDate() + offset);
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric", month: "2-digit", day: "2-digit"
    }).format(x);
  };

  return [
    // Día 1
    { description: "Uber del aeropuerto al hotel (x3 coches)", amount: 120, currency: "USD", category: "transport", paid_by_name: "Fidel", split_among: "all", date: d(0) },
    { description: "Cena bienvenida Portillo's — 12 personas", amount: 340, currency: "USD", category: "food", paid_by_name: "Txema", split_among: "all", date: d(0) },
    // Día 2
    { description: "Bus privado Chicago → Green Bay (ida y vuelta)", amount: 1800, currency: "USD", category: "transport", paid_by_name: "Fidel", split_among: "all", date: d(1) },
    { description: "Entradas Lambeau Field — 12 entradas", amount: 3200, currency: "USD", category: "entertainment", paid_by_name: "Fidel", split_among: "all", date: d(1) },
    { description: "Tailgate — cervezas, comida y merchandising", amount: 280, currency: "USD", category: "food", paid_by_name: "Carlos", split_among: "all", date: d(1) },
    // Día 3
    { description: "Crucero arquitectura — 12 personas", amount: 540, currency: "USD", category: "activities", paid_by_name: "Marta", split_among: "all", date: d(2) },
    { description: "Cena Lou Malnati's deep dish — grupo", amount: 290, currency: "USD", category: "food", paid_by_name: "Javi", split_among: "all", date: d(2) },
    // Día 4
    { description: "The Second City — 12 entradas", amount: 360, currency: "USD", category: "entertainment", paid_by_name: "Txema", split_among: "all", date: d(3) },
    // Día 5
    { description: "Entradas NBA United Center — 12 personas", amount: 1680, currency: "USD", category: "entertainment", paid_by_name: "Fidel", split_among: "all", date: d(4) },
    { description: "Willis Tower Skydeck — grupo", amount: 336, currency: "USD", category: "activities", paid_by_name: "Ana", split_among: "all", date: d(4) },
    { description: "Cena Girl & The Goat", amount: 520, currency: "USD", category: "food", paid_by_name: "Roberto", split_among: "all", date: d(4) },
    // Día 6
    { description: "Noche blues Buddy Guy's + jazz Andy's", amount: 240, currency: "USD", category: "entertainment", paid_by_name: "Marcos", split_among: "all", date: d(5) },
    // Día 7
    { description: "Almuerzo despedida Chicago Cut Steakhouse", amount: 780, currency: "USD", category: "food", paid_by_name: "Txema", split_among: "all", date: d(6) },
    { description: "Ubers varios durante la semana", amount: 320, currency: "USD", category: "transport", paid_by_name: "Elena", split_among: "all", date: d(6) },
  ];
}
