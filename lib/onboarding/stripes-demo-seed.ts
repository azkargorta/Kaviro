/**
 * Stripes Sports Trips × Kaviro — Viaje: Chicago + Lambeau Field, 7 días, octubre 2026
 *
 * Calendario deportivo real (NFL 2026):
 * - Dom 11 oct: Bears @ Packers en Lambeau Field (Week 5, 15:25 CT, FOX)
 * - Jue 22 oct: Bears vs Patriots en Soldier Field (Week 7 TNF) — extensión opcional
 *
 * NBA 2026-27: calendario regular pendiente de publicación; slot mié 14 oct en United Center
 * (alternativa pretemporada dom 12 oct vs Bucks si encaja mejor tras Lambeau).
 *
 * Itinerario:
 * - Sáb 10 oct: Vuelo Madrid → Chicago (3 h en aeropuerto antes del embarque)
 * - Dom 11 oct: Excursión Lambeau Field — Bears @ Packers
 * - Lun 12 oct: Soldier Field tour + arquitectura en barco
 * - Mar 13 oct: Art Institute, teatro Second City
 * - Mié 14 oct: Chicago Bulls en United Center
 * - Jue 15 oct: Museo, blues/jazz o tiempo libre
 * - Vie 16 oct: Magnificent Mile + regreso Madrid (3 h en aeropuerto)
 */

export const STRIPES_TRIP_NAME = "Viaje con Stripes · Chicago & Lambeau Field 🏈🏀";
export const STRIPES_TRIP_DESTINATION = "Chicago, Illinois, USA";
export const STRIPES_TRIP_BASE_CURRENCY = "USD";
export const STRIPES_TRIP_PARTNER = "stripes";

