import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import type { PublicRecapStats } from "@/lib/public-trip-recap-stats";

type Trip = {
  name: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${value}T12:00:00`)
  );
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${Math.round(amount)} ${currency}`;
  }
}

function calcDays(start: string, end: string) {
  return (
    Math.round(
      (new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86400000
    ) + 1
  );
}

export default function ShareTripRecap({
  trip,
  stats,
}: {
  trip: Trip;
  stats: PublicRecapStats;
}) {
  const name = trip.name?.trim() || "Viaje";
  const dest = trip.destination?.trim();
  const start = formatDate(trip.start_date);
  const end = formatDate(trip.end_date);
  const days =
    trip.start_date && trip.end_date ? calcDays(trip.start_date, trip.end_date) : null;

  const statCards = [
    { label: "Actividades", value: String(stats.activitiesCount), emoji: "🗓️" },
    { label: "Participantes", value: String(stats.participantsCount), emoji: "👥" },
    { label: "Gastos", value: String(stats.expensesCount), emoji: "💸" },
    { label: "Rutas", value: String(stats.routesCount), emoji: "🗺️" },
    ...(stats.routesDistanceKm != null && stats.routesDistanceKm > 0
      ? [{ label: "Km en rutas", value: String(stats.routesDistanceKm), emoji: "🛣️" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="page-shell max-w-lg py-10 md:py-14">
        <Reveal variant="fade">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FCA5A5]">Recap del viaje</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight">{name}</h1>
          {dest ? <p className="mt-2 text-lg text-slate-300">📍 {dest}</p> : null}
          {start && end ? (
            <p className="mt-1 text-sm text-slate-400">
              {start} — {end}
              {days ? ` · ${days} días` : ""}
            </p>
          ) : null}
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-3 motion-stagger-list">
          {statCards.map((card, idx) => (
            <Reveal key={card.label} variant="scale" delay={(idx % 4) as 0 | 1 | 2 | 3}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-2xl" aria-hidden>
                  {card.emoji}
                </p>
                <p className="mt-2 text-2xl font-extrabold tabular-nums">{card.value}</p>
                <p className="text-xs font-semibold text-slate-400">{card.label}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {stats.expensesCount > 0 && stats.totalSpent > 0 ? (
          <Reveal variant="slide" delay={2} className="mt-6">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-200/90">Gasto total (moneda del viaje)</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums">
                {formatMoney(stats.totalSpent, stats.currency)}
              </p>
            </div>
          </Reveal>
        ) : null}

        <Reveal variant="fade" delay={3} className="mt-10 text-center">
          <p className="text-sm text-slate-400">Organizado con</p>
          <Link
            href="/"
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-[#F87171] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#ef4444]"
          >
            Crear tu viaje en Kaviro
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
