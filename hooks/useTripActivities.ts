"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notifyTripParticipants } from "@/lib/pushNotify";
import { dispatchTripOnboardingRefresh } from "@/lib/trip-onboarding";
import { getLocalTripBundle, isOffline } from "@/lib/offline/sync-trip-bundle";
export type TripActivity = {
  id: string;
  trip_id?: string;
  linked_reservation_id?: string | null;
  title: string;
  description?: string | null;
  rating?: number | null;
  comment?: string | null;
  activity_date?: string | null;
  activity_time?: string | null;
  place_name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  activity_type?: string | null;
  activity_kind?: string | null;
  source?: string | null;
  created_at?: string | null;
};

export type TripPlanSummary = {
  id: string;
  name?: string | null;
  destination?: string | null;
};

export type SaveActivityInput = {
  title: string;
  description?: string;
  rating?: number | null;
  comment?: string;
  activityDate?: string;
  activityTime?: string;
  placeName?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  activityKind?: string;
};

export type TripActivitiesInitial = {
  trip: TripPlanSummary | null;
  activities: TripActivity[];
  /** Nombre mostrado del usuario actual (push y UI). */
  actorName?: string;
};

export function useTripActivities(tripId: string, initial?: TripActivitiesInitial) {
  const actorName = initial?.actorName?.trim() || "Un participante";
  const [trip, setTrip] = useState<TripPlanSummary | null>(initial?.trip ?? null);
  const [unseenCount, setUnseenCount] = useState(0);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const [activities, setActivities] = useState<TripActivity[]>(initial?.activities ?? []);
  const [loading, setLoading] = useState(!initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function isLockAbortError(err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "";
    const name = err instanceof Error ? err.name : "";
    const lower = message.toLowerCase();
    return (
      name === "AbortError" ||
      lower.includes("the lock request is aborted") ||
      lower.includes("lock request is aborted")
    );
  }

  async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    let timer: number | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_resolve, reject) => {
          timer = window.setTimeout(() => reject(new Error(`Timeout (${label})`)), ms);
        }),
      ]);
    } finally {
      if (timer) window.clearTimeout(timer);
    }
  }

  async function apiRequest<T>(input: RequestInfo, init: RequestInit, label: string): Promise<T> {
    const resp = await withTimeout(fetch(input, init), 20000, label);
    const text = await resp.text();
    let payload: any = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { error: text || "Respuesta no JSON." };
    }
    if (!resp.ok) throw new Error(payload?.error || `Error ${resp.status}`);
    if (payload?.error) throw new Error(payload.error);
    return payload as T;
  }

  const load = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);

      if (isOffline()) {
        const local = await getLocalTripBundle(tripId);
        if (local) {
          setTrip((local.trip || null) as TripPlanSummary | null);
          setActivities(local.activities);
          setLoading(false);
          return;
        }
      }

      // Trip + actividades via API server-side (evita locks/hangs del navegador)
      const payload = await apiRequest<{ trip: TripPlanSummary | null; activities: TripActivity[] }>(
        `/api/trip-activities?tripId=${encodeURIComponent(tripId)}`,
        { method: "GET" },
        "cargar plan"
      );
      setTrip((payload.trip || null) as TripPlanSummary | null);
      setActivities(Array.isArray(payload.activities) ? payload.activities : []);
    } catch (err) {
      const local = await getLocalTripBundle(tripId);
      if (local) {
        setTrip((local.trip || null) as TripPlanSummary | null);
        setActivities(local.activities);
        setError(null);
        setLoading(false);
        return;
      }
      console.error(err);
      const msg =
        isLockAbortError(err)
          ? "El navegador ha abortado un lock de almacenamiento al cargar el plan. Prueba a recargar la página y cerrar otras pestañas de Kaviro."
          : err instanceof Error && err.message.startsWith("Timeout")
            ? "La carga del plan se ha quedado colgada (timeout). Revisa tu conexión/VPN y recarga la página."
            : err instanceof Error
              ? err.message
              : "No se pudo cargar el plan.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (initial) {
      setTrip(initial.trip ?? null);
      setActivities(initial.activities ?? []);
      setLoading(false);
      const revalidate = () => void load({ silent: true });
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(revalidate, { timeout: 8000 });
        return () => window.cancelIdleCallback(id);
      }
      const t = window.setTimeout(revalidate, 3000);
      return () => window.clearTimeout(t);
    }
    void load();
  }, [initial, load, tripId]);

  // ── Realtime: notify when another user changes activities ──────────────────
  useEffect(() => {
    if (!tripId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`trip-activities-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_activities",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          // Reload activities and increment unseen counter
          void load();
          if (payload.eventType !== "DELETE") {
            setUnseenCount((n) => n + 1);
          }
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId, load]);

  function clearUnseen() {
    setUnseenCount(0);
  }

  const createActivity = useCallback(
    async (input: SaveActivityInput) => {
      setSaving(true);
      setError(null);
      try {
        const created = await apiRequest<{ activity: TripActivity }>(
          "/api/trip-activities",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tripId,
              title: input.title.trim(),
              description: input.description?.trim() || null,
              rating: typeof input.rating === "number" && input.rating >= 1 && input.rating <= 5 ? input.rating : null,
              comment: input.comment?.trim() || null,
              activity_date: input.activityDate || null,
              activity_time: input.activityTime || null,
              place_name: input.placeName?.trim() || null,
              address: input.address?.trim() || null,
              latitude: input.latitude ?? null,
              longitude: input.longitude ?? null,
              activity_type: input.activityKind === "lodging" ? "lodging" : "general",
              activity_kind: input.activityKind || "visit",
              source: "manual",
            }),
          },
          "crear actividad"
        );

        await load();
        dispatchTripOnboardingRefresh(tripId);
        // Notify other participants (best-effort)
        if (tripId) {
          void notifyTripParticipants({
            tripId,
            event: "activity_added",
            actorName,
            detail: input.title?.trim() || "nueva actividad",
            url: `/trip/${tripId}/plan`,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo crear la actividad.");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [actorName, load, tripId]
  );

  const updateActivity = useCallback(
    async (activityId: string, input: SaveActivityInput) => {
      setSaving(true);
      setError(null);
      try {
        await apiRequest<{ activity: TripActivity }>(
          `/api/trip-activities/${activityId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: input.title.trim(),
              description: input.description?.trim() || null,
              rating: typeof input.rating === "number" && input.rating >= 1 && input.rating <= 5 ? input.rating : null,
              comment: input.comment?.trim() || null,
              activity_date: input.activityDate || null,
              activity_time: input.activityTime || null,
              place_name: input.placeName?.trim() || null,
              address: input.address?.trim() || null,
              latitude: input.latitude ?? null,
              longitude: input.longitude ?? null,
              activity_type: input.activityKind === "lodging" ? "lodging" : "general",
              activity_kind: input.activityKind || "visit",
            }),
          },
          "editar actividad"
        );

        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo actualizar la actividad.");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const deleteActivity = useCallback(
    async (activityId: string) => {
      const confirmed = window.confirm("¿Seguro que quieres borrar esta actividad del plan?");
      if (!confirmed) return;

      setSaving(true);
      setError(null);
      try {
        await apiRequest<{ ok: true }>(
          `/api/trip-activities/${activityId}`,
          { method: "DELETE" },
          "borrar actividad"
        );

        await load();
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const deleteActivitiesBulk = useCallback(
    async (activityIds: string[]) => {
      if (!activityIds.length) return;
      setSaving(true);
      setError(null);
      try {
        for (const activityId of activityIds) {
          await apiRequest<{ ok: true }>(
            `/api/trip-activities/${activityId}`,
            { method: "DELETE" },
            "borrar actividad"
          );
        }
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo borrar alguna actividad.");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  return {
    trip,
    activities,
    loading,
    saving,
    error,
    unseenCount,
    clearUnseen,
    reload: load,
    createActivity,
    updateActivity,
    deleteActivity,
    deleteActivitiesBulk,
  };
}
