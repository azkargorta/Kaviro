"use client";

import { useState } from "react";
import {
  Building2,
  Plane,
  Train,
  Ship,
  Bus,
  Car,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  ArrowRight,
  Users,
  Luggage,
} from "lucide-react";
import {
  busPlatformUrls,
  carPlatformUrls,
  ferryPlatformUrls,
  flightPlatformUrls,
  hotelPlatformUrls,
  trainPlatformUrls,
  type TripType,
} from "@/lib/trip-search-urls";

type SearchCardProps = {
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  participants: number;
  tripId: string;
};

type Category = "hotel" | "vuelo" | "tren" | "ferry" | "bus" | "coche";

const CATEGORIES: {
  id: Category;
  label: string;
  icon: React.ElementType;
  form: "hotel" | "route" | "car";
}[] = [
  { id: "hotel", label: "Hotel", icon: Building2, form: "hotel" },
  { id: "vuelo", label: "Vuelo", icon: Plane, form: "route" },
  { id: "tren", label: "Tren", icon: Train, form: "route" },
  { id: "ferry", label: "Ferry", icon: Ship, form: "route" },
  { id: "bus", label: "Bus", icon: Bus, form: "route" },
  { id: "coche", label: "Coche alquiler", icon: Car, form: "car" },
];

function fmt(d: string | null) {
  if (!d) return "";
  return new Date(d + "T12:00:00Z").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#F87171] focus:outline-none dark:border-[#1E293B] dark:bg-[#080C14] dark:text-white";

const labelCls = "block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1";

export default function TripSearchCard({
  destination,
  startDate,
  endDate,
  participants,
  tripId: _,
}: SearchCardProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Category>("hotel");

  const [origin, setOrigin] = useState("Madrid");
  const [dest, setDest] = useState(destination ?? "");
  const [dateFrom, setDateFrom] = useState(startDate ?? "");
  const [dateTo, setDateTo] = useState(endDate ?? "");
  const [tripType, setTripType] = useState<TripType>("ida");
  const [adults, setAdults] = useState(Math.max(1, participants));

  const [pickup, setPickup] = useState(destination ?? "");
  const [dropoff, setDropoff] = useState(destination ?? "");
  const [carDateFrom, setCarDateFrom] = useState(startDate ?? "");
  const [carDateTo, setCarDateTo] = useState(endDate ?? "");
  const [luggage, setLuggage] = useState(1);

  const nights =
    dateFrom && dateTo
      ? Math.max(1, Math.round((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000))
      : 0;

  const activeCategory = CATEGORIES.find((c) => c.id === active)!;

  const platforms = (() => {
    if (active === "hotel") {
      return hotelPlatformUrls({
        destination: dest || destination || "",
        startDate: dateFrom,
        endDate: dateTo,
        adults,
      });
    }
    if (active === "coche") {
      return carPlatformUrls({
        pickup,
        dropoff,
        startDate: carDateFrom,
        endDate: carDateTo,
        adults,
        luggage,
      });
    }
    const transport = {
      origin,
      destination: dest || destination || "",
      startDate: dateFrom,
      endDate: dateTo,
      adults,
      tripType,
    };
    if (active === "vuelo") return flightPlatformUrls(transport);
    if (active === "tren") return trainPlatformUrls(transport);
    if (active === "ferry") return ferryPlatformUrls(transport);
    return busPlatformUrls(transport);
  })();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] overflow-hidden shadow-sm">
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
              {dest || destination || "Destino"}
              {dateFrom ? ` · ${fmt(dateFrom)}${dateTo ? `–${fmt(dateTo)}` : ""}` : ""}
              {participants > 0 ? ` · ${participants} ${participants === 1 ? "persona" : "personas"}` : ""}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-[#1E293B]">
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

          {activeCategory.form === "route" && (
            <div className="px-4 pb-3 space-y-2.5">
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Origen</label>
                  <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Madrid" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Destino</label>
                  <input
                    type="text"
                    value={dest}
                    onChange={(e) => setDest(e.target.value)}
                    placeholder={destination ?? "Destino"}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className={`grid gap-2 ${tripType === "ida-vuelta" ? "grid-cols-2" : "grid-cols-1"}`}>
                <div>
                  <label className={labelCls}>{tripType === "ida-vuelta" ? "Ida" : "Fecha"}</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
                </div>
                {tripType === "ida-vuelta" && (
                  <div>
                    <label className={labelCls}>Vuelta</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>
                  <Users className="inline h-3 w-3 mr-0.5" />
                  Pasajeros
                </label>
                <input
                  type="number"
                  min={1}
                  max={9}
                  value={adults}
                  onChange={(e) => setAdults(Math.max(1, Number(e.target.value) || 1))}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {activeCategory.form === "car" && (
            <div className="px-4 pb-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Lugar de recogida</label>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder={destination ?? "Aeropuerto o ciudad"}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Lugar de devolución</label>
                  <input
                    type="text"
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                    placeholder={destination ?? "Misma ciudad"}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Recogida</label>
                  <input type="date" value={carDateFrom} onChange={(e) => setCarDateFrom(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Devolución</label>
                  <input type="date" value={carDateTo} onChange={(e) => setCarDateTo(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>
                    <Users className="inline h-3 w-3 mr-0.5" />
                    Pasajeros
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={9}
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, Number(e.target.value) || 1))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    <Luggage className="inline h-3 w-3 mr-0.5" />
                    Maletas
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={6}
                    value={luggage}
                    onChange={(e) => setLuggage(Math.max(0, Number(e.target.value) || 0))}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {activeCategory.form === "hotel" && (
            <div className="px-4 pb-3">
              <div className="rounded-xl bg-slate-50 dark:bg-[#080C14] px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
                <Building2 className="inline h-3.5 w-3.5 mr-1.5 text-blue-500" />
                {dest || destination || "Destino"} · {nights > 0 ? `${nights} noches` : "fechas del viaje"} · {adults}{" "}
                {adults === 1 ? "persona" : "personas"}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            {platforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
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
            Kaviro abre la pantalla de búsqueda de cada web con los datos indicados. Si algún sitio no rellena todo automáticamente, confirma origen, fechas y pasajeros en su formulario.
          </p>
        </div>
      )}
    </div>
  );
}
