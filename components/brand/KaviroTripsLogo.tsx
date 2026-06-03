"use client";

import Image from "next/image";
import Link from "next/link";
import KaviroMark from "@/components/brand/KaviroMark";
import { APP_NAME } from "@/lib/brand";
import { AGENCY_NAVY } from "@/lib/agency-theme";

const LOCKUP_NAVY_SRC = "/brand/kaviro-lockup-navy.svg";

type Props = {
  size?: "sm" | "md" | "lg";
  withWordmark?: boolean;
  lockup?: boolean;
  href?: string;
  className?: string;
  imageClassName?: string;
  /** Texto claro sobre fondos navy */
  variant?: "onDark" | "onLight";
};

const iconPx = { sm: 36, md: 42, lg: 52 } as const;
const lockupHeightPx = { sm: 28, md: 34, lg: 42 } as const;

const wordmarkClass = {
  sm: "text-lg font-extrabold tracking-tight",
  md: "text-xl font-extrabold tracking-tight",
  lg: "text-2xl font-extrabold tracking-tight",
} as const;

/** Marca Kaviro en paleta navy para Kaviro Trips (panel, login B2B, transiciones). */
export default function KaviroTripsLogo({
  size = "md",
  withWordmark = false,
  lockup = false,
  href,
  className = "",
  imageClassName = "",
  variant = "onDark",
}: Props) {
  const px = iconPx[size];
  const lockupH = lockupHeightPx[size];
  const textColor = variant === "onDark" ? "text-white" : "text-slate-900 dark:text-slate-50";

  if (lockup) {
    const lockupEl = (
      <Image
        src={LOCKUP_NAVY_SRC}
        alt={APP_NAME}
        width={Math.round(lockupH * 4.2)}
        height={lockupH}
        className={["w-auto object-contain object-left", imageClassName, className].filter(Boolean).join(" ")}
        style={{ height: lockupH, width: "auto", maxWidth: "min(42vw, 10rem)" }}
        priority
      />
    );
    if (href) {
      return (
        <Link href={href} className="inline-flex shrink-0 items-center rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/40" aria-label={APP_NAME}>
          {lockupEl}
        </Link>
      );
    }
    return lockupEl;
  }

  const mark = withWordmark ? (
    <span className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      <KaviroMark
        variant="navy"
        size={px}
        className={[
          "shrink-0 overflow-hidden rounded-[22%] shadow-sm",
          variant === "onDark" ? "ring-1 ring-white/25" : "ring-1 ring-slate-200/80",
          imageClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      />
      <span className={[wordmarkClass[size], textColor, "leading-none"].join(" ")} style={variant === "onLight" ? { color: AGENCY_NAVY } : undefined}>
        {APP_NAME}
      </span>
    </span>
  ) : (
    <span className={`inline-flex items-center ${className}`.trim()}>
      <KaviroMark variant="navy" size={px} className={["shrink-0 overflow-hidden rounded-[22%] shadow-sm", imageClassName].filter(Boolean).join(" ")} />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/40" aria-label={APP_NAME}>
        {mark}
      </Link>
    );
  }

  return mark;
}
