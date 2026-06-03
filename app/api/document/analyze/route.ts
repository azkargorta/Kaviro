import { NextResponse } from "next/server";
import { extractTextFromFileBuffer } from "@/lib/trip-resources/extract-resource-text";
import { isOcrSpaceConfigured } from "@/lib/server/ocr-space";
import { analyzeDocumentText } from "@/lib/document-analyzer";
import { askTripAIWithUsage } from "@/lib/trip-ai/providers";
import { extractFirstJsonObject } from "@/lib/ai/llmJson";
import { enforceAiMonthlyBudgetOrThrow, trackAiUsage } from "@/lib/ai-budget";
import { monthKeyUtc } from "@/lib/ai-usage";
import { createClient } from "@/lib/supabase/server";
import { isPremiumEnabledForTrip } from "@/lib/entitlements";
import { requireTripAccessApi } from "@/lib/trip-access-api";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const tripId = typeof formData.get("tripId") === "string" ? String(formData.get("tripId")).trim() : "";
    const provider = typeof formData.get("provider") === "string" ? String(formData.get("provider")) : null;
    const enhance = String(formData.get("enhance") || "").trim() === "1" || process.env.AI_ENHANCE_ANALYSIS === "1";
    const monthKey = monthKeyUtc();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    }

    // Premium: por viaje (asistente) o cuenta global (Recursos).
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

    let premiumOk = false;
    if (tripId) {
      const gate = await requireTripAccessApi(tripId);
      if (!gate.ok) return gate.response;
      premiumOk = await isPremiumEnabledForTrip({
        supabase: gate.supabase,
        userId: gate.access.userId,
        tripId,
      });
    } else {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .maybeSingle();
      premiumOk = Boolean((profileRow as { is_premium?: boolean } | null)?.is_premium);
    }
    if (!premiumOk) {
      return NextResponse.json(
        {
          error: tripId
            ? "Premium requerido en este viaje para analizar documentos."
            : "Necesitas Premium para analizar documentos con el asistente personal.",
          code: "PREMIUM_REQUIRED",
        },
        { status: 402 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "";
    const fileName = file.name || "";

    const extractedText = await extractTextFromFileBuffer(buffer, mimeType, fileName);

    const detected = analyzeDocumentText(extractedText, fileName);

    let llmDetected: any = null;
    let llmError: string | null = null;
    let llmErrorCode: string | null = null;
    let llmBudget: any = null;
    if (enhance && extractedText.trim()) {
      const prompt = [
        "Eres un extractor de datos de reservas/tickets/documentos de viaje.",
        "Devuelve SOLO un JSON (sin texto extra) con claves que puedan encajar en este esquema:",
        "{ documentType, providerName, reservationName, reservationCode, totalAmount, currency, checkInDate, checkOutDate, checkInTime, checkOutTime, address, city, country, guests, paymentStatus, confidence }",
        "Si no sabes un campo, pon null. confidence entre 0 y 1.",
        "",
        `Nombre de archivo: ${fileName}`,
        "TEXTO EXTRAÍDO:",
        extractedText.slice(0, 12000),
      ].join("\n");

      try {
        const { supabase, userId } = await enforceAiMonthlyBudgetOrThrow({
          providerId: provider,
          tripId: tripId || null,
        });
        const { text: answer, usage } = await askTripAIWithUsage(prompt, "general" as any, { provider });
        await trackAiUsage({
          supabase,
          userId,
          provider: (provider || process.env.AI_PROVIDER || "gemini").toLowerCase(),
          monthKey,
          usage,
        });
        llmDetected = extractFirstJsonObject(answer);
      } catch (e) {
        const err: any = e;
        llmError = e instanceof Error ? e.message : "Error al contactar con el asistente personal.";
        llmErrorCode = typeof err?.code === "string" ? err.code : null;
        llmBudget = err?.budget ?? null;
      }
    }

    return NextResponse.json({
      ok: true,
      fileName,
      mimeType,
      extractedText,
      extractedTextLength: extractedText.length,
      ocrSpaceEnabled: isOcrSpaceConfigured(),
      detected,
      llmDetected,
      llmError,
      llmErrorCode,
      llmBudget,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo analizar el documento",
      },
      { status: 500 }
    );
  }
}
