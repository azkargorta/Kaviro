import { NextResponse } from "next/server";
import { isPremiumEnabledForTrip } from "@/lib/entitlements";
import { requireTripAccessApi } from "@/lib/trip-access-api";
import { analyzeDocumentText } from "@/lib/document-analyzer";
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

    const extractedText = (await extractTextFromFileBuffer(buffer, mimeType, fileName)).trim();
    if (extractedText.length < 80) {
      return NextResponse.json(
        {
          error: insufficientExtractedTextMessage(extractedText.length),
          charCount: extractedText.length,
        },
        { status: 422 }
      );
    }

    const detected = analyzeDocumentText(extractedText, fileName);
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
        const { data: urlData } = gate.supabase.storage.from("trip-documents").getPublicUrl(storagePath);
        const detected_data = mergeExtractedTextIntoDetectedData(
          {
            ...(detected as Record<string, unknown>),
            documentType: detected.documentType || "travel_itinerary",
          },
          extractedText
        );

        const { data: resourceRow, error: insertError } = await gate.supabase
          .from("trip_resources")
          .insert({
            trip_id: tripId,
            title: titleBase.slice(0, 120),
            resource_type: "document",
            category: "itinerary",
            notes: "Importado desde el asistente personal",
            file_path: storagePath,
            file_url: urlData.publicUrl ?? null,
            mime_type: mimeType || null,
            detected_document_type: "travel_itinerary",
            detected_data,
            created_by_user_id: gate.access.userId,
          })
          .select("id")
          .maybeSingle();

        if (!insertError && resourceRow?.id) {
          resourceId = String(resourceRow.id);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      extractedText,
      fileName,
      charCount: extractedText.length,
      resourceId,
      title: titleBase,
      savedToResources: Boolean(resourceId),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo leer el documento." },
      { status: 500 }
    );
  }
}
