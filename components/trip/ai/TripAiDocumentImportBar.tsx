"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Paperclip, Upload } from "lucide-react";
import type { TripResource } from "@/hooks/useTripResources";
import {
  looksLikeAssistantItineraryText,
  looksLikePastedItineraryImport,
} from "@/lib/trip-ai/itineraryDraftUtils";

type Props = {
  tripId: string;
  disabled?: boolean;
  busy?: boolean;
  /** Abierto por defecto (p. ej. en modo planificación). */
  defaultExpanded?: boolean;
  onGenerateFromText: (sourceText: string, hint?: string) => Promise<unknown>;
  onStatus?: (message: string | null) => void;
};

function resourceHasFile(r: TripResource) {
  return Boolean(r.file_path || r.file_url);
}

function textLooksLikeItinerary(text: string): boolean {
  const t = text.trim();
  if (t.length < 80) return false;
  if (looksLikePastedItineraryImport(t) || looksLikeAssistantItineraryText(t)) return true;
  const dayHits = (t.match(/d[ií]a\s+\d+|day\s+\d+/gi) || []).length;
  const timeHits = (t.match(/\d{1,2}[.:]\d{2}\s*h\b|\d{1,2}:\d{2}/gi) || []).length;
  if (dayHits >= 1 && timeHits >= 2) return true;
  if (t.length >= 500 && (dayHits >= 1 || timeHits >= 3)) return true;
  return t.length >= 1200;
}

