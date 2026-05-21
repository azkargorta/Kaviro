"use client";

import { useState } from "react";
import { Building2, Plane, Train, Ship, Bus, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

type SearchCardProps = {
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  participants: number;
  tripId: string;
};

type Platform = {
  name: string;
  url: (opts: SearchOpts) => string;
};

type SearchOpts = {
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
};

function fmtDate(d: string) {
  return d; // Booking/Skyscanner use YYYY-MM-DD natively
}

const HOTEL_PLATFORMS: Platform[] = [
  {
    name: "Booking.com",
    url: ({ destination, startDate, endDate, adults }) =>
      `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}&checkin=${fmtDate(startDate)}&checkout=${fmtDate(endDate)}&group_adults=${adults}&no_rooms=1`,
  },
  {
    name: "Airbnb",
    url: ({ destination, startDate, endDate, adults }) =>
      `https://www.airbnb.es/s/${encodeURIComponent(destination)}/homes?checkin=${startDate}&checkout=${endDate}&adults=${adults}`,
  },
  {
    name: "Hotels.com",
    url: ({ destination, startDate, endDate, adults }) =>
      `https://es.hotels.com/search.do?q-destination=${encodeURIComponent(destination)}&q-check-in=${startDate}&q-check-out=${endDate}&q-rooms=1&q-room-0-adults=${adults}`,
  },
  {
    name: "Hostelworld",
    url: ({ destination }) =>
      `https://www.hostelworld.com/findabed.php?ChosenCity=${encodeURIComponent(destination)}&search_keywords=${encodeURIComponent(destination)}`,
  },
];

const FLIGHT_PLATFORMS: Platform[] = [
  {
    name: "Google Flights",
    url: ({ destination, startDate, adults }) =>
      `https://www.google.com/travel/flights?q=${encodeURIComponent(`vuelos a ${destination} ${startDate} ${adults} personas`)}`,
  },
  {
    name: "Skyscanner",
    url: ({ destination, startDate, endDate, adults }) =>
      `https://www.skyscanner.es/transport/vuelos/mad/${encodeURIComponent(destination.slice(0, 4).toLowerCase())}/${startDate.replace(/-/g, "")}/${endDate.replace(/-/g, "")}/?adults=${adults}`,
  },
  {
    name: "Kayak",
    url: ({ destination, startDate, endDate, adults }) =>
      `https://www.kayak.es/flights/MAD-${encodeURIComponent(destination)}/${startDate}/${endDate}/${adults}adults`,
  },
  {
    name: "Kiwi.com",
    url: ({ destination, startDate, adults }) =>
      `https://www.kiwi.com/es/search/results/madrid-spain/${encodeURIComponent(destination)}/${startDate}`,
  },
];

const TRAIN_PLATFORMS: Platform[] = [
  {
    name: "Renfe",
    url: ({ destination, startDate }) =>
      `https://www.renfe.com/es/es/viajar/busqueda-de-trenes?origin=Madrid&destination=${encodeURIComponent(destination)}&date=${startDate}&adults=2`,
  },
  {
    name: "Omio",
    url: ({ destination, startDate, adults }) =>
      `https://www.omio.es/trenes/madrid/${encodeURIComponent(destination)}/${startDate}?pax=${adults}`,
  },
  {
    name: "Trainline",
    url: ({ destination, startDate }) =>
      `https://www.thetrainline.com/es/search#/Madrid/${encodeURIComponent(destination)}/${startDate}`,
  },
  {
    name: "BlaBlaCar",
    url: ({ destination, startDate }) =>
      `https://www.blablacar.es/viajes-en-coche/madrid/${encodeURIComponent(destination)}?departureDate=${startDate}`,
  },
];

const FERRY_PLATFORMS: Platform[] = [
  {
    name: "Directferries",
    url: ({ destination, startDate }) =>
      `https://www.directferries.es/ferry_${encodeURIComponent(destination.toLowerCase())}.htm`,
  },
  {
    name: "Baleària",
    url: ({ destination, startDate, adults }) =>
      `https://www.balearia.com/es/compra/paso1.php?origin=MAD&destination=${encodeURIComponent(destination)}&ida=${startDate}&adults=${adults}`,
  },
  {
    name: "Brittany Ferries",
    url: ({ destination, startDate }) =>
      `https://www.brittany-ferries.es/billetes-de-ferry/${encodeURIComponent(destination)}`,
  },
  {
    name: "FerryHopper",
    url: ({ destination, startDate }) =>
      `https://www.ferryhopper.com/es#/${encodeURIComponent(destination)}`,
  },
];

const BUS_PLATFORMS: Platform[] = [
  {
    name: "FlixBus",
    url: ({ destination, startDate, adults }) =>
      `https://www.flixbus.es/viaje-en-autobus/${encodeURIComponent(destination)}?date=${startDate}&pax=${adults}`,
  },
  {
    name: "Alsa",
    url: ({ destination, startDate }) =>
      `https://www.alsa.com/es/web/bus/search-trips?origin=Madrid&destination=${encodeURIComponent(destination)}&date=${startDate}`,
  },
  {
    name: "Omio (bus)",
    url: ({ destination, startDate, adults }) =>
      `https://www.omio.es/autobuses/madrid/${encodeURIComponent(destination)}/${startDate}?pax=${adults}`,
  },
];

type Category = "hotel" | "vuelo" | "tren" | "ferry" | "bus";

const CATEGORIES: { id: Category; label: string; icon: React.ElementType; platforms: Platform[]; color: string }[] = [
  { id: "hotel",  label: "Hotel",  icon: Building2, platforms: HOTEL_PLATFORMS,  color: "text-blue-600 dark:text-blue-400" },
  { id: "vuelo",  label: "Vuelo",  icon: Plane,     platforms: FLIGHT_PLATFORMS, color: "text-violet-600 dark:text-violet-400" },
  { id: "tren",   label: "Tren",   icon: Train,     platforms: TRAIN_PLATFORMS,  color: "text-emerald-600 dark:text-emerald-400" },
  { id: "ferry",  label: "Ferry",  icon: Ship,      platforms: FERRY_PLATFORMS,  color: "text-sky-600 dark:text-sky-400" },
  { id: "bus",    label: "Bus",    icon: Bus,       platforms: BUS_PLATFORMS,    color: "text-amber-600 dark:text-amber-400" },
];

export default function TripSearchCard({ destination, startDate, endDate, participants, tripId }: SearchCardProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Category>("hotel");

  if (!destination || !startDate || !endDate) return null;

  const opts: SearchOpts = {
    destination,
    startDate,
    endDate,
    adults: Math.max(1, participants),
  };

  const activeCategory = CATEGORIES.find((c) => c.id === active)!;
  const nights = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000));
  const startFmt = new Date(startDate + "T12:00:00Z").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const endFmt = new Date(endDate + "T12:00:00Z").toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] overflow-hidden shadow-sm">
      {/* Header — toggle */}
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
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Buscar para este viaje
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {destination} · {startFmt}–{endFmt} · {participants} {participants === 1 ? "persona" : "personas"}
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
          : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        }
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

          {/* Context bar */}
          <div className="mx-4 mb-3 rounded-xl bg-slate-50 dark:bg-[#080C14] px-3 py-2 flex items-center gap-2">
            <activeCategory.icon className={`h-3.5 w-3.5 shrink-0 ${activeCategory.color}`} />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {active === "hotel" && `${nights} noches en ${destination} · ${participants} ${participants === 1 ? "persona" : "personas"}`}
              {active === "vuelo" && `Madrid → ${destination} · ${startFmt} · ${participants} ${participants === 1 ? "persona" : "personas"}`}
              {active === "tren" && `Madrid → ${destination} · ${startFmt} · ${participants} ${participants === 1 ? "persona" : "personas"}`}
              {active === "ferry" && `Ferry hacia ${destination} · ${startFmt}`}
              {active === "bus" && `Madrid → ${destination} · ${startFmt} · ${participants} ${participants === 1 ? "persona" : "personas"}`}
            </p>
          </div>

          {/* Platform buttons */}
          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            {activeCategory.platforms.map((platform) => (
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
            Kaviro abre cada plataforma con el destino y las fechas ya rellenados. Los precios y disponibilidad son de cada plataforma.
          </p>
        </div>
      )}
    </div>
  );
}
