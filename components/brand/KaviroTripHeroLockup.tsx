"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { APP_NAME } from "@/lib/brand";

/** PNG de referencia (anillo + K + Kaviro sobre coral). Si no existe, se usa composición. */
const LOCKUP_CORAL_SRC = "/brand/kaviro-lockup-coral.png";

type Props = {
  size?: "sm" | "md";
  href?: string;
  className?: string;
};

const ringPx = { sm: 36, md: 44 } as const;
const textClass = { sm: "text-lg", md: "text-xl" } as const;
const imgH = { sm: 32, md: 40 } as const;

function ComposedLockup({ size }: { size: "sm" | "md" }) {
  const ring = ringPx[size];
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[2.5px] border-white"
        style={{ width: ring, height: ring }}
        aria-hidden
      >
        <Image
          src="/brand/kaviro-lockup-white.png"
          alt=""
          width={ring * 3}
          height={ring}
          className="absolute left-1/2 top-1/2 max-w-none -translate-x-[38%] -translate-y-1/2 mix-blend-screen"
          style={{ height: Math.round(ring * 0.85), width: "auto" }}
        />
      </span>
      <span className={`font-extrabold tracking-tight text-white leading-none ${textClass[size]}`}>{APP_NAME}</span>
    </span>
  );
}

export default function KaviroTripHeroLockup({ size = "sm", href = "/dashboard", className = "" }: Props) {
  const [useCustomAsset, setUseCustomAsset] = useState(true);
  const h = imgH[size];

  const inner = useCustomAsset ? (
    <Image
      src={LOCKUP_CORAL_SRC}
      alt={APP_NAME}
      width={Math.round(h * 4.8)}
      height={h}
      className={["w-auto object-contain object-left", className].filter(Boolean).join(" ")}
      style={{ height: h, width: "auto", maxWidth: "min(40vw, 9rem)" }}
      priority
      onError={() => setUseCustomAsset(false)}
    />
  ) : (
    <span className={className}>
      <ComposedLockup size={size} />
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
