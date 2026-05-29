"use client";

import { useEffect, useRef, useState } from "react";
import { btnPrimary } from "@/components/ui/brandStyles";
import type { ResourceVisibility } from "@/lib/trip-resources/visibility";
import { useTripParticipants } from "@/hooks/useTripParticipants";
import ResourceVisibilityPicker from "@/components/trip/resources/ResourceVisibilityPicker";

type UploadResult = {
  path: string;
  publicUrl: string | null;
  mimeType: string | null;
};

type ResourceUploadFormProps = {
  tripId: string;
  currentUserId: string | null;
  saving?: boolean;
  onUpload: (file: File) => Promise<UploadResult>;
  onCreateResource: (input: {
    title: string;
    category: string;
    notes: string;
    upload: UploadResult | null;
    detectedDocumentType?: string | null;
    detectedData?: Record<string, unknown> | null;
    visibility: ResourceVisibility;
    visibleToUserIds: string[];
  }) => Promise<void>;
};

const CATEGORY_OPTIONS = [
  { value: "document", label: "Documento" },
  { value: "reservation", label: "Reserva" },
  { value: "ticket", label: "Ticket" },
  { value: "insurance", label: "Seguro" },
  { value: "other", label: "Otro" },
];

function titleFromFileName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

export default function ResourceUploadForm({
  tripId,
  currentUserId,
  saving = false,
  onUpload,
  onCreateResource,
}: ResourceUploadFormProps) {
  const { participants, loading: loadingParticipants } = useTripParticipants(tripId);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("document");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<ResourceVisibility>("trip");
  const [visibleToUserIds, setVisibleToUserIds] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (file && !title.trim()) {
      setTitle(titleFromFileName(file.name));
    }
  }, [file, title]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setLocalError(null);
    setSuccessMessage(null);

    try {
      const safeTitle = title.trim();
      const safeNotes = notes.trim();

      if (!safeTitle) {
        setLocalError("Introduce un título.");
        return;
      }

      if (!file) {
        setLocalError("Selecciona un archivo antes de subirlo.");
        return;
      }

      if (visibility === "selected" && visibleToUserIds.length === 0) {
        setLocalError("Marca al menos un viajero que pueda ver el documento.");
        return;
      }

      const upload = await onUpload(file);

      await onCreateResource({
        title: safeTitle,
        category,
        notes: safeNotes,
        upload,
        detectedDocumentType: category === "reservation" ? "manual_reservation_upload" : null,
        detectedData: {},
        visibility,
        visibleToUserIds: visibility === "selected" ? visibleToUserIds : [],
      });

      setTitle("");
      setCategory("document");
      setNotes("");
      setFile(null);
      setVisibility("trip");
      setVisibleToUserIds([]);
      setSuccessMessage("Documento subido correctamente.");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error subiendo documento:", error);
      setLocalError(error instanceof Error ? error.message : "No se pudo subir el documento.");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Adjuntar documento</h3>
          <p className="mt-1 text-sm text-slate-500">
            Sube imágenes o PDFs de reservas, tickets o documentos del viaje.
          </p>
        </div>

        <div className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Archivo</span>
          <div
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
              dragging
                ? "border-violet-400 bg-violet-50"
                : file
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-300 bg-slate-50 hover:border-[var(--brand)] hover:bg-[var(--brand-light)] dark:border-[#334155] dark:bg-[#080C14]"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) {
                setFile(dropped);
                setLocalError(null);
                setSuccessMessage(null);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf,image/*"
              className="hidden"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setLocalError(null);
                setSuccessMessage(null);
              }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">📄</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-emerald-800">{file.name}</p>
                  <p className="text-xs text-emerald-600">
                    {(file.size / 1024).toFixed(0)} KB — listo para subir
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-[#0F1623]">
                  📁
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Arrastra aquí o haz clic para seleccionar
                </p>
                <p className="mt-1 text-xs text-slate-400">PDF, imágenes · Máx. 10 MB</p>
              </div>
            )}
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Título</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Reserva hotel, billete…"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[var(--brand)] dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Categoría</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[var(--brand)] dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {!loadingParticipants ? (
          <ResourceVisibilityPicker
            visibility={visibility}
            onVisibilityChange={setVisibility}
            selectedUserIds={visibleToUserIds}
            onSelectedUserIdsChange={setVisibleToUserIds}
            participants={participants}
            currentUserId={currentUserId}
            disabled={saving}
          />
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notas</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[var(--brand)] dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
          />
        </label>

        {localError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {localError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Subiendo documento..." : "Subir documento"}
        </button>
      </form>
    </div>
  );
}
