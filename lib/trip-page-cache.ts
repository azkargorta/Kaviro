import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { loadTripWorkspaceMeta } from "@/lib/load-trip-workspace";

/** Perfil demo compartido entre layout y páginas del viaje en la misma petición. */
export const getCachedProfileDemoTripId = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("demo_trip_id")
    .eq("id", userId)
    .maybeSingle();
  return data as { demo_trip_id?: string } | null;
});

/** Workspace del viaje compartido entre layout y páginas en la misma petición. */
export const getCachedTripWorkspaceMeta = cache(async (tripId: string, userId: string) => {
  const supabase = await createClient();
  return loadTripWorkspaceMeta(supabase, tripId, userId);
});
