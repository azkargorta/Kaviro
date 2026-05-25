import { NextResponse } from "next/server";
import { buildTripSummaryForAi } from "@/lib/trip-ai/buildTripSummary";
import { askTripAIWithUsage } from "@/lib/trip-ai/providers";
import type { TripAiUsage } from "@/lib/trip-ai/providers";
import { enforceAiMonthlyBudgetOrThrow, trackAiUsage } from "@/lib/ai-budget";
import { monthKeyUtc } from "@/lib/ai-usage";
import { isPremiumEnabledForTrip } from "@/lib/entitlements";
import {
  buildPlanDayContextForSuggestion,
  buildPlanSuggestionPrompt,
  buildPlanSuggestionRetryPrompt,
  cleanPlanSuggestion,
} from "@/lib/plan-suggestion-context";
import {
  consumePlanSuggestionNextSlot,
  getCachedPlanSuggestion,
  peekPlanSuggestionNextRemaining,
  planSuggestionCacheKey,
  setCachedPlanSuggestion,
} from "@/lib/plan-suggestion-guard";
import { PLAN_SUGGESTION_MAX_OUTPUT_TOKENS, PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR } from "@/lib/plan-suggestion-constants";
import { requireTripAccessApi } from "@/lib/trip-access-api";
import { createServerSupabase } from "@/lib/trip-ai/serverSupabase";

export const runtime = "nodejs";
export const maxDuration = 60;

function mergeUsage(a: TripAiUsage, b: TripAiUsage): TripAiUsage {
  const inputTokens =
    typeof a.inputTokens === "number" || typeof b.inputTokens === "number"
      ? (a.inputTokens || 0) + (b.inputTokens || 0)
      : null;
  const outputTokens =
    typeof a.outputTokens === "number" || typeof b.outputTokens === "number"
      ? (a.outputTokens || 0) + (b.outputTokens || 0)
      : null;
  return { provider: a.provider, model: a.model, inputTokens, outputTokens };
}

async function resolveFocusDate(tripId: string, date: string): Promise<string> {
  if (date) return date;

  const supabase = createServerSupabase();
  const { data: trip } = await supabase.from("trips").select("start_date").eq("id", tripId).maybeSingle();
  const start = typeof trip?.start_date === "string" ? trip.start_date : "";
  if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) return start;

  const { data: act } = await supabase
    .from("trip_activities")
    .select("activity_date")
    .eq("trip_id", tripId)
    .order("activity_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const first = typeof act?.activity_date === "string" ? act.activity_date : "";
  return first && /^\d{4}-\d{2}-\d{2}$/.test(first) ? first : "";
}

async function generateSuggestion(params: {
  tripId: string;
  focusDate: string;
  exclude: string[];
  retry: boolean;
}): Promise<{ suggestion: string | null; usage: TripAiUsage }> {
  const [tripSummary, dayContext] = await Promise.all([
    buildTripSummaryForAi(params.tripId),
    buildPlanDayContextForSuggestion(params.tripId, params.focusDate),
  ]);

  const prompt = params.retry
    ? buildPlanSuggestionRetryPrompt({ tripSummary, dayContext })
    : buildPlanSuggestionPrompt({ tripSummary, dayContext, exclude: params.exclude });

  const { text, usage } = await askTripAIWithUsage(prompt, "general", {
    maxOutputTokens: PLAN_SUGGESTION_MAX_OUTPUT_TOKENS,
  });

  return { suggestion: cleanPlanSuggestion(text || ""), usage };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tripId = typeof body?.tripId === "string" ? body.tripId.trim() : "";
    const date = typeof body?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date.trim()) ? body.date.trim() : "";
    const forceRefresh = body?.forceRefresh === true;
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

    const focusDate = await resolveFocusDate(tripId, date);
    const cacheKey = planSuggestionCacheKey(tripId, focusDate || date, exclude);

    if (!forceRefresh) {
      const cached = getCachedPlanSuggestion(cacheKey);
      if (cached != null && cached !== "") {
        return NextResponse.json({
          suggestion: cached,
          date: focusDate || date || null,
          cached: true,
          nextRemaining: peekPlanSuggestionNextRemaining(userId, tripId),
          nextLimit: PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR,
        });
      }
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

    if (!focusDate) {
      return NextResponse.json({
        suggestion: null,
        date: null,
        reason: "no_date",
        nextRemaining: peekPlanSuggestionNextRemaining(userId, tripId),
        nextLimit: PLAN_SUGGESTION_NEXT_LIMIT_PER_HOUR,
      });
    }

    let usageTotal: TripAiUsage | null = null;
    let suggestion: string | null = null;

    const first = await generateSuggestion({ tripId, focusDate, exclude, retry: false });
    suggestion = first.suggestion;
    usageTotal = first.usage;

    if (!suggestion && exclude.length === 0) {
      const second = await generateSuggestion({ tripId, focusDate, exclude, retry: true });
      suggestion = second.suggestion;
      usageTotal = mergeUsage(first.usage, second.usage);
    }

    if (usageTotal) {
      await trackAiUsage({
        supabase: gate.supabase,
        userId,
        provider: (process.env.AI_PROVIDER || "gemini").toLowerCase(),
        monthKey,
        usage: usageTotal,
      });
    }

    if (suggestion) {
      setCachedPlanSuggestion(cacheKey, suggestion);
    }

    return NextResponse.json({
      suggestion,
      date: focusDate,
      reason: suggestion ? "found" : "none",
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
