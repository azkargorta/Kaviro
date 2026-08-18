import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askTripAIWithUsage } from "@/lib/trip-ai/providers";
import { extractJsonObject } from "@/lib/trip-ai/tripCreationJson";
import { enforceAiMonthlyBudgetOrThrow, resolveAiBudgetGateError, trackAiUsage } from "@/lib/ai-budget";
import { monthKeyUtc } from "@/lib/ai-usage";
import {
  emptyPlannerBrief,
  getPlannerMissingField,
  mergePlannerBrief,
  normalizePlannerBrief,
  PLANNER_MISSING_QUESTIONS,
  type PlannerBrief,
  type PlannerMissingField,
} from "@/lib/trip-ai/plannerBrief";

export const runtime = "nodejs";
export const maxDuration = 60;

const WELCOME =
  "Cuéntame tu viaje: a dónde queréis ir, cuándo, cómo os movéis y cualquier detalle (vuelos, coche, pueblos de alrededor…). Con lo que me digas relleno la ficha y te pregunto solo lo que falte.";

function userSkippedOpenField(text: string, field: PlannerMissingField | null): PlannerBrief | null {
  if (field !== "arrival" && field !== "departure") return null;
  const q = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!/\b(no lo se|no se|aun no|todavia no|da igual|dejalo abierto|sin hora|no tengo hora|no lo tengo|mas adelante)\b/.test(q)) {
    return null;
  }
  const patch = emptyPlannerBrief();
  if (field === "arrival") patch.arrivalSkipped = true;
  if (field === "departure") patch.departureSkipped = true;
  return patch;
}

function buildExtractPrompt(todayIso: string, brief: PlannerBrief, userText: string): string {
  return `Eres el Travel Interviewer de Kaviro. Recoges datos estructurados para que OTRO motor diseñe el viaje.
Hoy es ${todayIso} (usa este año si el usuario dice día/mes sin año).
NO inventes el itinerario, NO listes días ni actividades, NO propongas un planning completo.

Para cada mensaje:
1. Extrae información nueva.
2. Actualiza la ficha.
3. Detecta contradicciones.
4. Pregunta como máximo UNA cosa principal (la app añade la pregunta; tú resume).
5. No preguntes lo que ya está en la ficha.
6. Acepta "no lo sé", "tú decide" y respuestas flexibles.

Devuelve SOLO un objeto JSON (sin markdown) con este esquema. Usa null o [] si no consta:

{
  "destination": string|null,
  "destinationKind": "city"|"region"|"multi"|null,
  "sleepBases": string[],
  "origin": string|null,
  "startDate": "YYYY-MM-DD"|null,
  "endDate": "YYYY-MM-DD"|null,
  "durationDays": number|null,
  "arrival": { "place": string|null, "date": "YYYY-MM-DD"|null, "time": "HH:MM"|null },
  "departure": { "place": string|null, "date": "YYYY-MM-DD"|null, "time": "HH:MM"|null },
  "transport": "driving"|"transit"|"walking"|"mixed"|null,
  "nearbyExcursions": "yes"|"maybe"|"no"|null,
  "travelersType": "solo"|"couple"|"friends"|"family"|null,
  "travelerCount": number|null,
  "pace": "relaxed"|"balanced"|"intense"|null,
  "budgetBand": "low"|"medium"|"comfortable"|"premium"|null,
  "stayChangePref": "few"|"medium"|"many"|null,
  "interests": string[],
  "constraints": string[],
  "avoid": string[],
  "mustDo": string[],
  "suggestedTripName": string|null,
  "arrivalSkipped": boolean,
  "departureSkipped": boolean,
  "proposedSleepBases": string[],
  "assistantReply": string
}

Reglas de extracción:
- destinationKind "city" solo si es UNA ciudad o pueblo concreto donde se puede dormir (Lisboa, Roma, Cádiz).
- "region" si es provincia, comunidad, país, isla o zona amplia.
- "multi" si nombra dos o más sitios (ej. "X e Y").
- sleepBases: ciudades/pueblos donde DORMIR, no la provincia. El ORDEN en que las nombra el usuario NO es una ruta: es un conjunto.
- proposedSleepBases: si destinationKind es region o multi y aún no hay sleepBases, propone 3-5 pueblos/ciudades turísticas REALES de esa zona. Si ya hay bases, [].
- stayChangePref: few = pocas bases; many = más lugares; medium = equilibrio.
- avoid: lo que NO quiere (museos, senderismo, conducir…). "No quiero" = no incluir, no prioridad baja.
- mustDo: imprescindibles.
- Fechas: en un relato en español, "6 de diciembre" y "11/12" en el mismo contexto suelen ser el mismo mes. time en 24h.
- transport driving si dice coche, alquiler, auto, carretera.
- nearbyExcursions "yes" si quiere pueblos o alrededores.
- arrivalSkipped/departureSkipped true solo si el usuario dice que no sabe hora/lugar.
- assistantReply: 2-5 frases en español. Resume lo entendido. Si acepta varias bases, deja claro que el orden de noches lo calculará el plan (llegada/salida y menos km), no el orden en que las ha dicho. NO hagas la siguiente pregunta (la app la añade). Si propones bases, menciónalas.
- No inventes reservas, horarios de apertura ni precios. Separa hechos de decisiones.
- Si hay homónimos de ciudad, pregunta el país en assistantReply.

Ficha actual:
${JSON.stringify(brief)}

Mensaje del usuario:
"""${userText.replace(/"""/g, '"').slice(0, 4000)}"""`;
}

