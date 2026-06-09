"use client";

import { useState } from "react";
import { extractTextFromPdfClient } from "@/lib/pdfToText";

export type ExpenseDetectedData = {
  title?: string | null;
  category?: string | null;
  amount?: number | null;
  currency?: string | null;
  expenseDate?: string | null;
  merchantName?: string | null;
  confidence?: number | null;
  extractedText?: string | null;
  extractionMethod?: string | null;
  warnings?: string[];
  sharedWarnings?: string[];
  llmError?: string | null;
  file?: File | null;
};

function buildDetectedFromPayload(
  payload: Record<string, unknown> | null,
  tripBaseCurrency: string,
  file: File,
  pdfText?: string
): ExpenseDetectedData {
  const llm =
    payload?.llmExpense && typeof payload.llmExpense === "object"
      ? (payload.llmExpense as Record<string, unknown>)
      : null;
  const detectedCurrency =
    typeof llm?.currency === "string" ? llm.currency.trim().toUpperCase() : null;
  const mergedWarnings = [
    ...(Array.isArray(payload?.warnings) ? (payload.warnings as string[]) : []),
    ...(Array.isArray(payload?.sharedWarnings) ? (payload.sharedWarnings as string[]) : []),
  ];
  if (!llm?.amount && typeof payload?.amount !== "number") {
    mergedWarnings.push("No se detectó el importe. Revisa el ticket o introdúcelo a mano.");
  }
  if (!llm?.expenseDate && !payload?.expenseDate) {
    mergedWarnings.push("No se detectó la fecha. Puedes dejarla vacía o completar manualmente.");
  }
  if (detectedCurrency && detectedCurrency !== String(tripBaseCurrency || "EUR").toUpperCase()) {
    mergedWarnings.push(
      `Moneda detectada: ${detectedCurrency}. Por defecto se usará la moneda base del viaje.`
    );
  }
  if (typeof llm?.confidence === "number" && llm.confidence < 0.6) {
    mergedWarnings.push("La confianza del análisis es baja. Revisa título e importe antes de aplicar.");
  }

  return {
    title:
      (typeof llm?.title === "string" ? llm.title : null) ??
      (typeof payload?.title === "string" ? payload.title : null) ??
      (typeof payload?.suggestedTitle === "string" ? payload.suggestedTitle : null) ??
      null,
    category:
      (typeof llm?.category === "string" ? llm.category : null) ??
      (typeof payload?.category === "string" ? payload.category : "general") ??
      "general",
    amount:
      typeof llm?.amount === "number"
        ? llm.amount
        : typeof payload?.amount === "number"
          ? payload.amount
          : null,
    currency: detectedCurrency || tripBaseCurrency,
    expenseDate:
      (typeof llm?.expenseDate === "string" ? llm.expenseDate : null) ??
      (typeof payload?.expenseDate === "string" ? payload.expenseDate : null) ??
      null,
    merchantName:
      (typeof llm?.merchantName === "string" ? llm.merchantName : null) ??
      (typeof payload?.merchantName === "string" ? payload.merchantName : null) ??
      null,
    confidence: typeof llm?.confidence === "number" ? llm.confidence : null,
    extractedText:
      (typeof payload?.extractedText === "string" ? payload.extractedText : null) || pdfText || null,
    extractionMethod:
      (typeof payload?.extractionMethod === "string" ? payload.extractionMethod : null) ?? null,
    warnings: mergedWarnings,
    sharedWarnings: [],
    llmError: typeof payload?.llmError === "string" ? payload.llmError : null,
    file,
  };
}