export function stripesTripDateRange(): { start_date: string; end_date: string } {
  return { start_date: "2026-10-10", end_date: "2026-10-16" };
}

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
      comment: "Salir de casa 3 horas antes — estar en T4 a las 07:30 para el vuelo de las 10:25. Vuelo directo IB6251 o similar (~9 h). Llegada a O'Hare ~12:30 hora local.",
      notes: "Pasaporte, ESTA y seguro de viaje. Franquicia de equipaje según tarifa Stripes.",
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
      comment: "Calcular ~1 h inmigración + maletas. Reagrupación en llegadas internacionales T5. Opciones al centro: Blue Line (~45 min, 2,50 $) o Uber compartido (~35 $).",
    },
    {
      title: "Traslado aeropuerto → hotel (autobús / shuttle Stripes)",
      activity_date: d(0),
      activity_time: "14:00",
      place_name: "Chicago O'Hare — Punto de encuentro Stripes",
      address: "Terminal 5, Chicago O'Hare, IL 60666",
      activity_kind: "transport",
      latitude: 41.9742,
      longitude: -87.9073,
      comment: "Autobús privado Stripes o shuttle coordinado. Punto de encuentro: zona de llegadas T5, cartel Stripes Sports Trips. Salida cuando esté reunido el grupo (~14:00-14:30).",
      notes: "Si llegas antes del bus: espera en T5. Coordinador Fidel confirma hora exacta por WhatsApp el día anterior.",
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
      comment: "Check-in 15:00. Si la habitación no está lista, dejar maletas en conserjería y salir a comer.",
    },
    {
      title: "Comida — Al's Beef (Italian beef clásico)",
      activity_date: d(0),
      activity_time: "16:00",
      place_name: "Al's #1 Italian Beef",
      address: "1079 W Taylor St, Chicago, IL 60607",
      activity_kind: "restaurant",
      latitude: 41.8690,
      longitude: -87.6525,
      comment: "Primer contacto con la comida de Chicago: Italian beef mojado en su jugo. Opción más ligera: Garrett Popcorn en Michigan Avenue si preferís algo rápido antes del paseo.",
    },
    {
      title: "Paseo Chicago Riverwalk y Michigan Avenue",
      activity_date: d(0),
      activity_time: "17:30",
      place_name: "Chicago Riverwalk",
      address: "Chicago Riverwalk, Chicago, IL 60601",
      activity_kind: "visit",
      latitude: 41.8875,
      longitude: -87.6281,
      comment: "Paseo suave para estirar las piernas tras el vuelo. Vistas al río, rascacielos y el DuSable Bridge. Ideal para sacudirse el jet lag.",
    },
    {
      title: "Cena de bienvenida — Portillo's Hot Dogs",
      activity_date: d(0),
      activity_time: "19:30",
      place_name: "Portillo's — River North",
      address: "100 W Ontario St, Chicago, IL 60654",
      activity_kind: "restaurant",
      latitude: 41.8933,
      longitude: -87.6317,
      comment: "Cena de grupo Stripes: Chicago Dog, Italian beef y chocolate cake shake. Sin ketchup en el perrito — aquí es ley no escrita.",
    },

    // ── DÍA 2 · Domingo — EXCURSIÓN LAMBEAU FIELD ──────────────────────────
    {
      title: "Desayuno en el hotel — antes de la excursión",
      activity_date: d(1),
      activity_time: "06:15",
      place_name: "Hyatt Regency Chicago — Restaurante",
      address: "151 E Wacker Dr, Chicago, IL 60601",
      activity_kind: "restaurant",
      latitude: 41.8863,
      longitude: -87.6225,
      comment: "Desayuno continental incluido o buffet en el hotel. Comer algo caliente: el día es largo y en Green Bay hará frío.",
    },
    {
      title: "Punto de recogida autobús Stripes — Lobby del hotel",
      activity_date: d(1),
      activity_time: "06:45",
      place_name: "Hyatt Regency Chicago — Lobby principal",
      address: "151 E Wacker Dr, Chicago, IL 60601",
      activity_kind: "transport",
      latitude: 41.8863,
      longitude: -87.6225,
      comment: "Estar en el lobby a las 06:45 con abrigo y entrada impresa. El autobús sale puntualmente a las 07:00 — no se espera a retrasados.",
      notes: "Coordinador: Fidel. Plazas numeradas. Equipaje pequeño permitido en el bus (mochila).",
    },
    {
      title: "Autobús Stripes · Salida Chicago → Green Bay",
      activity_date: d(1),
      activity_time: "07:00",
      place_name: "Hyatt Regency Chicago — Salida grupo",
      address: "151 E Wacker Dr, Chicago, IL 60601",
      activity_kind: "excursion",
      latitude: 41.8863,
      longitude: -87.6225,
      comment: "Viaje ~2 h 45 min por I-94 N. WiFi en el bus. Documental opcional sobre la rivalidad Bears-Packers durante el trayecto.",
      notes: "🏈 Bears @ Packers · Lambeau Field · 11 oct 2026 · 15:25 CT · FOX.",
    },
    {
      title: "Parada técnica + comida rápida en ruta",
      activity_date: d(1),
      activity_time: "09:15",
      place_name: "Rest stop I-94 — Kenosha area",
      address: "I-94, Kenosha, WI",
      activity_kind: "restaurant",
      latitude: 42.5847,
      longitude: -87.8779,
      comment: "Parada de 20-25 min: baños, café y bocadillos (Subway, gasolinera). Última parada cómoda antes de Green Bay.",
    },
    {
      title: "Llegada Lambeau Field — Tailgate Stripes",
      activity_date: d(1),
      activity_time: "11:00",
      place_name: "Lambeau Field Parking — Tailgate Zone",
      address: "1265 Lombardi Ave, Green Bay, WI 54304",
      activity_kind: "activity",
      latitude: 44.5013,
      longitude: -88.0622,
      comment: "Comida tipo tailgate incluida: hamburguesas, bratwurst, chili y bebidas. Llegar 2 h antes del kickoff. Ambiente verde y amarillo (Packers) con fans Bears en azul marino.",
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
      comment: "Rivalidad histórica desde 1921. Temperatura estimada 8-14 °C — abrigo, guantes y gorro. Entrar al recinto 1 h antes para ver calentamiento.",
      notes: "Week 5 NFL · 15:25 CT (16:25 ET) · FOX.",
    },
    {
      title: "Autobús Stripes · Regreso Lambeau → Chicago",
      activity_date: d(1),
      activity_time: "19:30",
      place_name: "Lambeau Field — Aparcamiento autobuses",
      address: "1265 Lombardi Ave, Green Bay, WI 54304",
      activity_kind: "transport",
      latitude: 44.5013,
      longitude: -88.0622,
      comment: "Salida ~30 min tras el final. Snacks y agua en el bus. Llegada estimada al hotel: 22:30-23:00.",
    },
    {
      title: "Cena tardía — Portillo's cerca del hotel",
      activity_date: d(1),
      activity_time: "23:00",
      place_name: "Portillo's — River North",
      address: "100 W Ontario St, Chicago, IL 60654",
      activity_kind: "restaurant",
      latitude: 41.8933,
      longitude: -87.6317,
      comment: "Cena ligera tras el regreso. Quien prefiera descansar puede pedir room service en el hotel. El grupo principal queda aquí para recapitular el partido.",
    },

    // ── DÍA 3 · Lunes — Soldier Field + arquitectura ───────────────────────
    {
      title: "Desayuno — Wildberry Pancakes & Cafe",
      activity_date: d(2),
      activity_time: "08:00",
      place_name: "Wildberry Pancakes & Cafe",
      address: "130 E Randolph St, Chicago, IL 60601",
      activity_kind: "restaurant",
      latitude: 41.8849,
      longitude: -87.6233,
      rating: 5,
      comment: "Brunch clásico de Chicago: pancakes, huevos benedict y café. Reserva recomendada — suele haber cola fines de semana y lunes festivo.",
    },
    {
      title: "Punto de recogida autobús — Excursión Soldier Field",
      activity_date: d(2),
      activity_time: "09:30",
      place_name: "Hyatt Regency Chicago — Lobby",
      address: "151 E Wacker Dr, Chicago, IL 60601",
      activity_kind: "transport",
      latitude: 41.8863,
      longitude: -87.6225,
      comment: "Autobús Stripes al Museum Campus. Estar en lobby 09:20. Traslado ~15 min; regreso al centro tras el tour (~11:30).",
    },
    {
      title: "Tour Soldier Field — Estadio de los Chicago Bears",
      activity_date: d(2),
      activity_time: "10:00",
      place_name: "Soldier Field",
      address: "1410 S Museum Campus Dr, Chicago, IL 60605",
      activity_kind: "tour",
      latitude: 41.8623,
      longitude: -87.6167,
      rating: 5,
      comment: "Vestuarios, túnel de acceso al campo y museo Bears. Partido en casa más cercano: 22 oct vs Patriots (TNF) — extensión opcional de 2 noches.",
    },
    {
      title: "Comida — The Gage (Gastropub frente al parque)",
      activity_date: d(2),
      activity_time: "12:00",
      place_name: "The Gage",
      address: "24 S Michigan Ave, Chicago, IL 60603",
      activity_kind: "restaurant",
      latitude: 41.8812,
      longitude: -87.6247,
      rating: 4,
      comment: "Comida americana moderna a 2 min del Millennium Park. Fish & chips, burgers y ensaladas. Buen sitio para sentarse antes del crucero.",
    },
    {
      title: "Crucero de arquitectura por el río Chicago",
      activity_date: d(2),
      activity_time: "14:00",
      place_name: "Chicago Architecture Center River Cruise",
      address: "111 E Wacker Dr, Chicago, IL 60601",
      activity_kind: "tour",
      latitude: 41.8863,
      longitude: -87.6232,
      rating: 5,
      comment: "90 min por el río con guía. Reserva Stripes confirmada. Llegar 15 min antes al muelle.",
      notes: "~45 $/persona · salida 14:00.",
    },
    {
      title: "Millennium Park y Cloud Gate (El Frijol)",
      activity_date: d(2),
      activity_time: "16:00",
      place_name: "Millennium Park",
      address: "201 E Randolph St, Chicago, IL 60602",
      activity_kind: "visit",
      latitude: 41.8826,
      longitude: -87.6226,
      rating: 5,
      comment: "Foto obligatoria en el Frijol, Crown Fountain y Pritzker Pavilion. A pie desde el muelle del crucero (~8 min).",
    },
    {
      title: "Navy Pier — Noria y paseo por el lago",
      activity_date: d(2),
      activity_time: "17:30",
      place_name: "Navy Pier",
      address: "600 E Grand Ave, Chicago, IL 60611",
      activity_kind: "visit",
      latitude: 41.8916,
      longitude: -87.6065,
      comment: "Paseo por el muelle, vistas al lago Michigan. Noria Centennial Wheel ~18 $. Opcional: cerveza en Beer Garden.",
    },
    {
      title: "Cena — Lou Malnati's Deep Dish",
      activity_date: d(2),
      activity_time: "19:30",
      place_name: "Lou Malnati's Pizzeria — River North",
      address: "439 N Wells St, Chicago, IL 60654",
      activity_kind: "restaurant",
      latitude: 41.8896,
      longitude: -87.6341,
      rating: 5,
      comment: "Pedir la Malnati Chicago Classic. La pizza tarda ~45 min — pedir al llegar. Cerveza local para acompañar.",
    },

    // ── DÍA 4 · Martes — Arte, cultura y teatro ────────────────────────────
    {
      title: "Desayuno — Stan's Donuts & Coffee",
      activity_date: d(3),
      activity_time: "08:30",
      place_name: "Stan's Donuts & Coffee",
      address: "1560 N Damen Ave, Chicago, IL 60622",
      activity_kind: "restaurant",
      latitude: 41.9098,
      longitude: -87.6778,
      comment: "Donuts artesanales y café de especialidad. Alternativa en el Loop: Corner Bakery en Michigan Ave si preferís no desplazaros.",
    },
    {
      title: "Art Institute of Chicago",
      activity_date: d(3),
      activity_time: "09:45",
      place_name: "Art Institute of Chicago",
      address: "111 S Michigan Ave, Chicago, IL 60603",
      activity_kind: "museum",
      latitude: 41.8796,
      longitude: -87.6237,
      rating: 5,
      comment: "Imprescindibles: Seurat (Un dimanche…), Hopper (Nighthawks) y armaduras medievales. Calcular 2-3 h.",
      notes: "~25 $/adulto · abre 10:30 — cola early entry con reserva Stripes.",
    },
    {
      title: "Comida — Eataly Chicago",
      activity_date: d(3),
      activity_time: "13:00",
      place_name: "Eataly Chicago",
      address: "43 E Ohio St, Chicago, IL 60611",
      activity_kind: "food",
      latitude: 41.8921,
      longitude: -87.6278,
      comment: "Cada uno elige puesto: pasta fresca, pizza al taglio, embutidos y vino. Comida informal en grupo.",
    },
    {
      title: "Tour en bici por el Lakefront Trail",
      activity_date: d(3),
      activity_time: "15:00",
      place_name: "Divvy Bike — Millennium Park",
      address: "Millennium Park, Chicago, IL 60602",
      activity_kind: "tour",
      latitude: 41.8826,
      longitude: -87.6226,
      comment: "Recorrido ~12 km junto al lago hasta Oak Street Beach y vuelta. Alquiler Divvy ~30 $/3 h.",
    },
    {
      title: "Grant Park y Buckingham Fountain",
      activity_date: d(3),
      activity_time: "17:00",
      place_name: "Buckingham Fountain",
      address: "301 S Columbus Dr, Chicago, IL 60605",
      activity_kind: "visit",
      latitude: 41.8758,
      longitude: -87.6189,
      comment: "Paseo por el pulmón verde de Chicago. La fuente iluminada al atardecer es espectacular (octubre ~18:30).",
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
      comment: "Improvisación legendaria (Murray, Fey, Carell…). Humor en inglés pero muy visual. Llegar 20 min antes.",
      notes: "~30 $/persona · reserva Stripes.",
    },
    {
      title: "Cena — Mon Ami Gabi (francés con vistas)",
      activity_date: d(3),
      activity_time: "22:15",
      place_name: "Mon Ami Gabi",
      address: "539 N Dearborn St, Chicago, IL 60654",
      activity_kind: "restaurant",
      latitude: 41.8924,
      longitude: -87.6298,
      rating: 5,
      comment: "Cena post-teatro: steak frites, sopa de cebolla y terraza con vistas. A 10 min a pie del Second City en taxi/Uber.",
    },

    // ── DÍA 5 · Miércoles — NBA Chicago Bulls ──────────────────────────────
    {
      title: "Brunch — Big Star Wicker Park",
      activity_date: d(4),
      activity_time: "09:30",
      place_name: "Big Star",
      address: "1531 N Damen Ave, Chicago, IL 60622",
      activity_kind: "restaurant",
      latitude: 41.9093,
      longitude: -87.6777,
      rating: 5,
      comment: "Tacos, margaritas y ambiente californiano-mexicano en el barrio más hipster de Chicago. Reserva para grupo grande.",
    },
    {
      title: "Paseo Wicker Park — murales y tiendas",
      activity_date: d(4),
      activity_time: "11:00",
      place_name: "Wicker Park, Chicago",
      address: "Wicker Park, Chicago, IL 60622",
      activity_kind: "neighborhood",
      latitude: 41.9082,
      longitude: -87.6786,
      comment: "Murales, vintage, cafés de especialidad y boutiques. Tiempo libre para comprar souvenirs fuera de la ruta turística.",
    },
    {
      title: "Comida — Au Cheval (burger legendario)",
      activity_date: d(4),
      activity_time: "13:30",
      place_name: "Au Cheval",
      address: "800 W Randolph St, Chicago, IL 60607",
      activity_kind: "restaurant",
      latitude: 41.8846,
      longitude: -87.6478,
      rating: 5,
      comment: "Considerada una de las mejores burgers de USA. Cola habitual — reserva Stripes o ir con paciencia. Alternativa rápida: Shake Shack en Willis Tower.",
    },
    {
      title: "Willis Tower — Skydeck y The Ledge",
      activity_date: d(4),
      activity_time: "15:30",
      place_name: "Willis Tower Skydeck",
      address: "233 S Wacker Dr, Chicago, IL 60606",
      activity_kind: "visit",
      latitude: 41.8789,
      longitude: -87.6359,
      rating: 4,
      comment: "442 m de altura, cajas de cristal The Ledge. Entradas online para evitar colas (~28 $).",
    },
    {
      title: "Tiempo libre — descanso en hotel antes del partido",
      activity_date: d(4),
      activity_time: "17:30",
      place_name: "Hyatt Regency Chicago",
      address: "151 E Wacker Dr, Chicago, IL 60601",
      activity_kind: "activity",
      latitude: 41.8863,
      longitude: -87.6225,
      comment: "Ducha, siesta o copa en el bar del hotel. Vestirse con colores Bulls (rojo/negro).",
    },
    {
      title: "Autobús Stripes · Hotel → United Center",
      activity_date: d(4),
      activity_time: "18:15",
      place_name: "Hyatt Regency Chicago — Lobby",
      address: "151 E Wacker Dr, Chicago, IL 60601",
      activity_kind: "transport",
      latitude: 41.8863,
      longitude: -87.6225,
      comment: "Traslado en autobús al United Center. Estar en lobby 18:05. Regreso coordinado tras el partido (~23:00).",
    },
    {
      title: "🏀 NBA · Chicago Bulls — United Center",
      activity_date: d(4),
      activity_time: "19:30",
      place_name: "United Center",
      address: "1901 W Madison St, Chicago, IL 60612",
      activity_kind: "activity",
      latitude: 41.8806,
      longitude: -87.6742,
      rating: 5,
      comment: "Entrada 1 h antes (18:30). Estatua de Michael Jordan fuera — foto obligatoria. Confirmar calendario NBA 2026-27.",
      notes: "Alternativa pretemporada: dom 12 oct vs Bucks. Entradas ~80-200 $.",
    },
    {
      title: "Cena — Girl & The Goat",
      activity_date: d(4),
      activity_time: "22:30",
      place_name: "Girl & The Goat",
      address: "800 W Randolph St, Chicago, IL 60607",
      activity_kind: "restaurant",
      latitude: 41.8842,
      longitude: -87.6476,
      rating: 5,
      comment: "Cena de celebración post-partido. Stephanie Izard — platos para compartir. Reserva Stripes con semanas de antelación.",
    },

    // ── DÍA 6 · Jueves — Historia, bus turístico y música ──────────────────
    {
      title: "Desayuno — Intelligentsia Coffee Millennium Park",
      activity_date: d(5),
      activity_time: "08:30",
      place_name: "Intelligentsia Coffee",
      address: "53 W Jackson Blvd, Chicago, IL 60604",
      activity_kind: "restaurant",
      latitude: 41.8779,
      longitude: -87.6295,
      comment: "Café de especialidad y pastry. Alternativa: desayuno en el hotel si preferís no salir temprano.",
    },
    {
      title: "Chicago History Museum",
      activity_date: d(5),
      activity_time: "10:00",
      place_name: "Chicago History Museum",
      address: "1601 N Clark St, Chicago, IL 60614",
      activity_kind: "museum",
      latitude: 41.9120,
      longitude: -87.6319,
      comment: "Gran Incendio de 1871, Al Capone, derechos civiles e historia de los Bulls. Muy visual — ~2 h.",
    },
    {
      title: "Comida — Boka Restaurant",
      activity_date: d(5),
      activity_time: "12:30",
      place_name: "Boka Restaurant",
      address: "1729 N Halsted St, Chicago, IL 60614",
      activity_kind: "restaurant",
      latitude: 41.9136,
      longitude: -87.6489,
      rating: 4,
      comment: "Cocina de temporada en Lincoln Park. Menú de mediodía más asequible que la cena.",
    },
    {
      title: "Punto de recogida — Autobús turístico Big Bus",
      activity_date: d(5),
      activity_time: "14:15",
      place_name: "Big Bus Chicago — Parada Navy Pier",
      address: "600 E Grand Ave, Chicago, IL 60611",
      activity_kind: "transport",
      latitude: 41.8916,
      longitude: -87.6065,
      comment: "Hop-on hop-off Big Bus. Parada Navy Pier 14:15. Billete día completo incluido. Barrios: Gold Coast, Lincoln Park, Magnificent Mile.",
      notes: "~40 $/persona · sale cada 30 min.",
    },
    {
      title: "Tour en bus panorámico — ruta norte",
      activity_date: d(5),
      activity_time: "14:30",
      place_name: "Big Bus Chicago",
      address: "600 E Grand Ave, Chicago, IL 60611",
      activity_kind: "tour",
      latitude: 41.8916,
      longitude: -87.6065,
      comment: "Recorrido ~90 min sin bajarse, o bajar en Lincoln Park para paseo. Audio guía en varios idiomas.",
    },
    {
      title: "Lincoln Park Zoo — paseo libre",
      activity_date: d(5),
      activity_time: "16:30",
      place_name: "Lincoln Park Zoo",
      address: "2001 N Clark St, Chicago, IL 60614",
      activity_kind: "nature",
      latitude: 41.9214,
      longitude: -87.6339,
      comment: "Zoo gratuito con osos, leones marinos y vistas al skyline. Opcional — quien prefiera puede quedarse en Magnificent Mile.",
    },
    {
      title: "Tiempo libre — Magnificent Mile o spa hotel",
      activity_date: d(5),
      activity_time: "17:30",
      place_name: "Magnificent Mile",
      address: "N Michigan Ave, Chicago, IL 60611",
      activity_kind: "shopping",
      latitude: 41.8946,
      longitude: -87.6241,
      comment: "Últimas compras, café o descanso antes de la noche de blues. Cada uno elige.",
    },
    {
      title: "Cena + blues — Buddy Guy's Legends",
      activity_date: d(5),
      activity_time: "19:30",
      place_name: "Buddy Guy's Legends",
      address: "700 S Wabash Ave, Chicago, IL 60605",
      activity_kind: "restaurant",
      latitude: 41.8752,
      longitude: -87.6263,
      rating: 5,
      comment: "Cena con música en directo: gumbo, ribs y bourbon. Reservar mesa con hora — el show empieza ~20:30.",
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
      comment: "Segunda parada de la noche: jazz clásico y cócteles. Opcional para quien quiera acostarse antes.",
    },

    // ── DÍA 7 · Viernes — Compras y regreso a Madrid ───────────────────────
    {
      title: "Desayuno — Corner Bakery Cafe",
      activity_date: d(6),
      activity_time: "08:30",
      place_name: "Corner Bakery Cafe",
      address: "663 N Michigan Ave, Chicago, IL 60611",
      activity_kind: "restaurant",
      latitude: 41.8944,
      longitude: -87.6238,
      comment: "Café, sándwiches y pastries antes de las compras. Cerca del Magnificent Mile.",
    },
    {
      title: "Magnificent Mile — compras y souvenirs",
      activity_date: d(6),
      activity_time: "09:30",
      place_name: "Magnificent Mile",
      address: "N Michigan Ave, Chicago, IL 60611",
      activity_kind: "shopping",
      latitude: 41.8946,
      longitude: -87.6241,
      comment: "Apple Store, Nike, Hershey's, tiendas de recuerdos. Última oportunidad para regalos.",
    },
    {
      title: "360 Chicago Observation Deck — John Hancock",
      activity_date: d(6),
      activity_time: "11:00",
      place_name: "360 Chicago",
      address: "875 N Michigan Ave, Chicago, IL 60611",
      activity_kind: "visit",
      latitude: 41.8990,
      longitude: -87.6230,
      rating: 4,
      comment: "Vistas 360° desde el John Hancock. Tilt opcional (cristal inclinado). ~30 min si vais con prisa.",
    },
    {
      title: "Almuerzo de despedida — Chicago Cut Steakhouse",
      activity_date: d(6),
      activity_time: "12:30",
      place_name: "Chicago Cut Steakhouse",
      address: "300 N LaSalle Dr, Chicago, IL 60654",
      activity_kind: "restaurant",
      latitude: 41.8881,
      longitude: -87.6317,
      rating: 5,
      comment: "Chuleta con vistas al río. Brindis final del grupo Stripes antes del aeropuerto.",
    },
    {
      title: "Punto de recogida autobús — Traslado al aeropuerto",
      activity_date: d(6),
      activity_time: "14:15",
      place_name: "Hyatt Regency Chicago — Lobby",
      address: "151 E Wacker Dr, Chicago, IL 60601",
      activity_kind: "transport",
      latitude: 41.8863,
      longitude: -87.6225,
      comment: "Autobús Stripes al aeropuerto. Estar en lobby 14:15 con maletas. Salida 14:30 puntual.",
      notes: "3 h de margen en O'Hare para vuelo internacional ~20:00.",
    },
    {
      title: "Traslado hotel → Aeropuerto O'Hare",
      activity_date: d(6),
      activity_time: "14:30",
      place_name: "Chicago O'Hare International Airport (ORD)",
      address: "10000 W O'Hare Ave, Chicago, IL 60666",
      activity_kind: "transport",
      latitude: 41.9742,
      longitude: -87.9073,
      comment: "Trayecto ~45 min según tráfico. Check-in y facturación de maletas en cuanto lleguéis.",
    },
    {
      title: "Check-in y últimas compras en O'Hare T5",
      activity_date: d(6),
      activity_time: "15:30",
      place_name: "O'Hare Terminal 5",
      address: "10000 W O'Hare Ave, Chicago, IL 60666",
      activity_kind: "activity",
      latitude: 41.9742,
      longitude: -87.9073,
      comment: "Facturación ~2 h antes del vuelo. Tiempo para duty free y último Chicago dog en el aeropuerto.",
    },
    {
      title: "Vuelo Chicago O'Hare (ORD) → Madrid (MAD)",
      activity_date: d(6),
      activity_time: "20:00",
      place_name: "Chicago O'Hare International Airport (ORD)",
      address: "10000 W O'Hare Ave, Chicago, IL 60666",
      activity_kind: "transport",
      latitude: 41.9742,
      longitude: -87.9073,
      comment: "Vuelo directo ~9 h. Llegada a Madrid al día siguiente por la mañana. Puerta de embarque ~1 h antes (19:00).",
      notes: "IB6250 o similar · confirmar terminal en la reserva Stripes.",
    },
  ];
}

