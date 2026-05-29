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

async function extractTextFromPdfBuffer(
  buffer: Buffer,
  options?: { fileName?: string | null; mimeType?: string | null }
): Promise<string> {
  const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  if (isProd && isOcrSpaceConfigured()) {
    const ocrText = await extractTextWithOcrSpace({
      buffer,
      fileName: options?.fileName,
      mimeType: options?.mimeType || "application/pdf",
    });
    if (ocrText.trim()) return ocrText.trim();
  }

  const parsedText = await extractTextFromPdfWithUnpdf(buffer);
  if (parsedText.trim()) return parsedText.trim();

  if (isOcrSpaceConfigured()) {
    const ocrText = await extractTextWithOcrSpace({
      buffer,
      fileName: options?.fileName,
      mimeType: options?.mimeType || "application/pdf",
    });
    if (ocrText.trim()) return ocrText.trim();
  }

  return "";
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
