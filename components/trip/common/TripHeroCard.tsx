import Link from "next/link";
import KaviroTripHeroLockup from "@/components/brand/KaviroTripHeroLockup";
import TripHeroActions from "@/components/trip/common/TripHeroActions";
import TripHeroShareBar from "@/components/trip/common/TripHeroShareBar";
import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
import { agencyHeroGradient } from "@/lib/agency-theme";
import { ExternalLink, Eye } from "lucide-react";

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
  isAgencyTrip?: boolean;
  clientPortalHref?: string | null;
};

function formatDestination(raw: string | null) {
  if (!raw) return "";
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]!.toUpperCase()} · ${parts[1]!.toUpperCase()}`;
  return raw.toUpperCase();
}

export default function TripHeroCard({
  tripId,
  tripName,
  destination,
  participants,
  isAgencyTrip = false,
  clientPortalHref = null,
}: Props) {
  const destLabel = formatDestination(destination);
  const shown = participants.slice(0, 5);
  const overflow = participants.length - shown.length;

  return (
    <div
      className={`relative shadow-sm ${isAgencyTrip ? "rounded-lg" : "rounded-2xl"}`}
      style={{
        background: isAgencyTrip
          ? agencyHeroGradient
          : "linear-gradient(135deg, #F87171 0%, #EF4444 60%, #DC2626 100%)",
      }}
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
        className="flex items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] max-md:pl-[max(1rem,var(--safe-area-left))] max-md:pr-[max(1rem,var(--safe-area-right))]"
      >
        <KaviroTripHeroLockup
          size="sm"
          href={isAgencyTrip ? "/agency" : "/dashboard"}
          className="shrink-0"
        />

        <div className="min-w-0 flex-1 self-center">
          {isAgencyTrip ? (
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
              {KAVIRO_TRIPS_PRODUCT_NAME}
            </p>
          ) : null}
          {destLabel ? (
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
              {destLabel}
            </p>
          ) : null}
          <h1
            className={`truncate leading-tight text-white ${
              isAgencyTrip ? "text-lg font-semibold sm:text-xl" : "text-lg font-black sm:text-xl"
            }`}
          >
            {tripName}
          </h1>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {!isAgencyTrip ? <TripHeroActions tripId={tripId} /> : null}
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
              href={`/trip/${tripId}/client-preview`}
              className="inline-flex items-center gap-1 rounded-md border border-white/25 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden />
              Vista como cliente
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
