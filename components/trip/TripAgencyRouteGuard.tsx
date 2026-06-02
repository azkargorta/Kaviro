"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { agencyTripDefaultPath, isAgencyTripBlockedPath } from "@/lib/kaviro-trips-trip-nav";
import { useTripWorkspace } from "@/components/trip/TripWorkspaceContext";

/** Redirige rutas B2C no disponibles en viajes Kaviro Trips. */
export default function TripAgencyRouteGuard() {
  const { isAgencyTrip, tripId } = useTripWorkspace();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAgencyTrip || !tripId) return;
    if (!isAgencyTripBlockedPath(pathname)) return;
    router.replace(agencyTripDefaultPath(tripId));
  }, [isAgencyTrip, tripId, pathname, router]);

  return null;
}
