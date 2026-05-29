/**
 * Extracción híbrida para PDF:
 * 1) pdfjs-dist (principal; fiable en PDFs con diseño complejo)
 * 2) pdf-parse solo en archivos pequeños (pdf-parse puede bloquear el event loop en PDFs grandes)
 * OCR.Space se usa como fallback desde extract-resource-text.ts
 */

const PDF_PARSE_TIMEOUT_MS = 15_000;
const PDFJS_TIMEOUT_MS = 90_000;
/** Por encima de este tamaño no usamos pdf-parse (riesgo de bloqueo prolongado). */
const PDF_PARSE_MAX_BYTES = 800_000;

function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(onTimeout), ms);
    }),
  ]);
}

async function tryPdfParse(buffer: Buffer): Promise<string> {
  try {
    const mod: any = await import("pdf-parse");
    const pdfParse = mod?.default || mod;
    if (typeof pdfParse !== "function") return "";
    const result = await pdfParse(buffer);
    return typeof result?.text === "string" ? result.text.trim() : "";
  } catch {
    return "";
  }
}

async function tryPdfJs(buffer: Buffer): Promise<string> {
  try {
    const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableFontFace: true,
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;

    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = (content?.items || [])
        .map((item: any) => (typeof item?.str === "string" ? item.str : ""))
        .join(" ");
      pages.push(pageText);
    }

    return pages.join("\n").trim();
  } catch {
    return "";
  }
}

function pickBestText(...candidates: string[]): string {
  const trimmed = candidates.map((t) => t.trim()).filter(Boolean);
  if (trimmed.length === 0) return "";
  return trimmed.sort((a, b) => b.length - a.length)[0] ?? "";
}

export async function extractTextFromPdfWithUnpdf(buffer: Buffer): Promise<string> {
  const fromJs = await withTimeout(tryPdfJs(buffer), PDFJS_TIMEOUT_MS, "");
  if (fromJs.trim().length >= 80) return fromJs.trim();

  if (buffer.length <= PDF_PARSE_MAX_BYTES) {
    const fromParse = await withTimeout(tryPdfParse(buffer), PDF_PARSE_TIMEOUT_MS, "");
    return pickBestText(fromJs, fromParse);
  }

  return fromJs.trim();
}
