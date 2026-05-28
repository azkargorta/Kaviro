"use client";

import Link from "next/link";
import { APP_NAME } from "@/lib/brand";
import KaviroMark from "@/components/brand/KaviroMark";

type Props = {
  /** `dark` = texto oscuro (fondos claros). `light` = texto blanco (fondos coral/oscuros). */
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  /** Si `true`, muestra icono coral + nombre. Si `false`, solo icono. */
  withWordmark?: boolean;
  href?: string;
  className?: string;
  /** Clases extra para el icono o el lockup. */
  imageClassName?: string;
};

const iconPx = { sm: 36, md: 42, lg: 52 } as const;

const wordmarkClass = {
  sm: "text-lg font-extrabold tracking-tight",
  md: "text-xl font-extrabold tracking-tight",
  lg: "text-2xl font-extrabold tracking-tight",
} as const;

export default function KaviroLogo({
  variant = "dark",
  size = "md",
  withWordmark = false,
  href,
  className = "",
  imageClassName = "",
}: Props) {
  const px = iconPx[size];
  const isLight = variant === "light";
  const textColor = isLight ? "text-white" : "text-slate-900 dark:text-slate-50";

  const mark = withWordmark ? (
    <span className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      <KaviroMark
        size={px}
        className={[
          "shrink-0 overflow-hidden rounded-full shadow-sm",
          isLight ? "ring-1 ring-white/30" : "ring-1 ring-slate-200/80 dark:ring-slate-600/80",
          imageClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      />
      <span className={[wordmarkClass[size], textColor, "leading-none"].join(" ")}>{APP_NAME}</span>
    </span>
  ) : (
    <span className={`inline-flex items-center ${className}`.trim()}>
      <KaviroMark
        size={px}
        className={[
          "shrink-0 overflow-hidden rounded-full shadow-sm",
          isLight ? "ring-1 ring-white/40" : "ring-1 ring-slate-200/80",
          imageClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex shrink-0 items-center rounded-lg outline-none ring-cyan-300/0 transition hover:opacity-90 focus-visible:ring-2"
        aria-label={APP_NAME}
      >
        {mark}
      </Link>
    );
  }

  return mark;
}
