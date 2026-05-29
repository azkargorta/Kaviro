import { NextResponse } from "next/server";
import { isPremiumEnabledForTrip } from "@/lib/entitlements";
import { requireTripAccessApi } from "@/lib/trip-access-api";
import {
  extractTextFromFileBuffer,
  getStoredExtractedText,
  mergeExtractedTextIntoDetectedData,
} from "@/lib/trip-resources/extract-resource-text";

export const runtime = "nodejs";
export const maxDuration = 120;

type ResourceRow = {
  id: string;
  trip_id: string;
  title: string | null;
  file_path: string | null;
  file_url: string | null;
  mime_type: string | null;
  detected_data: Record<string, unknown> | null;
};

export async function GET(
  request: Request,
  { params }: { params: { resourceId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId")?.trim() || "";
    const resourceId = params.resourceId?.trim();

    if (!tripId || !resourceId) {
      return NextResponse.json({ error: "Faltan tripId o resourceId." }, { status: 400 });
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
        { error: "Premium requerido para importar itinerarios desde documentos.", code: "PREMIUM_REQUIRED" },
        { status: 402 }
      );
    }

    const { data: row, error: rowError } = await gate.supabase
      .from("trip_resources")
      .select("id, trip_id, title, file_path, file_url, mime_type, detected_data")
      .eq("id", resourceId)
      .eq("trip_id", tripId)
      .maybeSingle();

    if (rowError) throw new Error(rowError.message);
    if (!row) return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });

    const resource = row as ResourceRow;
    const title = resource.title?.trim() || "Documento";

    const cached = getStoredExtractedText(resource.detected_data);
    if (cached.length >= 80) {
      return NextResponse.json({
        ok: true,
        extractedText: cached,
        title,
        cached: true,
        charCount: cached.length,
      });
    }

    if (!resource.file_path && !resource.file_url) {
      return NextResponse.json(
        {
          error:
            "Este recurso no tiene archivo adjunto. Sube un PDF o imagen en Recursos del viaje, o adjunta uno nuevo aquí.",
        },
        { status: 422 }
      );
    }

    let buffer: Buffer | null = null;
    if (resource.file_path) {
      const { data: fileBlob, error: downloadError } = await gate.supabase.storage
        .from("trip-documents")
        .download(resource.file_path);
      if (!downloadError && fileBlob) {
        buffer = Buffer.from(await fileBlob.arrayBuffer());
      }
    }
    if (!buffer && resource.file_url) {
      try {
        const fileRes = await fetch(resource.file_url, { cache: "no-store" });
        if (fileRes.ok) buffer = Buffer.from(await fileRes.arrayBuffer());
      } catch {
        /* intentar solo storage */
      }
    }
    if (!buffer) {
      throw new Error("No se pudo descargar el archivo del viaje. Vuelve a subirlo en Recursos.");
    }

    const mimeType = resource.mime_type || "";
    const fileName =
      resource.file_path?.split("/").pop() || resource.file_url?.split("/").pop()?.split("?")[0] || title;

    const extractedText = (await extractTextFromFileBuffer(buffer, mimeType, fileName)).trim();

    if (extractedText.length < 80) {
      return NextResponse.json(
        {
          error:
            "No se extrajo suficiente texto del documento (PDF escaneado o imagen poco legible). Prueba otro archivo o pega el itinerario en el chat.",
          charCount: extractedText.length,
        },
        { status: 422 }
      );
    }

    const mergedDetected = mergeExtractedTextIntoDetectedData(resource.detected_data, extractedText);
    await gate.supabase
      .from("trip_resources")
      .update({ detected_data: mergedDetected })
      .eq("id", resourceId)
      .eq("trip_id", tripId);

    return NextResponse.json({
      ok: true,
      extractedText,
      title,
      cached: false,
      charCount: extractedText.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo extraer el texto del documento." },
      { status: 500 }
    );
  }
}
