"use client";

import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12_000);

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}/access`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error || "No se pudieron cargar los permisos");

        const access = json?.access as Record<string, unknown> | undefined;
        if (!access) {
          if (!cancelled) setParticipant(null);
          return;
        }

        const role = normalizeRole(typeof access.role === "string" ? access.role : null);
        if (!cancelled) {
          setParticipant({
            id: "api",
            trip_id: tripId,
            user_id: null,
            role,
            can_manage_trip: Boolean(access.can_manage_trip),
            can_manage_participants: Boolean(access.can_manage_participants),
            can_manage_expenses: Boolean(access.can_manage_expenses),
            can_manage_plan: Boolean(access.can_manage_plan),
            can_manage_map: Boolean(access.can_manage_map),
            can_manage_resources: Boolean(access.can_manage_resources),
          });
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof Error && err.name === "AbortError"
              ? "Tiempo de espera cargando permisos. Reintenta o recarga la página."
              : err instanceof Error
                ? err.message
                : "No se pudieron cargar los permisos";
          setError(msg);
          setParticipant(null);
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
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