export type StripesRouteSeed = {
  title: string;
  day_offset: number;
  travel_mode: string;
  origin_name: string;
  destination_name: string;
  distance_text: string;
  duration_text: string;
  origin_activity_title?: string;
  destination_activity_title?: string;
  waypoint_activity_titles?: string[];
};

export const STRIPES_ROUTES: StripesRouteSeed[] = [
  {
    title: "Día 1 · O'Hare → Riverwalk",
    day_offset: 0,
    travel_mode: "TRANSIT",
    origin_name: "O'Hare Airport",
    destination_name: "Chicago Riverwalk",
    distance_text: "27 km",
    duration_text: "45 min",
    origin_activity_title: "Traslado aeropuerto → hotel (autobús / shuttle Stripes)",
    destination_activity_title: "Paseo Chicago Riverwalk y Michigan Avenue",
  },
  {
    title: "Día 2 · Chicago → Lambeau Field",
    day_offset: 1,
    travel_mode: "DRIVING",
    origin_name: "Hyatt Regency Chicago",
    destination_name: "Lambeau Field",
    distance_text: "320 km",
    duration_text: "2 h 45 min",
    origin_activity_title: "Autobús Stripes · Salida Chicago → Green Bay",
    destination_activity_title: "🏈 NFL · Chicago Bears AT Green Bay Packers",
    waypoint_activity_titles: ["Parada técnica + comida rápida en ruta"],
  },
  {
    title: "Día 3 · Soldier Field → Navy Pier",
    day_offset: 2,
    travel_mode: "TRANSIT",
    origin_name: "Soldier Field",
    destination_name: "Navy Pier",
    distance_text: "6 km",
    duration_text: "25 min",
    origin_activity_title: "Tour Soldier Field — Estadio de los Chicago Bears",
    destination_activity_title: "Navy Pier — Noria y paseo por el lago",
    waypoint_activity_titles: [
      "Millennium Park y Cloud Gate (El Frijol)",
    ],
  },
  {
    title: "Día 5 · Wicker Park → United Center",
    day_offset: 4,
    travel_mode: "TRANSIT",
    origin_name: "Wicker Park",
    destination_name: "United Center",
    distance_text: "5 km",
    duration_text: "22 min",
    origin_activity_title: "Autobús Stripes · Hotel → United Center",
    destination_activity_title: "🏀 NBA · Chicago Bulls — United Center",
    waypoint_activity_titles: ["Willis Tower — Skydeck y The Ledge"],
  },
  {
    title: "Día 7 · Hotel → O'Hare",
    day_offset: 6,
    travel_mode: "DRIVING",
    origin_name: "Hyatt Regency Chicago",
    destination_name: "O'Hare Airport",
    distance_text: "27 km",
    duration_text: "45 min",
    origin_activity_title: "Punto de recogida autobús — Traslado al aeropuerto",
    destination_activity_title: "Traslado hotel → Aeropuerto O'Hare",
  },
];