export async function POST(req: Request) {
  try {
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    const { data: profileRow } = await supabaseAuth
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .maybeSingle();
    if (!Boolean((profileRow as { is_premium?: boolean } | null)?.is_premium)) {
      return NextResponse.json(
        { error: "Necesitas Premium para usar el planificador.", code: "PREMIUM_REQUIRED" },
        { status: 402 }
      );
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const start = body?.start === true;
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const prev = normalizePlannerBrief(body?.brief);

    if (start && !message) {
      return NextResponse.json({
        ok: true,
        brief: emptyPlannerBrief(),
        missingField: "destination" as const,
        nextQuestion: WELCOME,
        readyToPropose: false,
        proposedSleepBases: [] as string[],
        assistantReply: WELCOME,
      });
    }

    if (!message) {
      return NextResponse.json({ error: "Mensaje vacío." }, { status: 400 });
    }

    const missingBefore = getPlannerMissingField(prev);
    const skipPatch = userSkippedOpenField(message, missingBefore);

    let supabase: Awaited<ReturnType<typeof enforceAiMonthlyBudgetOrThrow>>["supabase"];
    let userId = user.id;
    try {
      const gate = await enforceAiMonthlyBudgetOrThrow({ providerId: "gemini" });
      supabase = gate.supabase;
      userId = gate.userId;
    } catch (e) {
      const gate = resolveAiBudgetGateError(e);
      return NextResponse.json(gate.body, { status: gate.status });
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    const prompt = buildExtractPrompt(todayIso, prev, message);
    let parsed: Record<string, unknown> | null = null;
    let lastUsage: Awaited<ReturnType<typeof askTripAIWithUsage>>["usage"] | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const { text, usage } = await askTripAIWithUsage(prompt, "planning", {
        provider: "gemini",
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      });
      lastUsage = usage;
      try {
        parsed = extractJsonObject(text) as Record<string, unknown>;
        break;
      } catch {
        if (attempt === 1) {
          // Last attempt: return a graceful error message instead of exposing "JSON inválido"
          return NextResponse.json({
            ok: true,
            brief: prev,
            missingField: getPlannerMissingField(prev),
            nextQuestion: null,
            readyToPropose: false,
            proposedSleepBases: [] as string[],
            assistantReply: "Perdona, no he podido procesar tu mensaje. ¿Puedes reformularlo de forma más corta o directa?",
          });
        }
      }
    }

    if (lastUsage) {
      await trackAiUsage({
        supabase,
        userId,
        provider: "gemini",
        monthKey: monthKeyUtc(),
        usage: lastUsage,
      });
    }
    const extracted = normalizePlannerBrief(parsed!);
    let brief = mergePlannerBrief(prev, extracted);
    if (skipPatch) brief = mergePlannerBrief(brief, skipPatch);

    const proposedSleepBases = Array.isArray(parsed!.proposedSleepBases)
      ? [...new Set((parsed!.proposedSleepBases as unknown[]).map((x) => String(x || "").trim()).filter(Boolean))].slice(0, 8)
      : [];

    const missingField = getPlannerMissingField(brief);
    const readyToPropose = missingField == null;
    const modelReply =
      typeof parsed!.assistantReply === "string" && (parsed!.assistantReply as string).trim()
        ? (parsed!.assistantReply as string).trim()
        : "He actualizado la ficha con lo que me has contado.";

    const nextQuestion = readyToPropose
      ? "Con esto puedo proponerte un itinerario. ¿Lo genero? Después podrás descargar un PDF y decidir si creas el viaje o lo ajustamos."
      : PLANNER_MISSING_QUESTIONS[missingField!];

    const assistantReply = readyToPropose ? `${modelReply}\n\n${nextQuestion}` : `${modelReply}\n\n${nextQuestion}`;

    return NextResponse.json({
      ok: true,
      brief,
      missingField,
      nextQuestion,
      readyToPropose,
      proposedSleepBases: brief.sleepBases.length ? [] : proposedSleepBases,
      assistantReply,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo continuar la entrevista." },
      { status: 500 }
    );
  }
}