export default function TripAiDocumentImportBar({
  tripId,
  disabled = false,
  busy = false,
  defaultExpanded = true,
  onGenerateFromText,
  onStatus,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(defaultExpanded);
  const [resources, setResources] = useState<TripResource[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [lastSource, setLastSource] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    setLoadingList(true);
    setLocalError(null);
    try {
      const res = await fetch(`/api/trip-resources?tripId=${encodeURIComponent(tripId)}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "No se pudieron cargar documentos.");
      const list = Array.isArray(data?.resources) ? (data.resources as TripResource[]) : [];
      const withFiles = list.filter(resourceHasFile);
      setResources(withFiles);
      setSelectedId((prev) => {
        if (prev && withFiles.some((r) => r.id === prev)) return prev;
        return withFiles[0]?.id ?? "";
      });
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Error al cargar documentos.");
      setResources([]);
    } finally {
      setLoadingList(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (open) void loadResources();
  }, [open, loadResources]);

  async function runGenerate(text: string, hint: string, sourceLabel: string) {
    if (!text.trim() || text.trim().length < 80) {
      setLocalError("El texto extraído es demasiado corto. Prueba otro PDF o pega el itinerario en el chat.");
      return;
    }
    if (!textLooksLikeItinerary(text)) {
      setLocalError(
        "El archivo tiene poco texto de itinerario (días/horas). Si es un dossier de viaje, puede que sea solo imágenes: prueba un PDF con texto seleccionable o pega el contenido en el chat."
      );
      return;
    }
    setLocalError(null);
    setLastSource(sourceLabel);
    onStatus?.(`Leyendo «${sourceLabel}» y generando tarjetas…`);
    try {
      await onGenerateFromText(text, hint);
      onStatus?.(`Tarjetas generadas desde «${sourceLabel}». Revisa y pulsa Añadir.`);
    } catch (e) {
      onStatus?.(null);
      throw e;
    }
  }

  async function handleFromResource() {
    if (!selectedId) {
      setLocalError("Elige un documento del viaje o adjunta un PDF nuevo.");
      return;
    }
    setExtracting(true);
    setLocalError(null);
    try {
      const res = await fetch(
        `/api/trip-resources/${encodeURIComponent(selectedId)}/extract-text?tripId=${encodeURIComponent(tripId)}`,
        { credentials: "include", cache: "no-store" }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "No se pudo leer el documento.");
      }
      const text = typeof data?.extractedText === "string" ? data.extractedText : "";
      const title = typeof data?.title === "string" ? data.title : "Documento";
      await runGenerate(text, `Documento del viaje: ${title}`, title);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "No se pudo importar desde el documento.");
      onStatus?.(null);
    } finally {
      setExtracting(false);
    }
  }

  async function handleFilePicked(file: File) {
    setUploading(true);
    setLocalError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tripId", tripId);
      formData.append("saveToResources", "1");

      const isPdf =
        file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        try {
          const { extractTextFromPdfClient } = await import("@/lib/pdfToText");
          const clientText = (await extractTextFromPdfClient(file)).trim();
          if (clientText.length >= 80) {
            formData.append("extractedText", clientText);
          }
        } catch {
          /* el servidor intentará extraer con unpdf */
        }
      }

      const res = await fetch("/api/trip-ai/import-document", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "No se pudo leer el archivo.");
      }
      const text = typeof data?.extractedText === "string" ? data.extractedText : "";
      const title =
        typeof data?.title === "string"
          ? data.title
          : typeof data?.fileName === "string"
            ? data.fileName
            : file.name;
      if (data?.savedToResources) {
        void loadResources();
      }
      await runGenerate(text, `Documento: ${title}`, title);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "No se pudo leer el archivo.");
      onStatus?.(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const working = extracting || uploading || busy;

  return (
    <section
      data-tour="ai-document-import"
      className="shrink-0 rounded-2xl border border-[var(--brand-border)] bg-gradient-to-br from-[var(--brand-light)]/80 via-white to-slate-50 shadow-sm dark:border-[#334155] dark:from-[#F87171]/10 dark:via-[#0F1623] dark:to-[#080C14]"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left sm:px-4"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100 sm:text-sm">
          <Paperclip className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden />
          Documento del viaje → planes y hoteles
        </span>
        <span className="text-[10px] font-semibold text-slate-500">{open ? "Ocultar" : "Mostrar"}</span>
      </button>

      {open ? (
        <div className="space-y-2 border-t border-[var(--brand-border)]/40 px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Adjunta el dossier PDF (empresa, agencia, etc.) o elige uno de{" "}
            <Link
              href={`/trip/${encodeURIComponent(tripId)}/resources`}
              className="font-semibold text-[var(--brand-text)] underline-offset-2 hover:underline"
            >
              Recursos
            </Link>
            . Generamos tarjetas para validar cada parada y alojamiento.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <button
              type="button"
              disabled={working}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--brand-border)] bg-white px-4 py-3 text-xs font-bold text-[var(--brand-text)] transition hover:bg-[var(--brand-light)]/50 disabled:opacity-50 dark:border-[#F87171]/40 dark:bg-[#080C14] dark:text-[#F87171]"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-4 w-4" aria-hidden />
              )}
              Adjuntar PDF o imagen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/*"
              className="sr-only"
              disabled={working}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFilePicked(f);
              }}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              O desde Recursos del viaje
              <select
                value={selectedId}
                disabled={working || loadingList || !resources.length}
                onChange={(e) => setSelectedId(e.target.value)}
                className="min-h-[40px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-[var(--brand-border)] focus:ring-2 focus:ring-[var(--brand-border)] disabled:opacity-50 dark:border-[#334155] dark:bg-[#080C14] dark:text-slate-100"
              >
                {loadingList ? <option value="">Cargando…</option> : null}
                {!loadingList && !resources.length ? (
                  <option value="">Sin documentos — adjunta uno arriba</option>
                ) : null}
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={working || !selectedId}
              onClick={() => void handleFromResource()}
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50"
            >
              {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Generar tarjetas
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={working}
              onClick={() => void loadResources()}
              className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline dark:text-slate-400"
            >
              Actualizar lista
            </button>
            {lastSource ? (
              <span className="text-[10px] font-medium text-slate-500">Último: {lastSource}</span>
            ) : null}
          </div>

          {localError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
              {localError}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
