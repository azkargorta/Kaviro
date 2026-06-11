import Link from "next/link";
import Image from "next/image";
import KaviroTripHeroLockup from "@/components/brand/KaviroTripHeroLockup";
import TripHeroActions from "@/components/trip/common/TripHeroActions";
import TripHeroShareBar from "@/components/trip/common/TripHeroShareBar";
import TripHeroShareDropdown from "@/components/trip/common/TripHeroShareDropdown";
import TripMisViajesLink from "@/components/trip/common/TripMisViajesLink";
import type { AgencyBranding } from "@/lib/agency";
import { agencyBrandedHeroGradientDiagonal } from "@/lib/agency-brand-tokens";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
import { agencyHeroGradient } from "@/lib/agency-theme";
import { ExternalLink, Eye, Globe, MapPin } from "lucide-react";
import { travelerPreviewEntryHref } from "@/lib/trip-traveler-preview";
import { tripTimelineProgress } from "@/lib/trip-timeline-progress";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  if (parts.length === 1 && parts[0]!.length >= 2) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

type Props = {
  tripId: string;
  tripName: string;
  destination: string | null;
  participants: string[];
  startDate?: string | null;
  endDate?: string | null;
  isAgencyTrip?: boolean;
  useAgencyBranding?: boolean;
  agencyBranding?: AgencyBranding | null;
  clientPortalHref?: string | null;
};

