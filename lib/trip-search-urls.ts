/**
 * Enlaces a pantallas de búsqueda (no deep links frágiles que devuelven 404).
 * Prioriza homepages con parámetros o rutas estables documentadas por cada plataforma.
 */

export type TripType = "ida" | "ida-vuelta";

export type TransportSearchOpts = {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  tripType: TripType;
};

export type CarSearchOpts = {
  pickup: string;
  dropoff: string;
  startDate: string;
  endDate: string;
  adults: number;
  luggage: number;
};

export type HotelSearchOpts = {
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
};

export type SearchPlatform = { name: string; url: string };

function enc(s: string): string {
  return encodeURIComponent(s.trim());
}

/** Slug para rutas tipo omio/kayak: "San Sebastián" → "san-sebastian" */
export function slugPlace(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDateEs(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function formatDdMmYyyy(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function splitIso(iso: string): { day: string; month: string; year: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-");
  return { day, month, year };
}

// ─── Vuelos ───────────────────────────────────────────────────────────────────

export function flightPlatformUrls(o: TransportSearchOpts): SearchPlatform[] {
  const origin = o.origin.trim();
  const dest = o.destination.trim();
  const adults = Math.max(1, o.adults);
  const oSlug = slugPlace(origin);
  const dSlug = slugPlace(dest);
  const retPath = o.tripType === "ida-vuelta" && o.endDate ? `/${o.endDate}` : "";

  return [
    {
      name: "Google Flights",
      url: `https://www.google.com/travel/flights?q=${enc(
        `vuelos de ${origin} a ${dest} ${formatDateEs(o.startDate)}${o.tripType === "ida-vuelta" && o.endDate ? ` vuelta ${formatDateEs(o.endDate)}` : ""} ${adults} adultos`
      )}`,
    },
    {
      name: "Kayak",
      url:
        oSlug && dSlug && o.startDate
          ? `https://www.kayak.es/flights/${oSlug}-${dSlug}/${o.startDate}${retPath}/${adults}adults`
          : `https://www.kayak.es/flights?origin=${enc(origin)}&destination=${enc(dest)}`,
    },
    {
      name: "Skyscanner",
      url: `https://www.skyscanner.es/transport/flights/?adults=${adults}&adultsv2=${adults}&children=0&infants=0&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false&origin=${enc(origin)}&destination=${enc(dest)}&outboundDate=${o.startDate}${o.tripType === "ida-vuelta" && o.endDate ? `&inboundDate=${o.endDate}` : ""}`,
    },
    {
      name: "Kiwi.com",
      url:
        oSlug && dSlug && o.startDate
          ? `https://www.kiwi.com/es/search/results/${oSlug}/${dSlug}/${o.startDate}${o.tripType === "ida-vuelta" && o.endDate ? `/${o.endDate}` : ""}?adults=${adults}&children=0&infants=0`
          : `https://www.kiwi.com/es/search?from=${enc(origin)}&to=${enc(dest)}`,
    },
  ];
}

// ─── Tren ─────────────────────────────────────────────────────────────────────

export function trainPlatformUrls(o: TransportSearchOpts): SearchPlatform[] {
  const origin = slugPlace(o.origin);
  const dest = slugPlace(o.destination);
  const adults = Math.max(1, o.adults);
  const q = `passengers=${adults}&locale=es-es`;

  return [
    {
      name: "Omio",
      url:
        origin && dest
          ? `https://www.omio.es/trenes/${origin}/${dest}?${q}${o.startDate ? `&departureDate=${o.startDate}` : ""}`
          : `https://www.omio.es/trenes?${q}`,
    },
    {
      name: "Trainline",
      url:
        origin && dest
          ? `https://www.thetrainline.com/es/horarios-trenes/${origin}/${dest}`
          : `https://www.thetrainline.com/es/horarios-trenes`,
    },
    {
      name: "Renfe",
      url: `https://www.renfe.com/es/es?viajar&origen=${enc(o.origin)}&destino=${enc(o.destination)}${o.startDate ? `&fecha=${o.startDate}` : ""}`,
    },
    {
      name: "BlaBlaCar",
      url:
        origin && dest && o.startDate
          ? `https://www.blablacar.es/viajes-en-coche/${origin}/${dest}?departureDate=${o.startDate}`
          : `https://www.blablacar.es/viajes-en-coche`,
    },
  ];
}

// ─── Ferry ────────────────────────────────────────────────────────────────────

export function ferryPlatformUrls(o: TransportSearchOpts): SearchPlatform[] {
  const origin = slugPlace(o.origin);
  const dest = slugPlace(o.destination);
  const adults = Math.max(1, o.adults);

  return [
    {
      name: "Omio (ferry)",
      url:
        origin && dest
          ? `https://www.omio.es/ferries/${origin}/${dest}?passengers=${adults}${o.startDate ? `&departureDate=${o.startDate}` : ""}`
          : `https://www.omio.es/ferries`,
    },
    {
      name: "Direct Ferries",
      url: `https://www.directferries.es/?dfrom=${enc(o.origin)}&dto=${enc(o.destination)}&rdate=${o.startDate || ""}&adults=${adults}`,
    },
    {
      name: "FerryHopper",
      url: `https://www.ferryhopper.com/es/search?from=${enc(o.origin)}&to=${enc(o.destination)}&date=${o.startDate || ""}&passengers=${adults}`,
    },
    {
      name: "Baleària",
      url: `https://www.balearia.com/es/compra/paso1.php?origen=${enc(o.origin)}&destino=${enc(o.destination)}&fecha=${formatDdMmYyyy(o.startDate)}&adultos=${adults}`,
    },
  ];
}

// ─── Autobús ──────────────────────────────────────────────────────────────────

export function busPlatformUrls(o: TransportSearchOpts): SearchPlatform[] {
  const origin = slugPlace(o.origin);
  const dest = slugPlace(o.destination);
  const adults = Math.max(1, o.adults);

  return [
    {
      name: "Omio (bus)",
      url:
        origin && dest
          ? `https://www.omio.es/autobuses/${origin}/${dest}?passengers=${adults}${o.startDate ? `&departureDate=${o.startDate}` : ""}`
          : `https://www.omio.es/autobuses`,
    },
    {
      name: "FlixBus",
      url: `https://shop.flixbus.es/search?departureCity=${enc(o.origin)}&arrivalCity=${enc(o.destination)}&rideDateFrom=${o.startDate || ""}&adult=${adults}`,
    },
    {
      name: "Alsa",
      url: `https://www.alsa.com/es/web/bus/planifica-tu-viaje/home?passengerNumber=${adults}&textoOrigen=${enc(o.origin)}&textoDestino=${enc(o.destination)}&fechaViaje=${formatDdMmYyyy(o.startDate)}`,
    },
    {
      name: "BlaBlaCar Bus",
      url: `https://www.blablacar.es/buscar?from=${enc(o.origin)}&to=${enc(o.destination)}&date=${o.startDate || ""}`,
    },
  ];
}

// ─── Coche de alquiler ────────────────────────────────────────────────────────

export function carPlatformUrls(o: CarSearchOpts): SearchPlatform[] {
  const pickup = o.pickup.trim();
  const dropoff = o.dropoff.trim();
  const adults = Math.max(1, o.adults);
  const luggage = Math.max(0, o.luggage);
  const pu = splitIso(o.startDate);
  const drop = splitIso(o.endDate);
  const pSlug = slugPlace(pickup);
  const dSlug = slugPlace(dropoff);

  const rentalcars =
    pu && drop
      ? `https://www.rentalcars.com/es/search-results?locationName=${enc(pickup)}&dropLocationName=${enc(dropoff)}&puDay=${pu.day}&puMonth=${pu.month}&puYear=${pu.year}&doDay=${drop.day}&doMonth=${drop.month}&doYear=${drop.year}&puHour=10&puMinute=0&doHour=10&doMinute=0&driversAge=30&adplat=${adults}`
      : `https://www.rentalcars.com/es/?locationName=${enc(pickup)}`;

  return [
    { name: "Rentalcars", url: rentalcars },
    {
      name: "Kayak Coches",
      url:
        pSlug && o.startDate && o.endDate
          ? `https://www.kayak.es/cars/${pSlug}/${o.startDate}/${o.endDate}?ucs=&sort=rank_a`
          : `https://www.kayak.es/cars?pickup=${enc(pickup)}&dropoff=${enc(dropoff)}`,
    },
    {
      name: "Booking.com Coches",
      url: `https://www.booking.com/cars/index.es.html?location=${enc(pickup)}&dropLocation=${enc(dropoff)}&pickup=${o.startDate}&dropoff=${o.endDate}&group_adults=${adults}`,
    },
    {
      name: "Discovercars",
      url: `https://www.discovercars.com/es/search?pickup_location_name=${enc(pickup)}&dropoff_location_name=${enc(dropoff)}&pickup_date=${o.startDate}&dropoff_date=${o.endDate}&driver_age=30&passengers=${adults}&bags=${luggage}`,
    },
    {
      name: "Skyscanner Alquiler",
      url: `https://www.skyscanner.es/car-hire?pickup=${enc(pickup)}&dropoff=${enc(dropoff)}&pickupDate=${o.startDate}&dropoffDate=${o.endDate}&drivers=1`,
    },
  ];
}

// ─── Hotel ────────────────────────────────────────────────────────────────────

export function hotelPlatformUrls(o: HotelSearchOpts): SearchPlatform[] {
  const dest = o.destination.trim();
  const adults = Math.max(1, o.adults);

  return [
    {
      name: "Booking.com",
      url: `https://www.booking.com/searchresults.html?ss=${enc(dest)}&checkin=${o.startDate}&checkout=${o.endDate}&group_adults=${adults}&no_rooms=1`,
    },
    {
      name: "Airbnb",
      url: `https://www.airbnb.es/s/${enc(dest)}/homes?checkin=${o.startDate}&checkout=${o.endDate}&adults=${adults}`,
    },
    {
      name: "Hotels.com",
      url: `https://es.hotels.com/search.do?q-destination=${enc(dest)}&q-check-in=${o.startDate}&q-check-out=${o.endDate}&q-rooms=1&q-room-0-adults=${adults}`,
    },
    {
      name: "Hostelworld",
      url: `https://www.hostelworld.com/st/hostels/${slugPlace(dest) || enc(dest)}/?dateFrom=${o.startDate}&dateTo=${o.endDate}&guests=${adults}`,
    },
  ];
}
