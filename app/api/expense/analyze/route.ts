import { NextResponse } from "next/server";
import { buildExpenseAnalyzerResult } from "@/lib/expense-analyzer";
import { askTripAIWithUsage } from "@/lib/trip-ai/providers";
import { extractFirstJsonObject } from "@/lib/ai/llmJson";
import { enforceAiMonthlyBudgetOrThrow, trackAiUsage } from "@/lib/ai-budget";
import { monthKeyUtc } from "@/lib/ai-usage";
import { createClient } from "@/lib/supabase/server";
import {
  extractExpenseTextWithVision,
  mergeExtractedTexts,
  shouldTryVisionExtract,
} from "@/lib/trip-ai/documentVisionExtract";
import { EXPENSE_RECEIPT_MAX_BYTES, assertFileWithinLimit } from "@/lib/upload-limits";

export const runtime = "nodejs";
export const maxDuration = 60;

async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const engineModule: any = await import("@/lib/server/pdf-engine");
    const fn = engineModule?.extractTextFromPdfWithUnpdf;
    if (typeof fn !== "function") return "";
    const text = await fn(buffer);
    return typeof text === "string" ? text.trim() : "";
  } catch {
    return "";
  }
}

async function extractTextFromImageBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  try {
    const ocrModule: any = await import("@/lib/server/document-ocr");
    const fn = ocrModule?.extractTextFromImageBuffer;
    if (typeof fn !== "function") return "";
    return await fn(buffer, { fileName, mimeType });
  } catch {
    return "";
  }
}

const EXPENSE_LLM_PROMPT = (fileName: string, text: string) =>
  [
    "Eres un extractor de datos de gastos a partir de tickets/facturas.",
    "Devuelve SOLO un JSON con este esquema:",
    "{ title, category, amount, currency, expenseDate, merchantName, confidence }",
    "category debe ser una de: lodging, transport, food, tickets, shopping, general.",
    "amount = importe TOTAL final pagado (número, sin símbolo de moneda).",
    "currency = código ISO de 3 letras (EUR, USD, …).",
    "expenseDate en formato YYYY-MM-DD si es posible. confidence entre 0 y 1.",
    "Si no sabes un campo, pon null.",
    "",
    `Nombre de archivo: ${fileName}`,
    "TEXTO DEL DOCUMENTO:",
    text.slice(0, 12000),
  ].join("\n");

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .maybeSingle();
    if (!Boolean((profileRow as any)?.is_premium)) {
      return NextResponse.json(
        { error: "Necesitas Premium para analizar tickets con IA.", code: "PREMIUM_REQUIRED" },
        { status: 402 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const monthKey = monthKeyUtc();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
    }

    const sizeError = assertFileWithinLimit(file, EXPENSE_RECEIPT_MAX_BYTES);
    if (sizeError) {
      return NextResponse.json({ error: sizeError }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "";
    const fileName = file.name || "ticket";

    let text = "";
    let extractionMethod: "pdf-parse" | "image-ocr" | "vision" | "vision+ocr" | "empty" = "empty";
    const sharedWarnings: string[] = [];
    let visionUsed = false;

    const isPdf = mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
    const isImage = mimeType.startsWith("image/");

    if (isPdf) {
      text = await extractTextFromPdfBuffer(buffer);
      extractionMethod = text ? "pdf-parse" : "empty";
      if (!text) sharedWarnings.push("No se pudo extraer texto del PDF con el lector local.");
    } else if (isImage) {
      text = await extractTextFromImageBuffer(buffer, fileName, mimeType);
      extractionMethod = text ? "image-ocr" : "empty";
      if (!text) sharedWarnings.push("El OCR clásico no leyó la imagen; se usará visión con Gemini.");
    } else {
      return NextResponse.json(
        { error: "Formato no soportado. Usa PDF o imagen (JPG, PNG, WebP…)." },
        { status: 400 }
      );
    }

    if (shouldTryVisionExtract({ mimeType, ocrTextLength: text.length, fileName })) {
      try {
        const { supabase: budgetSb, userId } = await enforceAiMonthlyBudgetOrThrow({ providerId: "gemini" });
        const vision = await extractExpenseTextWithVision({ buffer, mimeType, fileName });
        if (vision?.text) {
          visionUsed = true;
          text = mergeExtractedTexts(text, vision.text);
          extractionMethod =
            extractionMethod === "empty" || extractionMethod === "image-ocr"
              ? "vision"
              : "vision+ocr";
          await trackAiUsage({
            supabase: budgetSb,
            userId,
            provider: "gemini",
            monthKey,
            usage: vision.usage,
          });
        } else if (!process.env.GEMINI_API_KEY) {
          sharedWarnings.push("Falta GEMINI_API_KEY en el servidor para leer el ticket con visión.");
        } else {
          sharedWarnings.push("Gemini no pudo leer el documento. Prueba otra foto más nítida.");
        }
      } catch (e) {
        sharedWarnings.push(
          e instanceof Error ? e.message : "No se pudo usar visión con Gemini en este ticket."
        );
      }
    }

    const expense = buildExpenseAnalyzerResult({
      text,
      fileName,
      mimeType,
      extractionMethod: extractionMethod === "empty" ? "empty" : extractionMethod,
    });

    let llmExpense: Record<string, unknown> | null = null;
    let llmError: string | null = null;

    if (text.trim().length >= 20) {
      try {
        const { supabase: budgetSb, userId } = await enforceAiMonthlyBudgetOrThrow({ providerId: "gemini" });
        const { text: answer, usage } = await askTripAIWithUsage(
          EXPENSE_LLM_PROMPT(fileName, text),
          "general" as any,
          {
            provider: "gemini",
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
          }
        );
        await trackAiUsage({
          supabase: budgetSb,
          userId,
          provider: "gemini",
          monthKey,
          usage,
        });
        llmExpense = extractFirstJsonObject(answer);
        if (!llmExpense) {
          llmError = "Gemini no devolvió un JSON válido. Revisa el texto extraído o completa los campos a mano.";
        }
      } catch (e) {
        llmError = e instanceof Error ? e.message : "Error al contactar con Gemini.";
      }
    } else {
      llmError =
        "No se pudo extraer texto del ticket. Sube una foto más clara o introduce los datos manualmente.";
    }

    return NextResponse.json({
      ...expense,
      extractedText: text,
      sharedWarnings,
      llmExpense,
      llmError,
      extractedTextLength: text.length,
      visionUsed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error analizando documento",
      },
      { status: 500 }
    );
  }
}
