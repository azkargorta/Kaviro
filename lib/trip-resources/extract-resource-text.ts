import { extractTextFromPdfWithUnpdf } from "@/lib/server/pdf-engine";
import { extractTextFromImageBuffer } from "@/lib/server/document-ocr";
import { extractTextWithOcrSpace, isOcrSpaceConfigured } from "@/lib/server/ocr-space";

const MIN_USABLE_TEXT = 80;
const MAX_STORED_TEXT = 120_000;

export function getStoredExtractedText(detectedData: Record<string, unknown> | null | undefined): string {
  if (!detectedData || typeof detectedData !== "object") return "";
  const keys = ["extractedText", "extracted_text", "rawText", "raw_text"] as const;
  for (const key of keys) {
    const v = detectedData[key];
    if (typeof v === "string" && v.trim().length >= MIN_USABLE_TEXT) return v.trim().slice(0, MAX_STORED_TEXT);
  }
  return "";
}

export function insufficientExtractedTextMessage(charCount: number): string {
  const base =
    "No se extrajo suficiente texto del documento. Si es un PDF escaneado, prueba una imagen más nítida o pega el itinerario en el chat.";
  if (charCount > 0) {
    return `${base} (solo ${charCount} caracteres legibles).`;
  }
  if (!isOcrSpaceConfigured()) {
    return `${base} Para PDFs escaneados en servidor, configura OCR_SPACE_API_KEY.`;
  }
  return base;
}

async function extractTextFromPdfBuffer(
  buffer: Buffer,
  options?: { fileName?: string | null; mimeType?: string | null }
): Promise<string> {
  const parsedText = (await extractTextFromPdfWithUnpdf(buffer)).trim();
  if (parsedText.length >= MIN_USABLE_TEXT) return parsedText;

  if (isOcrSpaceConfigured()) {
    const ocrText = (
      await extractTextWithOcrSpace({
        buffer,
        fileName: options?.fileName,
        mimeType: options?.mimeType || "application/pdf",
      })
    ).trim();
    if (ocrText.length > parsedText.length) return ocrText;
  }

  return parsedText;
}

/** Extrae texto de un PDF o imagen en memoria (misma lógica que `/api/document/analyze`). */
export async function extractTextFromFileBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const mime = mimeType || "";
  const name = fileName || "";

  if (mime.includes("pdf") || name.toLowerCase().endsWith(".pdf")) {
    return extractTextFromPdfBuffer(buffer, { fileName: name, mimeType: mime || "application/pdf" });
  }
  if (mime.startsWith("image/")) {
    return extractTextFromImageBuffer(buffer, { fileName: name, mimeType: mime });
  }
  return "";
}

export function mergeExtractedTextIntoDetectedData(
  detectedData: Record<string, unknown> | null | undefined,
  extractedText: string
): Record<string, unknown> {
  const base = detectedData && typeof detectedData === "object" ? { ...detectedData } : {};
  return {
    ...base,
    extractedText: extractedText.slice(0, MAX_STORED_TEXT),
    extractedAt: new Date().toISOString(),
  };
}
