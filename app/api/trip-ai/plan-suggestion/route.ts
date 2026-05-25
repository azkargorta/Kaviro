import { NextResponse } from "next/server";
import { buildTripSummaryForAi } from "@/lib/trip-ai/buildTripSummary";
import { askTripAIWithUsage } from "@/lib/trip-ai/providers";
import { enforceAiMonthlyBudgetOrThrow, trackAiUsage } from "@/lib/ai-budget";
import { monthKeyUtc } from "@/lib/ai-usage";
import { isPremiumEnabledForTrip } from "@/lib/entitlements";
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

    const tripSummary = await buildTripSummaryForAi(tripId);
    const dayHint = date
      ? `Enfócate solo en el día ${date}: huecos horarios, traslados, comidas o mejoras concretas.`
      : "Enfócate en el día más próximo o con más huecos del plan.";

    const prompt = `${tripSummary}

${dayHint}

Responde con UNA sola frase corta y accionable en español (máximo 15 palabras), como sugerencia para mejorar el itinerario.
Ejemplos: "Añadir traslado al aeropuerto", "Reservar comida entre museo y parque".
Si el plan está bien equilibrado, responde exactamente: null`;

    const { text, usage } = await askTripAIWithUsage(prompt, "general", {});
    await trackAiUsage({
      supabase: gate.supabase,
      userId,
      provider: (process.env.AI_PROVIDER || "gemini").toLowerCase(),
      monthKey,
      usage,
    });

    const suggestion = cleanSuggestion(text || "");
    return NextResponse.json({ suggestion, date: date || null });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo generar la sugerencia." },
      { status: 500 }
    );
  }
}
