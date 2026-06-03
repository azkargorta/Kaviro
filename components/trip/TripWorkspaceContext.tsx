"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { TripWorkspaceMeta } from "@/lib/load-trip-workspace";
import { clientPortalPath } from "@/lib/agency";

export type TripWorkspaceContextValue = TripWorkspaceMeta & {
  tripId: string;
  clientPortalHref: string | null;
  hideWeather: boolean;
  hideSocialFeatures: boolean;
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

  const value: TripWorkspaceContextValue = {
    ...meta,
    tripId,
    clientPortalHref,
    hideWeather: meta.isAgencyTrip,
    hideSocialFeatures: meta.isAgencyTrip,
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
    }
  );
}
