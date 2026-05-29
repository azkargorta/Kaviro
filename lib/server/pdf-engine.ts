/**
 * Extracción de texto en PDF (servidor):
 * 1) unpdf — rápido y fiable en Node/Next
 * 2) pdfjs-dist — respaldo
 * 3) pdf-parse — solo en archivos pequeños (puede bloquear en PDFs grandes)
 */

const PDF_PARSE_TIMEOUT_MS = 15_000;
const PDFJS_TIMEOUT_MS = 60_000;
const PDF_PARSE_MAX_BYTES = 800_000;
const MIN_GOOD_CHARS = 80;

function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(onTimeout), ms);
    }),
  ]);
}

function pickBestText(...candidates: string[]): string {
  const trimmed = candidates.map((t) => t.trim()).filter(Boolean);
  if (trimmed.length === 0) return "";
  return trimmed.sort((a, b) => b.length - a.length)[0] ?? "";
}

async function tryUnpdf(buffer: Buffer): Promise<string> {
  try {
    const { extractText } = await import("unpdf");
    const result = await extractText(new Uint8Array(buffer), { mergePages: true });
    return typeof result.text === "string" ? result.text.trim() : "";
  } catch {
    return "";
  }
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

export async function extractTextFromPdfWithUnpdf(buffer: Buffer): Promise<string> {
  const fromUnpdf = await tryUnpdf(buffer);
  if (fromUnpdf.length >= MIN_GOOD_CHARS) return fromUnpdf;

  const fromJs = await withTimeout(tryPdfJs(buffer), PDFJS_TIMEOUT_MS, "");
  if (fromJs.length >= MIN_GOOD_CHARS) return fromJs;

  if (buffer.length <= PDF_PARSE_MAX_BYTES) {
    const fromParse = await withTimeout(tryPdfParse(buffer), PDF_PARSE_TIMEOUT_MS, "");
    return pickBestText(fromUnpdf, fromJs, fromParse);
  }

  return pickBestText(fromUnpdf, fromJs);
}
