"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type TripMapView from "@/components/trip/map/TripMapView";

const TripMapViewLazy = dynamic(() => import("@/components/trip/map/TripMapView"), {
  ssr: false,
  loading: () => (
    <div
      className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-[#334155] dark:bg-[#0B1220]"
      aria-busy="true"
      aria-label="Cargando mapa"
    >
      <p className="text-sm font-medium text-slate-500">Cargando mapa…</p>
    </div>
  ),
});

export default function TripMapViewDynamic(props: ComponentProps<typeof TripMapView>) {
  return <TripMapViewLazy {...props} />;
}
