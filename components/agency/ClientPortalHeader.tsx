import Image from "next/image";
import { Mail } from "lucide-react";
import type { AgencyBranding } from "@/lib/agency";
import { agencyBrandedHeroGradientDiagonal } from "@/lib/agency-brand-tokens";

type Props = {
  branding: AgencyBranding;
  tripName: string;
  destination: string;
  dateRange: string;
  updatedLabel?: string | null;
};

export default function ClientPortalHeader({
  branding,
  tripName,
  destination,
  dateRange,
  updatedLabel,
}: Props) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-white/10 shadow-lg"
      style={{ background: agencyBrandedHeroGradientDiagonal(branding.brandColor || "#1e3a5f") }}
    >
      <div className="mx-auto max-w-[980px] px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Logo + info */}
          <div className="flex min-w-0 items-center gap-3">
            {branding.logoUrl ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/15 shadow-sm ring-1 ring-white/20">
                <Image
                  src={branding.logoUrl}
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl font-black text-white shadow-sm ring-1 ring-white/20">
                {branding.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                {branding.name}
              </p>
              <h1 className="truncate text-xl font-extrabold leading-tight text-white sm:text-2xl">
                {tripName}
              </h1>
              <p className="mt-0.5 text-sm text-white/80">
                {destination} · {dateRange}
              </p>
            </div>
          </div>

          {/* Right side: badge + contact */}
          <div className="flex flex-col items-end gap-2">
            {updatedLabel && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                {updatedLabel}
              </span>
            )}
            {branding.contactEmail && (
              <a
                href={`mailto:${branding.contactEmail}`}
                className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/30"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Contactar
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
