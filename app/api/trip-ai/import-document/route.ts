import { NextResponse } from "next/server";
import { isPremiumEnabledForTrip } from "@/lib/entitlements";
import { requireTripAccessApi } from "@/lib/trip-access-api";
import { analyzeDocumentText } from "@/lib/document-analyzer";
import { buildTripSummaryForAi } from "@/lib/trip-ai/buildTripSummary";
import {
  extractItineraryTextWithVision,
  mergeExtractedTexts,
  shouldTryVisionExtract,
} from "@/lib/trip-ai/documentVisionExtract";
import { enhanceDocumentForItineraryImport } from "@/lib/trip-ai/enhanceDocumentForImport";
import { prepareDocumentTextForItineraryImport } from "@/lib/trip-ai/agencyCalendarParse";
import { enforceAiMonthlyBudgetOrThrow, trackAiUsage } from "@/lib/ai-budget";
import { monthKeyUtc } from "@/lib/ai-usage";
import {
  extractTextFromFileBuffer,
  insufficientExtractedTextMessage,
  mergeExtractedTextIntoDetectedData,
} from "@/lib/trip-resources/extract-resource-text";

export const runtime = "nodejs";
export const maxDuration = 180;

function fileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? (parts.pop() || "bin") : "bin";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const tripId = typeof formData.get("tripId") === "string" ? String(formData.get("tripId")).trim() : "";
    const file = formData.get("file");
    const saveToResources = String(formData.get("saveToResources") ?? "1").trim() !== "0";

    if (!tripId) return NextResponse.json({ error: "Falta tripId." }, { status: 400 });
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta el archivo (PDF o imagen)." }, { status: 400 });
    }

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;

    const isPremium = await isPremiumEnabledForTrip({
      supabase: gate.supabase,
      userId: gate.access.userId,
      tripId,
    });
    if (!isPremium) {
      return NextResponse.json(
        { error: "Premium requerido en este viaje para importar documentos.", code: "PREMIUM_REQUIRED" },
        { status: 402 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "";
    const fileName = file.name || "documento.pdf";

    if (
      !mimeType.includes("pdf") &&
      !fileName.toLowerCase().endsWith(".pdf") &&
      !mimeType.startsWith("image/")
    ) {
      return NextResponse.json(
        { error: "Formato no soportado. Usa PDF o imagen (JPG, PNG…)." },
        { status: 400 }
      );
    }

    const clientExtracted =
      typeof formData.get("extractedText") === "string" ? String(formData.get("extractedText")).trim() : "";

    let ocrText =
      clientExtracted.length >= 80 ? clientExtracted : (await extractTextFromFileBuffer(buffer, mimeType, fileName)).trim();

    let extractionMethod: "client-pdf" | "ocr" | "vision" | "vision+ocr" = clientExtracted.length >= 80 ? "client-pdf" : "ocr";
    let visionUsed = false;

    const tripSummary = await buildTripSummaryForAi(tripId);

    if (shouldTryVisionExtract({ mimeType, ocrTextLength: ocrText.length, fileName })) {
      try {
        const { supabase, userId } = await enforceAiMonthlyBudgetOrThrow({ providerId: null });
        const vision = await extractItineraryTextWithVision({
          buffer,
          mimeType: mimeType || "image/jpeg",
          fileName,
          tripSummary,
        });
        if (vision?.text) {
          visionUsed = true;
          ocrText = mergeExtractedTexts(ocrText, vision.text);
          extractionMethod = ocrText.length >= 80 && clientExtracted.length < 80 ? "vision+ocr" : "vision";
          if (vision.usage) {
            await trackAiUsage({
              supabase,
              userId,
              provider: "gemini",
              monthKey: monthKeyUtc(),
              usage: vision.usage,
            });
          }
        }
      } catch {
        /* sigue con OCR */
      }
    }

    if (ocrText.length < 80) {
      return NextResponse.json(
        {
          error: insufficientExtractedTextMessage(ocrText.length),
          charCount: ocrText.length,
          visionAttempted: visionUsed,
        },
        { status: 422 }
      );
    }

    const detected = analyzeDocumentText(ocrText, fileName);

    let importHint = "";
    let documentInsights = null;
    try {
      const { supabase, userId } = await enforceAiMonthlyBudgetOrThrow({ providerId: null });
      const enhanced = await enhanceDocumentForItineraryImport({
        extractedText: ocrText,
        fileName,
        tripSummary,
        detected,
      });
      importHint = enhanced.hint;
      documentInsights = enhanced.insights;
      if (enhanced.usage) {
        await trackAiUsage({
          supabase,
          userId,
          provider: "gemini",
          monthKey: monthKeyUtc(),
          usage: enhanced.usage,
        });
      }
    } catch {
      importHint = "";
    }

    const titleBase = fileName.replace(/\.[^.]+$/, "").trim() || "Itinerario importado";
    let resourceId: string | null = null;

    if (saveToResources && gate.access.can_manage_resources) {
      const storagePath = `${tripId}/${crypto.randomUUID()}.${fileExtension(fileName)}`;
      const { error: uploadError } = await gate.supabase.storage
        .from("trip-documents")
        .upload(storagePath, buffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: mimeType || undefined,
        });

      if (!uploadError) {
        const { data: signed } = await gate.supabase.storage
          .from("trip-documents")
          .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
        const detected_data = mergeExtractedTextIntoDetectedData(
          {
            ...(detected as Record<string, unknown>),
            documentType: detected.documentType || "travel_itinerary",
            importHint,
            documentInsights,
            extractionMethod,
          },
          ocrText
        );

        const { data: resourceRow, error: insertError } = await gate.supabase
          .from("trip_resources")
          .insert({
            trip_id: tripId,
            title: titleBase.slice(0, 120),
            resource_type: "document",
            category: "itinerary",
            notes: "Importado desde el asistente de planificación",
            file_path: storagePath,
            file_url: signed?.signedUrl ?? null,
            mime_type: mimeType || null,
            detected_document_type: "travel_itinerary",
            detected_data,
            created_by_user_id: gate.access.userId,
            visibility: "trip",
            visible_to_user_ids: [],
          })
          .select("id")
          .maybeSingle();

        if (!insertError && resourceRow?.id) {
          resourceId = String(resourceRow.id);
        }
      }
    }

    // Detectar tipo de documento para añadir hints específicos al prompt
    const isSportsDossier = /NFL|NBA|MLB|NHL|SuperBowl|partido.*deportiv|estadio|Bears|Packers|Bulls|Lambeau|Soldier Field|United Center|match.*ticket|game.*day/i.test(ocrText);
    const isTableFormat = /\|.*\|.*\||[\t]{2,}|hora.*actividad|time.*activity|schedule.*table/i.test(ocrText);
    const isEnglishDoc = (ocrText.match(/\b(the|and|for|with|from|hotel|flight|day|morning|afternoon|evening)\b/gi) || []).length > 10;

    const sportsHint = isSportsDossier
      ? "\n\nDOSSIER DEPORTIVO: activity_kind \"sport\" para partidos, \"excursion\" para desplazamientos a otros estadios, \"tour\" para tours. start_time obligatorio (00:00 si no aparece)."
      : "";
    const tableHint = isTableFormat
      ? "\n\nFORMATO TABLA: cada fila de la tabla es un item. Lee columna hora y columna actividad/descripción por separado."
      : "";
    const englishHint = isEnglishDoc
      ? "\n\nDOCUMENTO EN INGLÉS: extrae títulos en inglés tal como aparecen en el texto."
      : "";

    return NextResponse.json({
      ok: true,
      extractedText: prepareDocumentTextForItineraryImport(ocrText),
      sportsHint,
      fileName,
      charCount: ocrText.length,
      resourceId,
      title: titleBase,
      savedToResources: Boolean(resourceId),
      extractionMethod,
      visionUsed,
      importHint: importHint + (sportsHint || "") + (tableHint || "") + (englishHint || ""),
      documentInsights,
      isSportsDossier: isSportsDossier ?? false,
      isTableFormat: isTableFormat ?? false,
      isEnglishDoc: isEnglishDoc ?? false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo leer el documento." },
      { status: 500 }
    );
  }
}
