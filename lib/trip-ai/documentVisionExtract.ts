import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TripAiUsage } from "@/lib/trip-ai/providers";

const VISION_PROMPT = [
  "Transcribe este documento de viaje (dossier de agencia, calendario, PDF escaneado o captura).",
  "Devuelve SOLO texto plano en español o idioma original, conservando:",
  "- Encabezados de día (VIERNES 27, DÍA 1, etc.)",
  "- Todas las horas y actividades en orden",
  "- Vuelos (origen, destino, hora, aerolínea)",
  "- Hoteles (nombre, check-in/out)",
  "- Excursiones, traslados, comidas, notas de entradas",
  "- Códigos de reserva o localizador si aparecen",
  "No añadas comentarios ni markdown. Una actividad por línea cuando sea posible.",
].join("\n");

export async function extractItineraryTextWithVision(params: {
  buffer: Buffer;
  mimeType: string;
  fileName?: string;
  tripSummary?: string;
}): Promise<{ text: string; usage: TripAiUsage } | null> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) return null;

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const mime = params.mimeType.startsWith("image/")
    ? params.mimeType
    : params.mimeType.includes("pdf")
      ? "application/pdf"
      : "image/jpeg";

  const contextLine = params.tripSummary?.trim()
    ? `\nContexto del viaje (orientación): ${params.tripSummary.slice(0, 600)}`
    : "";

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { temperature: 0.15, maxOutputTokens: 8192 },
    });

    const result = await model.generateContent([
      { text: `${VISION_PROMPT}${contextLine}\nArchivo: ${params.fileName || "documento"}` },
      {
        inlineData: {
          data: params.buffer.toString("base64"),
          mimeType: mime,
        },
      },
    ]);

    const text = result.response.text()?.trim() || "";
    if (text.length < 40) return null;

    const meta: Record<string, unknown> =
      (result as { response?: { usageMetadata?: Record<string, unknown> } }).response?.usageMetadata ?? {};
    const usage: TripAiUsage = {
      provider: "gemini",
      model: modelName,
      inputTokens: typeof meta.promptTokenCount === "number" ? meta.promptTokenCount : null,
      outputTokens: typeof meta.candidatesTokenCount === "number" ? meta.candidatesTokenCount : null,
    };

    return { text, usage };
  } catch {
    return null;
  }
}

/** Combina OCR clásico con visión cuando el OCR es escaso o es imagen de calendario. */
export function shouldTryVisionExtract(params: {
  mimeType: string;
  ocrTextLength: number;
  fileName?: string;
}): boolean {
  if (!process.env.GEMINI_API_KEY) return false;
  if (params.mimeType.startsWith("image/")) return params.ocrTextLength < 2500;
  if (params.mimeType.includes("pdf") || params.fileName?.toLowerCase().endsWith(".pdf")) {
    return params.ocrTextLength < 200;
  }
  return false;
}

export function mergeExtractedTexts(ocrText: string, visionText: string): string {
  const ocr = ocrText.trim();
  const vision = visionText.trim();
  if (!vision) return ocr;
  if (!ocr || ocr.length < 80) return vision;
  if (vision.length > ocr.length * 1.15) return vision;
  if (ocr.includes(vision.slice(0, 40))) return ocr;
  return `${ocr}\n\n---\n\n${vision}`;
}
