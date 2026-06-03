import { NextResponse } from "next/server";
import { buildTripSummaryForAi } from "@/lib/trip-ai/buildTripSummary";
import { importItineraryFromText, importItinerarySingleChunk } from "@/lib/trip-ai/importItineraryFromText";
import { enforceAiMonthlyBudgetOrThrow, trackAiUsage } from "@/lib/ai-budget";
import { monthKeyUtc } from "@/lib/ai-usage";
import { isPremiumEnabledForTrip } from "@/lib/entitlements";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const tripId = typeof body?.tripId === "string" ? body.tripId : "";
    const sourceText = typeof body?.sourceText === "string" ? body.sourceText.trim() : "";
    const assistantHint = typeof body?.assistantHint === "string" ? body.assistantHint.trim() : "";
    const singleChunk = body?.singleChunk === true;
    const chunkLabel = typeof body?.chunkLabel === "string" ? body.chunkLabel.trim() : "Tramo";

    if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });
    const minLen = singleChunk ? 40 : assistantHint.length > 100 ? 50 : 80;
    if (!sourceText || sourceText.length < minLen) {
      return NextResponse.json({ error: "Texto de itinerario demasiado corto." }, { status: 400 });
    }

    const monthKey = monthKeyUtc();
    let supabase: Awaited<ReturnType<typeof enforceAiMonthlyBudgetOrThrow>>["supabase"];
    let userId = "";
    try {
      const res = await enforceAiMonthlyBudgetOrThrow({ providerId: null, tripId });
      supabase = res.supabase;
      userId = res.userId;
    } catch (e) {
      const err = e as { httpStatus?: number; message?: string; code?: string };
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "No autenticado.", code: err?.code || null },
        { status: typeof err?.httpStatus === "number" ? err.httpStatus : 401 }
      );
    }

    const { data: participant } = await supabase
      .from("trip_participants")
      .select("id")
      .eq("trip_id", tripId)
      .eq("user_id", userId)
      .neq("status", "removed")
      .maybeSingle();
    if (!participant) return NextResponse.json({ error: "Sin acceso al viaje." }, { status: 403 });

    const isPremium = await isPremiumEnabledForTrip({ supabase, userId, tripId });
    if (!isPremium) {
      return NextResponse.json({ error: "Premium requerido.", code: "PREMIUM_REQUIRED" }, { status: 402 });
    }

    const tripSummary = await buildTripSummaryForAi(tripId);
    const fullSourceText =
      typeof body?.fullSourceText === "string" ? body.fullSourceText.trim() : "";
    const chunkSectionIndex =
      typeof body?.chunkSectionIndex === "number" && Number.isFinite(body.chunkSectionIndex)
        ? body.chunkSectionIndex
        : undefined;
    const chunkSectionTotal =
      typeof body?.chunkSectionTotal === "number" && Number.isFinite(body.chunkSectionTotal)
        ? body.chunkSectionTotal
        : undefined;

    const result = singleChunk
      ? await importItinerarySingleChunk({
          tripSummary,
          chunkBody: sourceText,
          chunkLabel,
          fullSourceText: fullSourceText || undefined,
          chunkSectionIndex,
          chunkSectionTotal,
        })
      : await importItineraryFromText({ tripSummary, sourceText, assistantHint });

    if (!result) {
      return NextResponse.json(
        {
          error:
            "No se pudo estructurar el itinerario. Vuelve a pulsar «Generar tarjetas»; si sigue fallando, pega solo 2–3 días a la vez.",
        },
        { status: 422 }
      );
    }

    await trackAiUsage({
      supabase,
      userId,
      provider: (process.env.AI_PROVIDER || "gemini").toLowerCase(),
      monthKey,
      usage: result.usage,
    });

    return NextResponse.json({
      ok: true,
      itinerary: result.itinerary,
      answer: "answer" in result ? result.answer : `Tramo «${chunkLabel}» importado.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo importar el itinerario." },
      { status: 500 }
    );
  }
}
