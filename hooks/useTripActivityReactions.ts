"use client";

import { useCallback, useEffect, useState } from "react";
import {
  aggregateReactionsByActivity,
  type ActivityReactionRow,
  type ActivityReactionStats,
} from "@/lib/activity-reactions";

export function useTripActivityReactions(tripId: string, enabled = true) {
  const [reactions, setReactions] = useState<ActivityReactionRow[]>([]);
  const [byActivity, setByActivity] = useState<Map<string, ActivityReactionStats>>(new Map());
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const [tableReady, setTableReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tripId || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/trip-activity-reactions?tripId=${encodeURIComponent(tripId)}`,
        { credentials: "include", cache: "no-store" }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "No se pudieron cargar las respuestas.");
      }
      const rows = Array.isArray(data?.reactions) ? (data.reactions as ActivityReactionRow[]) : [];
      setReactions(rows);
      setByActivity(aggregateReactionsByActivity(rows));
      setTableReady(data.tableReady !== false);
      const pc = data?.participantCount;
      setParticipantCount(typeof pc === "number" && Number.isFinite(pc) ? pc : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las respuestas.");
      setReactions([]);
      setByActivity(new Map());
    } finally {
      setLoading(false);
    }
  }, [tripId, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    reactions,
    byActivity,
    participantCount,
    tableReady,
    loading,
    error,
    reload: load,
  };
}