export default function ExpenseAnalyzerPanel({
  tripBaseCurrency = "EUR",
  onUseDetectedData,
  embedded = false,
}: {
  tripBaseCurrency?: string;
  onUseDetectedData: (data: ExpenseDetectedData) => void;
  /** Versión compacta para incrustar en el formulario móvil. */
  embedded?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExpenseDetectedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appliedHint, setAppliedHint] = useState<string | null>(null);

  function validateSelectedFile(f: File) {
    const maxBytes = 12 * 1024 * 1024;
    if (f.size > maxBytes) {
      return "El archivo es demasiado grande (máx. 12MB).";
    }
    return null;
  }

  async function analyze() {
    if (!file) return;
    const pre = validateSelectedFile(file);
    if (pre) {
      setError(pre);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      let pdfText = "";

      if (isPdf) {
        pdfText = await extractTextFromPdfClient(file).catch(() => "");
        if (pdfText.trim().length >= 50) {
          const response = await fetch("/api/expense/analyze-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: pdfText,
              fileName: file.name,
              mimeType: file.type,
              enhance: true,
            }),
          });
          const payload = await response.json().catch(() => null);
          if (!response.ok) throw new Error(payload?.error || "No se pudo analizar el archivo.");
          const detected = buildDetectedFromPayload(payload, tripBaseCurrency, file, pdfText);
          if (embedded) {
            onUseDetectedData(detected);
            setAppliedHint("Datos del ticket aplicados al formulario.");
            setResult(null);
          } else {
            setResult(detected);
          }
          return;
        }
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("enhance", "1");

      const response = await fetch("/api/expense/analyze", { method: "POST", body: formData });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo analizar el archivo.");
      }

      const detected = buildDetectedFromPayload(payload, tripBaseCurrency, file, pdfText || undefined);
      if (embedded) {
        onUseDetectedData(detected);
        setAppliedHint("Datos del ticket aplicados al formulario.");
        setResult(null);
      } else {
        setResult(detected);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo analizar.");
    } finally {
      setLoading(false);
    }
  }

  const combinedWarnings = [...(result?.warnings || []), ...(result?.sharedWarnings || [])];
  const hasAnyData =
    result &&
    (result.amount != null ||
      result.title ||
      result.merchantName ||
      result.expenseDate ||
      (result.extractedText && result.extractedText.length > 30));

  const inner = (
      <div className={embedded ? "space-y-3" : "mt-4 space-y-4"}>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {embedded ? "Foto o PDF del ticket" : "Archivo"}
          </span>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setAppliedHint(null);
              setError(null);
            }}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
          />
        </label>

        {file ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-[#1E293B] dark:bg-[#080C14] dark:text-slate-300">
            Archivo seleccionado: <strong>{file.name}</strong>
            <span className="text-xs text-slate-500"> · {(file.size / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={analyze}
          disabled={!file || loading}
          className={`btn-press w-full rounded-xl px-4 py-3 text-sm font-semibold ${
            !file || loading ? "bg-slate-200 text-slate-500" : "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
          }`}
        >
          {loading ? "Analizando ticket…" : embedded ? "Escanear y rellenar" : "Analizar archivo"}
        </button>

        {appliedHint ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
            {appliedHint}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {!embedded && result ? (
          <div
            className={`rounded-2xl border p-4 ${
              hasAnyData
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                : "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20"
            }`}
          >
            {!hasAnyData ? (
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                No se pudieron extraer datos automáticos de este ticket.
              </p>
            ) : null}

            <div className="space-y-2 text-sm text-slate-800 dark:text-slate-200">
              <p>
                <strong>Título sugerido:</strong> {result.title || "Sin detectar"}
              </p>
              <p>
                <strong>Comercio:</strong> {result.merchantName || "Sin detectar"}
              </p>
              <p>
                <strong>Categoría:</strong> {result.category || "general"}
              </p>
              <p>
                <strong>Importe:</strong>{" "}
                {result.amount != null ? result.amount.toFixed(2) : "Sin detectar"}
              </p>
              <p>
                <strong>Moneda:</strong> {result.currency || "EUR"}
              </p>
              <p>
                <strong>Fecha:</strong> {result.expenseDate || "Sin detectar"}
              </p>
              <p>
                <strong>Método:</strong> {result.extractionMethod || "Sin indicar"}
              </p>
              {typeof result.confidence === "number" ? (
                <p>
                  <strong>Confianza:</strong> {Math.round(result.confidence * 100)}%
                </p>
              ) : null}
            </div>

            {result.llmError ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {result.llmError}
              </div>
            ) : null}

            {combinedWarnings.length ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                {combinedWarnings.map((warning, index) => (
                  <p key={`${warning}-${index}`}>{warning}</p>
                ))}
              </div>
            ) : null}

            {result.extractedText ? (
              <details className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-[#334155] dark:bg-[#0F1623]">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Ver texto extraído
                </summary>
                <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-slate-600 dark:text-slate-400">
                  {result.extractedText}
                </pre>
              </details>
            ) : null}

            <button
              type="button"
              onClick={() => onUseDetectedData(result)}
              className="btn-press mt-4 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Usar datos detectados
            </button>
          </div>
        ) : null}
      </div>
  );

  if (embedded) {
    return (
      <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-900/40 dark:bg-violet-950/20">
        <p className="text-xs font-bold uppercase tracking-wide text-violet-800 dark:text-violet-200">Escanear ticket</p>
        <p className="mt-1 text-[11px] text-violet-900/80 dark:text-violet-200/80">
          Sube una foto o PDF y rellenamos importe, fecha y concepto.
        </p>
        {inner}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
      <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
        <span>🧾</span>
        <span>Analizador de factura o ticket</span>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">Analizar PDF o imagen</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Lee el ticket con Gemini (OCR + visión en fotos y escaneos) y rellena importe, fecha y comercio.
      </p>

      {inner}
    </div>
  );
}
