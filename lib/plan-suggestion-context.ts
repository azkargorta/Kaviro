import { createServerSupabase } from "@/lib/trip-ai/serverSupabase";

type ActivityRow = {
  title?: string | null;
  activity_time?: string | null;
  place_name?: string | null;
  address?: string | null;
  activity_kind?: string | null;
};

function fmtTime(value: string | null | undefined) {
  if (typeof value === "string" && /^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  return "??:??";
}

/** Contexto enfocado en un día concreto para sugerencias del plan. */
export async function buildPlanDayContextForSuggestion(tripId: string, date: string): Promise<string> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("trip_activities")
    .select("title, activity_time, place_name, address, activity_kind")
    .eq("trip_id", tripId)
    .eq("activity_date", date)
    .order("activity_time", { ascending: true, nullsFirst: false });

  const acts = (data || []) as ActivityRow[];
  if (acts.length === 0) {
    return (
      `Día ${date}: todavía NO hay actividades planificadas.\n` +
      `Sugiere la primera actividad concreta para ese día (visita, comida, traslado o check-in).`
    );
  }

  const lines = acts.map((row) => {
    const title = typeof row.title === "string" && row.title.trim() ? row.title.trim() : "Sin título";
    const place =
      (typeof row.place_name === "string" && row.place_name.trim()) ||
      (typeof row.address === "string" && row.address.trim()) ||
      "";
    const kind = typeof row.activity_kind === "string" ? row.activity_kind : "";
    return `- ${fmtTime(row.activity_time)} ${title}${place ? ` @ ${place}` : ""}${kind ? ` [${kind}]` : ""}`;
  });

  return (
    `Día ${date} — ${acts.length} actividad(es) planificada(s):\n${lines.join("\n")}\n` +
    `Busca huecos horarios, falta de comida, traslados entre paradas, tiempos muy apretados o falta de margen.`
  );
}

export function cleanPlanSuggestion(raw: string): string | null {
  const text = raw
    .trim()
    .replace(/^["'`]|["'`]$/g, "")
    .replace(/^IA sugiere:?\s*/i, "")
    .replace(/^Sugerencia:?\s*/i, "")
    .trim();

  if (!text || text.length < 10) return null;
  if (/^(null|ninguna|nada|ok|está bien|no hay)/i.test(text)) return null;
  if (/^considera\s/i.test(text)) return null;

  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

export function buildPlanSuggestionPrompt(params: {
  tripSummary: string;
  dayContext: string;
  exclude: string[];
}): string {
  const excludeHint =
    params.exclude.length > 0
      ? `\nNO repitas ni parafrasees estas sugerencias ya mostradas:\n${params.exclude.map((item) => `- ${item}`).join("\n")}\n`
      : "";

  return `${params.tripSummary}

${params.dayContext}
${excludeHint}
Eres un revisor de itinerarios. Propón UNA mejora concreta y accionable para ese día.
Prioriza: huecos sin actividad, comidas faltantes, traslados, solapes, reservas, margen de descanso o primera actividad si el día está vacío.
Formato: una sola frase en español, modo imperativo (empieza por verbo: Añadir, Reservar, Mover…), máximo 15 palabras.
PROHIBIDO empezar por «Considera», «Podrías» o «Te sugiero».
Responde null únicamente si el día no pertenece al viaje o es imposible inferir el contexto.`;
}

/** Segundo intento más insistente si el modelo fue demasiado conservador. */
export function buildPlanSuggestionRetryPrompt(params: { tripSummary: string; dayContext: string }): string {
  return `${params.tripSummary}

${params.dayContext}

El plan puede parecer correcto, pero necesito UNA mejora menor aunque sea pequeña: buffer de 30 min, comida, traslado, reserva, alternativa lluvia o descanso.
Una sola frase imperativa en español (máx. 15 palabras). Solo null si el día no existe en el viaje.`;
}
