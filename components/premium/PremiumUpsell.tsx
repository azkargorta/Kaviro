"use client";

import Link from "next/link";
import TrackPremiumLink from "@/components/analytics/TrackPremiumLink";
import {
  PREMIUM_FEATURE_COPY,
  PREMIUM_UPGRADE_HREF,
  type PremiumFeatureKey,
  tripPremiumCoopHint,
} from "@/lib/premium-copy";

type Props = {
  feature?: PremiumFeatureKey;
  /** Muestra la nota de premium compartido por participante. */
  showTripCoopHint?: boolean;
  className?: string;
  /** Enlace secundario (p. ej. volver al viaje). */
  secondaryHref?: string;
  secondaryLabel?: string;
};

export default function PremiumUpsell({
  feature = "generic",
  showTripCoopHint = true,
  className = "",
  secondaryHref,
  secondaryLabel,
}: Props) {
  const copy = PREMIUM_FEATURE_COPY[feature];

  return (
    <div
      className={`rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-light)] px-4 py-4 text-sm text-slate-900 dark:text-slate-100 ${className}`}
      role="status"
    >
      <div className="font-semibold text-[var(--brand-text)]">{copy.title}</div>
      <p className="mt-1 text-slate-700 dark:text-slate-300">{copy.description}</p>
      {showTripCoopHint ? (
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{tripPremiumCoopHint()}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <TrackPremiumLink
          href={PREMIUM_UPGRADE_HREF}
          source={`upsell_${feature}`}
          className="inline-flex min-h-[40px] items-center justify-center rounded-2xl bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-hover)]"
        >
          Mejorar a Premium
        </TrackPremiumLink>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-[var(--brand-border)] bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-[#0F1623] dark:text-slate-200"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
