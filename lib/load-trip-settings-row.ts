import type { SupabaseClient } from "@supabase/supabase-js";

const SELECT_ATTEMPTS = [
  {
    cols: "id, name, destination, start_date, end_date, base_currency, budget_target, weather_stays, is_demo, description",
    missing: [] as string[],
  },
  {
    cols: "id, name, destination, start_date, end_date, base_currency, budget_target, is_demo, description",
    missing: ["weather_stays"],
  },
  {
    cols: "id, name, destination, start_date, end_date, base_currency, weather_stays, is_demo, description",
    missing: ["budget_target"],
  },
  {
    cols: "id, name, destination, start_date, end_date, base_currency, is_demo, description",
    missing: ["budget_target", "weather_stays"],
  },
];

export async function loadTripSettingsRow(client: SupabaseClient, tripId: string) {
  let lastError: Error | null = null;

  for (const attempt of SELECT_ATTEMPTS) {
    const { data, error } = await client.from("trips").select(attempt.cols).eq("id", tripId).maybeSingle();
    if (!error && data) {
      const row = data as unknown as Record<string, unknown>;
      if (!("budget_target" in row)) row.budget_target = null;
      if (!("weather_stays" in row)) row.weather_stays = null;
      return { data: row, missingColumns: attempt.missing };
    }
    if (error) lastError = new Error(error.message);
  }

  if (lastError) throw lastError;
  return { data: null, missingColumns: ["budget_target", "weather_stays"] };
}
