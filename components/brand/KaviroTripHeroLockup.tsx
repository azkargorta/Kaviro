"use client";

import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/brand";

type Props = {
  size?: "sm" | "md";
  href?: string;
  className?: string;
  /** Oculta el texto del nombre; solo muestra el icono (para móvil con poco espacio). */
  hideText?: boolean;
};

const ringPx = { sm: 36, md: 44 } as const;
const textClass = { sm: "text-lg", md: "text-xl" } as const;
const markPx = { sm: 22, md: 26 } as const;

/**
 * Lockup del banner coral: anillo blanco + solo la K del icono + «Kaviro».
 * El icono coral se funde con el fondo (`mix-blend-lighten`) y deja visible la K blanca.
 */
export default function KaviroTripHeroLockup({ size = "sm", href = "/dashboard", className = "", hideText = false }: Props) {
  const ring = ringPx[size];
  const mark = markPx[size];

  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      <span
        className="relative flex shrink-0 items-center justify-center rounded-full border-[2.5px] border-white"
        style={{ width: ring, height: ring }}
        aria-hidden
      >
        <Image
          src="/brand/icon.png"
          alt=""
          width={mark}
          height={mark}
          className="rounded-full mix-blend-lighten"
          style={{ width: mark, height: mark }}
        />
      </span>
      {!hideText ? (
        <span className={`font-extrabold tracking-tight text-white leading-none ${textClass[size]}`}>{APP_NAME}</span>
      ) : null}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex shrink-0 items-center rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/50"
        aria-label={APP_NAME}
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
