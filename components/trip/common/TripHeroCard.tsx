import KaviroTripHeroLockup from "@/components/brand/KaviroTripHeroLockup";
import TripHeroActions from "@/components/trip/common/TripHeroActions";
import TripHeroShareBar from "@/components/trip/common/TripHeroShareBar";

// ---------------------------------------------------------------------------
// Helpers de avatar (misma lógica que TripParticipantsView)
// ---------------------------------------------------------------------------

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  if (parts.length === 1 && parts[0]!.length >= 2) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

const AVATAR_PALETTE = [
  { bg: "#ddd6fe", text: "#3730a3" }, // violet
  { bg: "#bae6fd", text: "#0c4a6e" }, // sky
  { bg: "#a7f3d0", text: "#064e3b" }, // emerald
  { bg: "#fde68a", text: "#78350f" }, // amber
  { bg: "#fbcfe8", text: "#831843" }, // pink
  { bg: "#fed7aa", text: "#7c2d12" }, // orange
  { bg: "#c7d2fe", text: "#312e81" }, // indigo
  { bg: "#99f6e4", text: "#134e4a" }, // teal
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]!;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

type Props = {
  tripId: string;
  tripName: string;
  destination: string | null;
  /** Nombres de pantalla de participantes (máx 5 mostrados) */
  participants: string[];
};

function formatDestination(raw: string | null): string {
  if (!raw) return "";
  // "Paris, France" → "PARIS · FRANCE"
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]!.toUpperCase()} · ${parts[1]!.toUpperCase()}`;
  return raw.toUpperCase();
}

export default function TripHeroCard({ tripId, tripName, destination, participants }: Props) {
  const destLabel = formatDestination(destination);
  const shown = participants.slice(0, 5);
  const overflow = participants.length - shown.length;

  return (
    <div
      className="relative rounded-2xl shadow-sm"
      style={{
        background: "linear-gradient(135deg, #F87171 0%, #EF4444 60%, #DC2626 100%)",
      }}
    >
      {/* Decorative circles — overflow-hidden isolado para no cortar el dropdown */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
      >
        <span
          className="absolute -right-8 -top-8 h-36 w-36 rounded-full"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
        <span
          className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
      </div>

      {/* Título + acciones (tour: data-tour="trip-hero-toolbar") */}
      <div
        data-tour="trip-hero-toolbar"
        className="flex items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] max-md:pl-[max(1rem,var(--safe-area-left))] max-md:pr-[max(1rem,var(--safe-area-right))]"
      >
        <KaviroTripHeroLockup size="sm" href="/dashboard" className="shrink-0" />

        <div className="min-w-0 flex-1 self-center">
          {destLabel && (
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
              {destLabel}
            </p>
          )}
          <h1 className="truncate text-lg font-black leading-tight text-white sm:text-xl">
            {tripName}
          </h1>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <TripHeroActions tripId={tripId} />
          {shown.length > 0 ? (
            <div className="flex items-center -space-x-2">
              {shown.map((name, i) => {
                const color = avatarColor(name);
                return (
                  <span
                    key={i}
                    title={name}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-extrabold ring-2 ring-white/60"
                    style={{ background: color.bg, color: color.text }}
                  >
                    {initials(name)}
                  </span>
                );
              })}
              {overflow > 0 ? (
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white ring-2 ring-white/60"
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
