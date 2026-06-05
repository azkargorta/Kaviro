import { createClient } from "@/lib/supabase/server";
import { estimateGemini25FlashCostEur, getMonthlyAiBudgetEur, monthKeyUtc } from "@/lib/ai-usage";
import { isKaviroTripsUnlimitedTrip } from "@/lib/kaviro-trips-entitlements";
import type { TripAiUsage } from "@/lib/trip-ai/providers";

export type BudgetInfo = {
  monthKey: string;
  monthlyBudgetEur: number;
  currentEstimatedEur: number;
};

export class AiBudgetExceededError extends Error {
  readonly code = "AI_BUDGET_EXCEEDED" as const;
  readonly httpStatus = 402;
  readonly budget: BudgetInfo;

  constructor(message: string, budget: BudgetInfo) {
    super(message);
    this.name = "AiBudgetExceededError";
    this.budget = budget;
  }
}

export function resolveAiBudgetGateError(error: unknown): {
  status: number;
  body: { error: string; code: string | null; budget: BudgetInfo | null };
} {
  if (error instanceof AiBudgetExceededError) {
    return { status: 402, body: { error: error.message, code: error.code, budget: error.budget } };
  }
  const httpStatus =
    error &&
    typeof error === "object" &&
    "httpStatus" in error &&
    typeof (error as { httpStatus: unknown }).httpStatus === "number"
      ? (error as { httpStatus: number }).httpStatus
      : 401;
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code || "") || null
      : null;
  const budget =
    error && typeof error === "object" && "budget" in error
      ? ((error as { budget: unknown }).budget as BudgetInfo | null)
      : null;
  return {
    status: httpStatus,
    body: { error: error instanceof Error ? error.message : "No autenticado.", code, budget },
  };
}

export async function enforceAiMonthlyBudgetOrThrow(params: {
  providerId: string | null;
  /** Viajes de agencia: sin tope mensual B2C (contrato Kaviro Trips). */
  tripId?: string | null;
}): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; userId: string; budget: BudgetInfo; shouldTrack: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw new Error(userError.message);
  if (!user) throw new Error("No hay sesión activa.");

  const monthKey = monthKeyUtc();
  const monthlyBudgetEur = getMonthlyAiBudgetEur();

  if (params.tripId && (await isKaviroTripsUnlimitedTrip(supabase, params.tripId))) {
    return {
      supabase,
      userId: user.id,
      budget: { monthKey, monthlyBudgetEur, currentEstimatedEur: 0 },
      shouldTrack: true,
    };
  }

  const requestedProvider = (params.providerId || process.env.AI_PROVIDER || "gemini").toLowerCase();
  const usesGemini = requestedProvider === "gemini";

  let currentEstimatedEur = 0;
  if (usesGemini) {
    const { data: usageRow, error: usageErr } = await supabase
      .from("user_ai_usage_monthly")
      .select("estimated_cost_eur")
      .eq("user_id", user.id)
      .eq("month_key", monthKey)
      .eq("provider", "gemini")
      .maybeSingle();
    if (usageErr) throw usageErr;
    currentEstimatedEur = usageRow?.estimated_cost_eur != null ? Number(usageRow.estimated_cost_eur) : 0;
    if (Number.isFinite(currentEstimatedEur) && currentEstimatedEur >= monthlyBudgetEur) {
      throw new AiBudgetExceededError(
        `Has alcanzado tu límite mensual del asistente personal (${monthlyBudgetEur.toFixed(2)}€). ` +
          `Para seguir usando el asistente personal este mes, sube el límite o espera al próximo mes.`,
        { monthKey, monthlyBudgetEur, currentEstimatedEur }
      );
    }
  }

  return {
    supabase,
    userId: user.id,
    budget: { monthKey, monthlyBudgetEur, currentEstimatedEur },
    shouldTrack: usesGemini,
  };
}

export async function trackAiUsage(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  provider: "gemini" | "ollama" | string;
  monthKey?: string;
  usage: TripAiUsage;
}): Promise<void> {
  if (params.provider !== "gemini") return;
  if (params.usage.provider !== "gemini") return;
  if (typeof params.usage.inputTokens !== "number" || typeof params.usage.outputTokens !== "number") return;

  const monthKey = params.monthKey || monthKeyUtc();
  const deltaEur = estimateGemini25FlashCostEur({
    inputTokens: params.usage.inputTokens,
    outputTokens: params.usage.outputTokens,
  });

  const { data: prevRow, error: prevErr } = await params.supabase
    .from("user_ai_usage_monthly")
    .select("requests_count, input_tokens, output_tokens, estimated_cost_eur")
    .eq("user_id", params.userId)
    .eq("month_key", monthKey)
    .eq("provider", "gemini")
    .maybeSingle();
  if (prevErr) throw prevErr;

  const nextRequests = (prevRow?.requests_count ?? 0) + 1;
  const nextInput = Number(prevRow?.input_tokens ?? 0) + params.usage.inputTokens;
  const nextOutput = Number(prevRow?.output_tokens ?? 0) + params.usage.outputTokens;
  const nextCost = Number(prevRow?.estimated_cost_eur ?? 0) + deltaEur;

  const { error: upsertErr } = await params.supabase.from("user_ai_usage_monthly").upsert(
    {
      user_id: params.userId,
      month_key: monthKey,
      provider: "gemini",
      model: params.usage.model,
      requests_count: nextRequests,
      input_tokens: nextInput,
      output_tokens: nextOutput,
      estimated_cost_eur: nextCost,
      last_request_at: new Date().toISOString(),
    },
    { onConflict: "user_id,month_key,provider" }
  );
  if (upsertErr) throw upsertErr;
}

