"use client";

import { useState } from "react";
import { Building2, Plane, Train, Ship, Bus, ExternalLink, ChevronDown, ChevronUp, ArrowLeftRight, ArrowRight } from "lucide-react";

type SearchCardProps = {
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  participants: number;
  tripId: string;
};

type TripType = "ida" | "ida-vuelta";
type Category = "hotel" | "vuelo" | "tren" | "ferry" | "bus";

const CATEGORIES: { id: Category; label: string; icon: React.ElementType; color: string; hasRoute: boolean }[] = [
  { id: "hotel",  label: "Hotel",  icon: Building2, color: "text-blue-600 dark:text-blue-400",    hasRoute: false },
  { id: "vuelo",  label: "Vuelo",  icon: Plane,     color: "text-violet-600 dark:text-violet-400", hasRoute: true  },
  { id: "tren",   label: "Tren",   icon: Train,     color: "text-emerald-600 dark:text-emerald-400",hasRoute: true  },
  { id: "ferry",  label: "Ferry",  icon: Ship,      color: "text-sky-600 dark:text-sky-400",       hasRoute: true  },
  { id: "bus",    label: "Bus",    icon: Bus,       color: "text-amber-600 dark:text-amber-400",   hasRoute: true  },
];

type SearchOpts = {
  origin: string; destination: string;
  startDate: string; endDate: string;
  adults: number; tripType: TripType;
};

const HOTEL_PLATFORMS = [
  { name: "Booking.com", url: (o: SearchOpts) => `https://www.booking.com/searchresults.html?ss=${enc(o.destination)}&checkin=${o.startDate}&checkout=${o.endDate}&group_adults=${o.adults}&no_rooms=1` },
  { name: "Airbnb",      url: (o: SearchOpts) => `https://www.airbnb.es/s/${enc(o.destination)}/homes?checkin=${o.startDate}&checkout=${o.endDate}&adults=${o.adults}` },
  { name: "Hotels.com",  url: (o: SearchOpts) => `https://es.hotels.com/search.do?q-destination=${enc(o.destination)}&q-check-in=${o.startDate}&q-check-out=${o.endDate}&q-rooms=1&q-room-0-adults=${o.adults}` },
  { name: "Hostelworld", url: (o: SearchOpts) => `https://www.hostelworld.com/findabed.php?ChosenCity=${enc(o.destination)}` },
];

const FLIGHT_PLATFORMS = [
  { name: "Google Flights", url: (o: SearchOpts) => `https://www.google.com/travel/flights?q=${enc(`vuelo ${o.origin} ${o.destination} ${o.startDate}`)}` },
  { name: "Skyscanner",     url: (o: SearchOpts) => `https://www.skyscanner.es/transport/vuelos/${enc(o.origin.slice(0,3).toLowerCase())}/${enc(o.destination.slice(0,3).toLowerCase())}/${o.startDate.replace(/-/g,"")}/${o.tripType === "ida-vuelta" ? o.endDate.replace(/-/g,"") : ""}?adults=${o.adults}` },
  { name: "Kayak",          url: (o: SearchOpts) => `https://www.kayak.es/flights/${enc(o.origin)}-${enc(o.destination)}/${o.startDate}${o.tripType === "ida-vuelta" ? `/${o.endDate}` : ""}/${o.adults}adults` },
  { name: "Kiwi.com",       url: (o: SearchOpts) => `https://www.kiwi.com/es/search/results/${enc(o.origin)}/${enc(o.destination)}/${o.startDate}${o.tripType === "ida-vuelta" ? `/${o.endDate}` : ""}` },
];

const TRAIN_PLATFORMS = [
  { name: "Renfe",      url: (o: SearchOpts) => `https://www.renfe.com/es/es/viajar/busqueda-de-trenes?origin=${enc(o.origin)}&destination=${enc(o.destination)}&date=${o.startDate}&adults=2` },
  { name: "Omio",       url: (o: SearchOpts) => `https://www.omio.es/trenes/${enc(o.origin)}/${enc(o.destination)}/${o.startDate}?pax=${o.adults}` },
  { name: "Trainline",  url: (o: SearchOpts) => `https://www.thetrainline.com/es/search#/${enc(o.origin)}/${enc(o.destination)}/${o.startDate}` },
  { name: "BlaBlaCar",  url: (o: SearchOpts) => `https://www.blablacar.es/viajes-en-coche/${enc(o.origin)}/${enc(o.destination)}?departureDate=${o.startDate}` },
];

const FERRY_PLATFORMS = [
  { name: "Directferries",    url: (o: SearchOpts) => `https://www.directferries.es/ferry_${enc(o.destination.toLowerCase())}.htm` },
  { name: "Baleària",         url: (o: SearchOpts) => `https://www.balearia.com/es/compra/paso1.php?origin=${enc(o.origin)}&destination=${enc(o.destination)}&ida=${o.startDate}&adults=${o.adults}` },
  { name: "Brittany Ferries", url: (o: SearchOpts) => `https://www.brittany-ferries.es/billetes-de-ferry` },
  { name: "FerryHopper",      url: (o: SearchOpts) => `https://www.ferryhopper.com/es#/${enc(o.destination)}` },
];

