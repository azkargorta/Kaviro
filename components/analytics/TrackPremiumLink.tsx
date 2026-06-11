"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";

type Props = Omit<ComponentProps<typeof Link>, "onClick"> & {
  source: string;
  children: ReactNode;
};

export default function TrackPremiumLink({ source, children, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={() => {
        trackEvent(ANALYTICS_EVENTS.PREMIUM_CLICKED, { source });
      }}
    >
      {children}
    </Link>
  );
}
