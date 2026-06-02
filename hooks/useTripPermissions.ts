"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  normalizePermissions,
  normalizeRole,
  type ParticipantPermissions,
  type TripRole,
} from "@/lib/permissions";

type TripPermissionParticipant = {
  id: string;
  trip_id: string;
  user_id: string | null;
  role: TripRole | null;
} & Partial<ParticipantPermissions>;

export function useTripPermissions(tripId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participant, setParticipant] = useState<TripPermissionParticipant | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    async function load() {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {
        setLoading(true);
        setError(null);

        timeoutId = setTimeout(() => {
          if (!isMounted) return;
          if (requestIdRef.current !== requestId) return;
          setError("Tiempo de espera cargando permisos. Reintenta o recarga la página.");
          setLoading(false);
        }, 8000);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const userId = session?.user?.id ?? null;

        if (!userId) {
          if (isMounted) setParticipant(null);
          return;
        }

        const { data, error } = await supabase
          .from("trip_participants")
          .select(
            "id, trip_id, user_id, role, can_manage_trip, can_manage_participants, can_manage_expenses, can_manage_plan, can_manage_map, can_manage_resources"
          )
          .eq("trip_id", tripId)
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        if (isMounted) setParticipant((data as TripPermissionParticipant | null) ?? null);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar los permisos");
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        if (isMounted && requestIdRef.current === requestId) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [tripId]);

  const role = useMemo(() => normalizeRole(participant?.role), [participant]);
  const permissions = useMemo(
    () => normalizePermissions(role, participant),
    [role, participant]
  );

  return {
    loading,
    error,
    participant,
    role,
    permissions,
    canManageTrip: permissions.can_manage_trip,
    canManageParticipants: permissions.can_manage_participants,
    canManageExpenses: permissions.can_manage_expenses,
    canManagePlan: permissions.can_manage_plan,
    canManageMap: permissions.can_manage_map,
    canManageResources: permissions.can_manage_resources,
  };
}