const BUS_PLATFORMS = [
  { name: "FlixBus", url: (o: SearchOpts) => `https://www.flixbus.es/viaje-en-autobus/${enc(o.destination)}?date=${o.startDate}&pax=${o.adults}` },
  { name: "Alsa",    url: (o: SearchOpts) => `https://www.alsa.com/es/web/bus/search-trips?origin=${enc(o.origin)}&destination=${enc(o.destination)}&date=${o.startDate}` },
  { name: "Omio (bus)", url: (o: SearchOpts) => `https://www.omio.es/autobuses/${enc(o.origin)}/${enc(o.destination)}/${o.startDate}?pax=${o.adults}` },
];

const PLATFORMS: Record<Category, { name: string; url: (o: SearchOpts) => string }[]> = {
  hotel: HOTEL_PLATFORMS, vuelo: FLIGHT_PLATFORMS,
  tren: TRAIN_PLATFORMS, ferry: FERRY_PLATFORMS, bus: BUS_PLATFORMS,
};

function enc(s: string) { return encodeURIComponent(s); }

function fmt(d: string | null) {
  if (!d) return "";
  return new Date(d + "T12:00:00Z").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function TripSearchCard({ destination, startDate, endDate, participants, tripId: _ }: SearchCardProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Category>("hotel");
  const [origin, setOrigin] = useState("Madrid");
  const [dest, setDest] = useState(destination ?? "");
  const [dateFrom, setDateFrom] = useState(startDate ?? "");
  const [dateTo, setDateTo] = useState(endDate ?? "");
  const [tripType, setTripType] = useState<TripType>("ida");

  const nights = dateFrom && dateTo
    ? Math.max(1, Math.round((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000))
    : 0;

  const opts: SearchOpts = {
    origin, destination: dest || destination || "",
    startDate: dateFrom, endDate: dateTo,
    adults: Math.max(1, participants), tripType,
  };

  const activeCategory = CATEGORIES.find((c) => c.id === active)!;
  const platforms = PLATFORMS[active];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] overflow-hidden shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-[#1E293B]/50"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-[#F87171]/10 flex items-center justify-center shrink-0">
            <ExternalLink className="h-4 w-4 text-[#F87171]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Buscar para este viaje</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {dest || destination || "Destino"}{dateFrom ? ` · ${fmt(dateFrom)}${dateTo ? `–${fmt(dateTo)}` : ""}` : ""}
              {participants > 0 ? ` · ${participants} ${participants === 1 ? "persona" : "personas"}` : ""}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-slate-100 dark:border-[#1E293B]">
          {/* Category pills */}
          <div className="flex gap-1.5 px-4 py-3 flex-wrap">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  active === id
                    ? "bg-[#F87171] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-300 dark:hover:bg-[#1E293B]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Route fields — only for transport */}
          {activeCategory.hasRoute ? (
            <div className="px-4 pb-3 space-y-2.5">
              {/* Trip type toggle */}
              <div className="flex gap-2">
                {(["ida", "ida-vuelta"] as TripType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTripType(t)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      tripType === t
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-[#1E293B] dark:text-slate-300"
                    }`}
                  >
                    {t === "ida" ? <ArrowRight className="h-3 w-3" /> : <ArrowLeftRight className="h-3 w-3" />}
                    {t === "ida" ? "Solo ida" : "Ida y vuelta"}
                  </button>
                ))}
              </div>

              {/* Origin / Destination */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Origen</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Madrid"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#F87171] focus:outline-none dark:border-[#1E293B] dark:bg-[#080C14] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Destino</label>
                  <input
                    type="text"
                    value={dest}
                    onChange={(e) => setDest(e.target.value)}
                    placeholder={destination ?? "Destino"}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#F87171] focus:outline-none dark:border-[#1E293B] dark:bg-[#080C14] dark:text-white"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className={`grid gap-2 ${tripType === "ida-vuelta" ? "grid-cols-2" : "grid-cols-1"}`}>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    {tripType === "ida-vuelta" ? "Ida" : "Fecha"}
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#F87171] focus:outline-none dark:border-[#1E293B] dark:bg-[#080C14] dark:text-white"
                  />
                </div>
                {tripType === "ida-vuelta" && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Vuelta</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#F87171] focus:outline-none dark:border-[#1E293B] dark:bg-[#080C14] dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Hotel — just destination + dates */
            <div className="px-4 pb-3">
              <div className="rounded-xl bg-slate-50 dark:bg-[#080C14] px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
                <Building2 className="inline h-3.5 w-3.5 mr-1.5 text-blue-500" />
                {dest || destination || "Destino"} · {nights > 0 ? `${nights} noches` : "fechas del viaje"} · {participants} {participants === 1 ? "persona" : "personas"}
              </div>
            </div>
          )}

          {/* Platform buttons */}
          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            {platforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url(opts)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:border-[#334155] dark:hover:bg-[#1E293B]"
              >
                <span className="truncate">{platform.name}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 ml-2 text-slate-400" />
              </a>
            ))}
          </div>

          <p className="px-4 pb-3 text-[10px] text-slate-400 dark:text-slate-500">
            Kaviro abre cada plataforma con los datos ya rellenados. Precios y disponibilidad son de cada plataforma.
          </p>
        </div>
      )}
    </div>
  );
}