export type StripesListSeed = {
  title: string;
  visibility: "shared" | "private";
  editable_by_all: boolean;
  items: Array<{ text: string; note?: string; is_done?: boolean }>;
};

export const STRIPES_LISTS: StripesListSeed[] = [
  {
    title: "🧳 Equipaje · Chicago octubre",
    visibility: "shared",
    editable_by_all: true,
    items: [
      { text: "Pasaporte vigente + ESTA aprobado", is_done: true },
      { text: "Chaqueta y gorro para Lambeau Field", note: "Octubre en Green Bay: 8-14 °C en el partido" },
      { text: "Ropa de capas para Chicago", note: "Mañanas frescas, tardes más suaves" },
      { text: "Adaptador enchufe tipo A (USA)", is_done: true },
      { text: "Zapatillas cómodas para caminar el Loop", is_done: true },
      { text: "Powerbank y cargadores", note: "Muchas fotos en estadios y skyline" },
      { text: "Seguro de viaje con cobertura USA", is_done: true },
    ],
  },
  {
    title: "🏈🏀 Entradas deportivas",
    visibility: "shared",
    editable_by_all: false,
    items: [
      { text: "Lambeau Field — Bears @ Packers (11 oct, 15:25 CT)", note: "Week 5 NFL · FOX", is_done: true },
      { text: "United Center — Chicago Bulls (14 oct)", note: "Confirmar calendario NBA 2026-27", is_done: false },
      { text: "Soldier Field Stadium Tour (12 oct)", is_done: true },
      { text: "Opcional: Bears vs Patriots TNF (22 oct)", note: "Extensión de 2 nocas si el grupo quiere partido en casa" },
    ],
  },
  {
    title: "🚌 Horarios autobús Stripes",
    visibility: "shared",
    editable_by_all: false,
    items: [
      { text: "Día 1 · Traslado O'Hare → hotel", note: "T5 · ~14:00 tras reagrupación", is_done: true },
      { text: "Día 2 · Lambeau Field ida", note: "Lobby hotel 06:45 · salida 07:00", is_done: true },
      { text: "Día 2 · Lambeau Field vuelta", note: "Salida ~19:30 · llegada hotel ~23:00", is_done: true },
      { text: "Día 3 · Soldier Field", note: "Lobby 09:20 · salida 09:30", is_done: true },
      { text: "Día 5 · United Center", note: "Lobby 18:05 · salida 18:15 · vuelta ~23:00", is_done: true },
      { text: "Día 7 · Aeropuerto", note: "Lobby 14:15 · salida 14:30", is_done: true },
    ],
  },
  {
    title: "✈️ Vuelos Madrid ↔ Chicago",
    visibility: "shared",
    editable_by_all: false,
    items: [
      { text: "Ida MAD → ORD (10 oct ~10:25)", note: "Estar en T4 Barajas 3 h antes (07:30)", is_done: true },
      { text: "Vuelta ORD → MAD (16 oct ~20:00)", note: "Salir del hotel 15:00 · 3 h en O'Hare", is_done: true },
      { text: "Asientos juntos confirmados", is_done: false },
      { text: "Equipaje facturado según tarifa Stripes", is_done: true },
    ],
  },
];

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
    { description: "Shuttle O'Hare → hotel", amount: 120, currency: "USD", category: "transport", paid_by_name: "Fidel", split_among: "all", date: d(0) },
    { description: "Comida Al's Beef + cena Portillo's — grupo", amount: 420, currency: "USD", category: "food", paid_by_name: "Txema", split_among: "all", date: d(0) },
    // Día 2
    { description: "Bus privado Chicago → Green Bay (ida y vuelta)", amount: 1800, currency: "USD", category: "transport", paid_by_name: "Fidel", split_among: "all", date: d(1) },
    { description: "Entradas Lambeau Field — 12 entradas", amount: 3200, currency: "USD", category: "entertainment", paid_by_name: "Fidel", split_among: "all", date: d(1) },
    { description: "Tailgate + parada en ruta + cena tardía", amount: 380, currency: "USD", category: "food", paid_by_name: "Carlos", split_among: "all", date: d(1) },
    // Día 3
    { description: "Tour Soldier Field — 12 personas", amount: 360, currency: "USD", category: "activities", paid_by_name: "Marta", split_among: "all", date: d(2) },
    { description: "Crucero arquitectura — 12 personas", amount: 540, currency: "USD", category: "activities", paid_by_name: "Marta", split_among: "all", date: d(2) },
    { description: "Comida The Gage + cena Lou Malnati's", amount: 520, currency: "USD", category: "food", paid_by_name: "Javi", split_among: "all", date: d(2) },
    // Día 4
    { description: "The Second City — 12 entradas", amount: 360, currency: "USD", category: "entertainment", paid_by_name: "Txema", split_among: "all", date: d(3) },
    { description: "Comida Eataly + cena Mon Ami Gabi", amount: 680, currency: "USD", category: "food", paid_by_name: "Ana", split_among: "all", date: d(3) },
    // Día 5
    { description: "Entradas NBA United Center — 12 personas", amount: 1680, currency: "USD", category: "entertainment", paid_by_name: "Fidel", split_among: "all", date: d(4) },
    { description: "Willis Tower Skydeck — grupo", amount: 336, currency: "USD", category: "activities", paid_by_name: "Ana", split_among: "all", date: d(4) },
    { description: "Brunch Big Star + comida Au Cheval + cena Girl & The Goat", amount: 890, currency: "USD", category: "food", paid_by_name: "Roberto", split_among: "all", date: d(4) },
    // Día 6
    { description: "Big Bus + comida Boka + cena Buddy Guy's", amount: 720, currency: "USD", category: "food", paid_by_name: "Marcos", split_among: "all", date: d(5) },
    { description: "Jazz Andy's Club — copas", amount: 120, currency: "USD", category: "entertainment", paid_by_name: "Marcos", split_among: "all", date: d(5) },
    // Día 7
    { description: "Almuerzo despedida Chicago Cut Steakhouse", amount: 780, currency: "USD", category: "food", paid_by_name: "Txema", split_among: "all", date: d(6) },
    { description: "Shuttle hotel → O'Hare", amount: 180, currency: "USD", category: "transport", paid_by_name: "Elena", split_among: "all", date: d(6) },
  ];
}
