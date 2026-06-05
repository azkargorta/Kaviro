import { NextResponse } from "next/server";
import { forbidUnlessCanManageResources, requireTripAccessApi } from "@/lib/trip-access-api";

export const runtime = "nodejs";
export const maxDuration = 120;

import { assertFileWithinLimit, TRIP_DOCUMENT_MAX_BYTES } from "@/lib/upload-limits";

function fileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? (parts.pop() || "bin") : "bin";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const tripId = typeof formData.get("tripId") === "string" ? String(formData.get("tripId")).trim() : "";
    const file = formData.get("file");

    if (!tripId) return NextResponse.json({ error: "Falta tripId." }, { status: 400 });
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
    }

    const sizeError = assertFileWithinLimit(file, TRIP_DOCUMENT_MAX_BYTES);
    if (sizeError) {
      return NextResponse.json({ error: sizeError }, { status: 400 });
    }

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;
    const forbidden = forbidUnlessCanManageResources(gate.access, "No tienes permisos para subir documentos.");
    if (forbidden) return forbidden;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "application/octet-stream";
    const fileName = file.name || "documento.bin";
    const storagePath = `${tripId}/${crypto.randomUUID()}.${fileExtension(fileName)}`;

    const { error: uploadError } = await gate.supabase.storage.from("trip-documents").upload(storagePath, buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: mimeType,
    });

    if (uploadError) {
      const hint =
        uploadError.message?.includes("row-level security") || uploadError.message?.includes("policy")
          ? " Configura el bucket trip-documents en Supabase (docs/tripboard_documents_storage.sql)."
          : "";
      return NextResponse.json(
        { error: `No se pudo guardar el archivo.${hint}`, detail: uploadError.message },
        { status: 500 }
      );
    }

    const { data: signed, error: signError } = await gate.supabase.storage
      .from("trip-documents")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    if (signError) {
      return NextResponse.json(
        { error: signError.message || "No se pudo generar el enlace del archivo." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      path: storagePath,
      publicUrl: signed?.signedUrl ?? null,
      mimeType,
      fileName,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo subir el documento." },
      { status: 500 }
    );
  }
}