function formatDestination(raw: string | null) {
  if (!raw) return "";
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]} · ${parts[1]}`;
  return raw;
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
  const fmt = (v: string) =>
    new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(`${v}T12:00:00`)
    );
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `Desde ${fmt(start)}`;
  if (end) return `Hasta ${fmt(end)}`;
  return null;
}

function tripStatus(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): { label: string; tone: "upcoming" | "active" | "done" | "unknown" } {
  const today = new Date().toISOString().slice(0, 10);
  if (!startDate || !endDate) return { label: "Planificando", tone: "unknown" };
  if (today < startDate) return { label: "Próximo viaje", tone: "upcoming" };
  if (today > endDate) return { label: "Viaje completado", tone: "done" };
  return { label: "En curso", tone: "active" };
}

function PersonalTripHeader({
  tripId,
  tripName,
  destination,
  participants,
  startDate,
  endDate,
}: {
  tripId: string;
  tripName: string;
  destination: string | null;
  participants: string[];
  startDate?: string | null;
  endDate?: string | null;
}) {
  const destLabel = formatDestination(destination);
  const dateRange = formatDateRange(startDate, endDate);
  const status = tripStatus(startDate, endDate);
  const progress = tripTimelineProgress(startDate ?? null, endDate ?? null);
  const shown = participants.slice(0, 5);
  const overflow = participants.length - shown.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
      <div
        data-tour="trip-hero-toolbar"
        className="flex items-start gap-3 px-4 pb-3 pt-[max(0.625rem,env(safe-area-inset-top))] max-md:pl-[max(0.75rem,var(--safe-area-left))] max-md:pr-[max(0.75rem,var(--safe-area-right))] md:items-center md:gap-4 md:px-5 md:py-4"
      >
        <TripMisViajesLink tour className="hidden shrink-0 md:inline-flex" />

        <div className="min-w-0 flex-1 border-l-0 md:border-l-2 md:border-[var(--brand)] md:pl-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                status.tone === "active"
                  ? "bg-[var(--brand-light)] text-[var(--brand-text)]"
                  : "bg-slate-100 text-slate-600 dark:bg-[#141c2b] dark:text-slate-400"
              }`}
            >
              {status.tone === "active" ? (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand)]" aria-hidden />
              ) : null}
              {status.label}
            </span>
            {destLabel ? (
              <span className="inline-flex min-w-0 items-center gap-1 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <MapPin className="h-3 w-3 shrink-0 text-[var(--brand)]" aria-hidden />
                {destLabel}
              </span>
            ) : null}
          </div>

          <h1 className="mt-1 truncate text-lg font-extrabold tracking-tight text-slate-900 dark:text-white md:text-xl">
            {tripName}
          </h1>

          {dateRange ? (
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{dateRange}</p>
          ) : null}

          {status.tone === "active" && progress !== null ? (
            <div className="mt-2.5 max-w-md">
              <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                <span>Progreso del viaje</span>
                <span className="tabular-nums text-slate-500">{progress}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1E293B]">
                <div
                  className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="hidden items-center gap-1.5 md:flex">
            <TripHeroShareDropdown tripId={tripId} tripName={tripName} destination={destination} />
            <TripHeroActions tripId={tripId} />
          </div>
          {shown.length > 0 ? (
            <div className="flex items-center -space-x-2" title={`${participants.length} participantes`}>
              {shown.map((name, i) => (
                <span
                  key={i}
                  title={name}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200 dark:border-[#0F1623] dark:bg-[#1E293B] dark:text-slate-200 dark:ring-[#334155]"
                >
                  {initials(name)}
                </span>
              ))}
              {overflow > 0 ? (
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[var(--brand-light)] text-[10px] font-bold text-[var(--brand-text)] ring-1 ring-[var(--brand-border)] dark:border-[#0F1623]"
                  title={`+${overflow} más`}
                >
                  +{overflow}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <TripHeroShareBar tripId={tripId} tripName={tripName} destination={destination} />
    </div>
  );
}

export default function TripHeroCard({
  tripId,
  tripName,
  destination,
  participants,
  startDate,
  endDate,
  isAgencyTrip = false,
  useAgencyBranding = false,
  agencyBranding = null,
  clientPortalHref = null,
}: Props) {
  if (!isAgencyTrip && !useAgencyBranding) {
    return (
      <PersonalTripHeader
        tripId={tripId}
        tripName={tripName}
        destination={destination}
        participants={participants}
        startDate={startDate}
        endDate={endDate}
      />
    );
  }

  const destLabel = formatDestination(destination);
  const shown = participants.slice(0, 5);
  const overflow = participants.length - shown.length;
  const branded = useAgencyBranding && agencyBranding;
  const heroBackground = branded
    ? agencyBrandedHeroGradientDiagonal(agencyBranding.brandColor)
    : isAgencyTrip
      ? agencyHeroGradient
      : "linear-gradient(135deg, #F87171 0%, #EF4444 60%, #B91C1C 100%)";

  return (
    <div
      className={`relative shadow-sm ${isAgencyTrip ? "rounded-lg" : "rounded-2xl"}`}
      style={{ background: heroBackground }}
    >
      {!isAgencyTrip ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <span
            className="absolute -right-8 -top-8 h-36 w-36 rounded-full"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
          <span
            className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
        </div>
      ) : null}

      <div
        data-tour="trip-hero-toolbar"
        className="flex items-center justify-between gap-2 px-4 pb-1.5 pt-[max(0.5rem,env(safe-area-inset-top))] max-md:pl-[max(0.75rem,var(--safe-area-left))] max-md:pr-[max(0.75rem,var(--safe-area-right))] md:gap-3 md:pb-2 md:pt-[max(0.75rem,env(safe-area-inset-top))]"
      >
        {!isAgencyTrip ? (
          <TripMisViajesLink variant="hero" tour className="hidden md:inline-flex" />
        ) : null}

        {branded ? (
          <Link
            href={isAgencyTrip ? "/agency" : "/dashboard"}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label={agencyBranding.name}
          >
            {agencyBranding.logoUrl ? (
              <span className="relative h-9 w-9 overflow-hidden rounded-lg bg-white/15 ring-2 ring-white/25">
                <Image
                  src={agencyBranding.logoUrl}
                  alt=""
                  fill
                  className="object-contain p-0.5"
                  sizes="36px"
                  unoptimized
                />
              </span>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-sm font-black text-white ring-2 ring-white/25">
                {agencyBranding.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="max-w-[7rem] truncate text-sm font-bold text-white sm:max-w-[9rem]">
              {agencyBranding.name}
            </span>
          </Link>
        ) : !isAgencyTrip ? (
          <span className="hidden h-4 w-px shrink-0 bg-white/25 md:inline" aria-hidden />
        ) : (
          <KaviroTripHeroLockup size="sm" href="/agency" className="shrink-0" />
        )}

        <div className="min-w-0 flex-1 self-center">
          {branded ? (
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">
              {isAgencyTrip
                ? `${KAVIRO_TRIPS_PRODUCT_NAME} · ${agencyBranding.name}`
                : `Tu viaje con ${agencyBranding.name}`}
            </p>
          ) : isAgencyTrip ? (
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
              {KAVIRO_TRIPS_PRODUCT_NAME}
            </p>
          ) : null}
          {destLabel ? (
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
              {destLabel.toUpperCase()}
            </p>
          ) : null}
          <h1
            className={`truncate leading-tight text-white ${
              isAgencyTrip ? "text-lg font-semibold sm:text-xl" : "text-lg font-black sm:text-xl"
            }`}
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.30)" }}
          >
            {tripName}
          </h1>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {!isAgencyTrip ? (
            <div className="flex items-center gap-1.5">
              <span className="hidden md:inline-flex">
                <TripHeroShareDropdown tripId={tripId} tripName={tripName} destination={destination} />
              </span>
              <TripHeroActions tripId={tripId} />
            </div>
          ) : null}
          {shown.length > 0 ? (
            <div className="flex items-center -space-x-2">
              {shown.map((name, i) => (
                <span
                  key={i}
                  title={name}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold text-white ring-2 ring-white/30"
                >
                  {initials(name)}
                </span>
              ))}
              {overflow > 0 ? (
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white ring-2 ring-white/30"
                  title={`+${overflow} más`}
                >
                  +{overflow}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {isAgencyTrip ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 px-4 pb-3 pt-2">
          <Link
            href="/agency"
            className="text-xs font-semibold text-white/90 underline-offset-2 hover:underline"
          >
            ← Panel de viajes
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href={travelerPreviewEntryHref(tripId)}
              className="inline-flex items-center gap-1 rounded-md border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
              title="Menú Kaviro del viajero invitado (resumen, gastos, avisos…)"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden />
              Vista como cliente
            </Link>
            <Link
              href={`/trip/${tripId}/client-preview`}
              className="inline-flex items-center gap-1 rounded-md border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/20 hover:text-white"
              title="Página pública del portal (solo itinerario publicado)"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden />
              Portal web
            </Link>
            {clientPortalHref ? (
              <Link
                href={clientPortalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/20 hover:text-white"
              >
                Portal publicado
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <TripHeroShareBar tripId={tripId} tripName={tripName} destination={destination} />
      )}
    </div>
  );
}
