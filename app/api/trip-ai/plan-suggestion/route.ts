import { NextResponse } from "next/server";
import { buildTripSummaryForAi } from "@/lib/trip-ai/buildTripSummary";
import { askTripAIWithUsage } from "@/lib/trip-ai/providers";
import { enforceAiMonthlyBudgetOrThrow, trackAiUsage } from "@/lib/ai-budget";
import { monthKeyUtc } from "@/lib/ai-usage";
import { isPremiumEnabledForTrip } from "@/lib/entitlements";
import {
  consumePlanSuggestionNextSlot,
  getCachedPlanSuggestion,
  peekPlanSuggestionNextRemaining,
  planSuggestionCacheKey,
  setCachedPlanSuggestion,
} from "@/lib/plan-suggestion-guard";
import { PLAN_SUGGESTION_MAX_OUTPUT_TOKENS, PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR } from "@/lib/plan-suggestion-constants";
import { requireTripAccessApi } from "@/lib/trip-access-api";

export const runtime = "nodejs";
export const maxDuration = 60;

function cleanSuggestion(raw: string): string | null {
  const text = raw
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^IA sugiere:?\s*/i, "")
    .replace(/^Sugerencia:?\s*/i, "")
    .trim();
  if (!text || text.length < 8) return null;
  if (/^(null|ninguna|nada|ok|está bien)/i.test(text)) return null;
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tripId = typeof body?.tripId === "string" ? body.tripId.trim() : "";
    const date = typeof body?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date.trim()) ? body.date.trim() : "";
    const exclude = Array.isArray(body?.exclude)
      ? body.exclude
          .filter((item: unknown): item is string => typeof item === "string")
          .map((item: string) => item.trim())
          .filter(Boolean)
          .slice(0, 24)
      : [];
    const isNextRequest = exclude.length > 0;

    if (!tripId) {
      return NextResponse.json({ error: "Falta el ID del viaje." }, { status: 400 });
    }

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;

    const monthKey = monthKeyUtc();
    let userId = "";
    try {
      const budget = await enforceAiMonthlyBudgetOrThrow({ providerId: null });
      userId = budget.userId;
    } catch (e) {
      const err = e as { httpStatus?: number; code?: string; message?: string; budget?: unknown };
      const status = typeof err?.httpStatus === "number" ? err.httpStatus : err?.code === "AI_BUDGET_EXCEEDED" ? 402 : 401;
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "No autenticado.", code: err?.code || null, budget: err?.budget || null },
        { status }
      );
    }

    const isPremium = await isPremiumEnabledForTrip({ supabase: gate.supabase, userId, tripId });
    if (!isPremium) {
      return NextResponse.json(
        { error: "Necesitas Premium para sugerencias IA del plan.", code: "PREMIUM_REQUIRED" },
        { status: 402 }
      );
    }

    const cacheKey = planSuggestionCacheKey(tripId, date, exclude);
    const cached = getCachedPlanSuggestion(cacheKey);
    if (cached !== undefined) {
      return NextResponse.json({
        suggestion: cached,
        date: date || null,
        cached: true,
        nextRemaining: peekPlanSuggestionNextRemaining(userId, tripId),
        nextLimit: PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR,
      });
    }

    if (isNextRequest) {
      const rate = consumePlanSuggestionNextSlot(userId, tripId);
      if (!rate.allowed) {
        return NextResponse.json(
          {
            error: `Has alcanzado el límite de sugerencias alternativas (${PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR} por hora en este viaje).`,
            code: "PLAN_SUGGESTION_RATE_LIMIT",
            nextRemaining: 0,
            nextLimit: PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR,
            retryAfterMs: rate.retryAfterMs,
          },
          { status: 429 }
        );
      }
    }

    const tripSummary = await buildTripSummaryForAi(tripId);
    const dayHint = date
      ? `Enfócate solo en el día ${date}: huecos horarios, traslados, comidas o mejoras concretas.`
      : "Enfócate en el día más próximo o con más huecos del plan.";

    const excludeHint =
      exclude.length > 0
        ? `\nNO repitas ni parafrasees estas sugerencias ya mostradas al usuario:\n${exclude.map((item: string) => `- ${item}`).join("\n")}\nPropón algo distinto y complementario.\n`
        : "";

    const prompt = `${tripSummary}

${dayHint}
${excludeHint}
Responde con UNA sola frase corta y accionable en español (máximo 15 palabras), como sugerencia para mejorar el itinerario.
Ejemplos: "Añadir traslado al aeropuerto", "Reservar comida entre museo y parque".
Si no hay ninguna mejora razonable${exclude.length > 0 ? " distinta de las ya listadas" : ""}, responde exactamente: null`;

    const { text, usage } = await askTripAIWithUsage(prompt, "general", {
      maxOutputTokens: PLAN_SUGGESTION_MAX_OUTPUT_TOKENS,
    });
    await trackAiUsage({
      supabase: gate.supabase,
      userId,
      provider: (process.env.AI_PROVIDER || "gemini").toLowerCase(),
      monthKey,
      usage,
    });

    const suggestion = cleanSuggestion(text || "");
    setCachedPlanSuggestion(cacheKey, suggestion);

    return NextResponse.json({
      suggestion,
      date: date || null,
      cached: false,
      nextRemaining: peekPlanSuggestionNextRemaining(userId, tripId),
      nextLimit: PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo generar la sugerencia." },
      { status: 500 }
    );
  }
}
