"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { TripWorkspaceMeta } from "@/lib/load-trip-workspace";
import { clientPortalPath } from "@/lib/agency";
import { shouldUseAgencyBranding } from "@/lib/trip-agency-branding";

export type TripWorkspaceContextValue = TripWorkspaceMeta & {
  tripId: string;
  clientPortalHref: string | null;
  hideWeather: boolean;
  hideSocialFeatures: boolean;
  /** Viaje de agencia visto como cliente (invitado o vista previa): colores y logo de la agencia. */
  useAgencyBranding: boolean;
};

const TripWorkspaceContext = createContext<TripWorkspaceContextValue | null>(null);

export function TripWorkspaceProvider({
  tripId,
  meta,
  children,
}: {
  tripId: string;
  meta: TripWorkspaceMeta;
  children: ReactNode;
}) {
  const clientPortalHref =
    meta.isAgencyTrip && meta.agencySlug && meta.clientPortalSlug
      ? clientPortalPath(meta.agencySlug, meta.clientPortalSlug)
      : null;

  const useAgencyBranding = shouldUseAgencyBranding(meta);

  const value: TripWorkspaceContextValue = {
    ...meta,
    tripId,
    clientPortalHref,
    hideWeather: meta.isAgencyTrip,
    hideSocialFeatures: meta.isAgencyTrip,
    useAgencyBranding,
  };

  return <TripWorkspaceContext.Provider value={value}>{children}</TripWorkspaceContext.Provider>;
}

export function useTripWorkspace() {
  const ctx = useContext(TripWorkspaceContext);
  return (
    ctx ?? {
      tripId: "",
      isAgencyTrip: false,
      isAgencyManaged: false,
      agencyId: null,
      agencySlug: null,
      clientPortalSlug: null,
      clientPortalHref: null,
      hideWeather: false,
      hideSocialFeatures: false,
      agencyBranding: null,
      useAgencyBranding: false,
    }
  );
}
