import Image from "next/image";
import type { AgencyBranding } from "@/lib/agency";

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
      className="sticky top-0 z-40 border-b border-white/10 shadow-md"
      style={{
        background: `linear-gradient(90deg, ${branding.brandColor} 0%, #0f2744 100%)`,
      }}
    >
      <div className="mx-auto max-w-[980px] px-safe-inline py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {branding.logoUrl ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10">
                <Image
                  src={branding.logoUrl}
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg font-black text-white">
                {branding.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/80">
                {branding.name}
              </p>
              <h1 className="truncate text-xl font-extrabold text-white sm:text-2xl">{tripName}</h1>
              <p className="mt-0.5 text-sm text-white/85">
                {destination} · {dateRange}
              </p>
            </div>
          </div>
          {updatedLabel ? (
            <p className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              {updatedLabel}
            </p>
          ) : null}
        </div>
        {branding.contactEmail ? (
          <p className="mt-3 text-xs text-white/75">
            Contacto:{" "}
            <a href={`mailto:${branding.contactEmail}`} className="font-semibold underline">
              {branding.contactEmail}
            </a>
          </p>
        ) : null}
      </div>
    </header>
  );
}
