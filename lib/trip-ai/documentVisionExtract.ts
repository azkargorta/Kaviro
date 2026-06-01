import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TripAiUsage } from "@/lib/trip-ai/providers";

const VISION_PROMPT = [
  "Transcribe este documento de viaje (dossier, calendario, tabla, captura de pantalla, PDF escaneado o imagen).",
  "El documento puede estar en español, inglés u otro idioma. Transcribe en el idioma original.",
  "Devuelve SOLO texto plano estructurado, sin markdown, sin JSON, sin comentarios.",
  "",
  "FORMATO OBLIGATORIO — sigue estas reglas estrictamente:",
  "1. Cada día en su propia línea de encabezado. Usa el formato que aparezca en el documento:",
  "   - «DÍA 1», «DÍA 2», «Day 1», «Day 2»",
  "   - «VIERNES 27», «SÁBADO 28», «Friday October 11»",
  "   - «LUNES 1 DE OCTUBRE», «Monday, October 1»",
  "2. Debajo de cada encabezado de día, una actividad POR LÍNEA con este formato:",
  "   HH:MM - Nombre de la actividad o lugar",
  "   Si no hay hora: 00:00 - Nombre de la actividad",
  "3. Si el documento es una TABLA con columnas (Hora | Actividad | Lugar):",
  "   - Lee cada fila como una línea: HH:MM - [Actividad] - [Lugar]",
  "   - Incluye el lugar si aparece en la tabla",
  "4. Incluye ABSOLUTAMENTE TODO lo visible:",
  "   - Vuelos (aerolínea, número, origen-destino, hora salida/llegada, terminal)",
  "   - Hoteles (nombre, ciudad, check-in/check-out)",
  "   - Excursiones, tours, partidos deportivos, museos, restaurantes",
  "   - Traslados, transfers, tiempo libre, descansos",
  "   - Códigos de reserva, localizadores, notas importantes",
  "5. NO fusiones días, NO omitas actividades, NO resumas.",
  "6. Si hay texto en inglés: transCRIBE en inglés tal como aparece.",
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
  // Imágenes: SIEMPRE usar visión — OCR clásico no entiende tablas ni layouts visuales
  if (params.mimeType.startsWith("image/")) return true;
  // PDFs: usar visión si el texto extraído es escaso (PDF escaneado o con imágenes)
  if (params.mimeType.includes("pdf") || params.fileName?.toLowerCase().endsWith(".pdf")) {
    return params.ocrTextLength < 800;
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
