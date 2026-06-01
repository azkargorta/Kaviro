"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { parseParticipantListFromText } from "@/lib/participants/parseParticipantList";
import type { ParticipantImportDraft, ParticipantImportRow } from "@/lib/participants/participantImportTypes";
import type { TripRole } from "@/lib/participants";
import { TRIP_ROLE_OPTIONS } from "@/lib/participants";
import { btnPrimary } from "@/components/ui/brandStyles";
import { FileSpreadsheet, Loader2, Upload, X } from "lucide-react";

type Props = {
  tripId: string;
  existingEmails: Set<string>;
  existingNames: Set<string>;
  onImported: () => void | Promise<void>;
  onClose: () => void;
};

function toDrafts(rows: ParticipantImportRow[], existingEmails: Set<string>, existingNames: Set<string>): ParticipantImportDraft[] {
  return rows.map((row, index) => {
    const email = row.email?.toLowerCase() ?? null;
    const nameKey = row.display_name.toLowerCase();
    let warning: string | undefined;
    if (email && existingEmails.has(email)) warning = "Ya está en el viaje (email)";
    else if (!email && existingNames.has(nameKey)) warning = "Ya está en el viaje (nombre)";

    return {
      ...row,
      id: `draft-${index}-${email ?? nameKey}`,
      selected: !warning,
      warning,
    };
  });
}

export default function BulkImportParticipantsPanel({
  tripId,
  existingEmails,
  existingNames,
  onImported,
  onClose,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [drafts, setDrafts] = useState<ParticipantImportDraft[]>([]);
  const [defaultRole, setDefaultRole] = useState<TripRole>("viewer");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseSource, setParseSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<string | null>(null);

  const selectedCount = useMemo(() => drafts.filter((d) => d.selected).length, [drafts]);

  const applyRows = useCallback(
    (rows: ParticipantImportRow[], source: string) => {
      setDrafts(toDrafts(rows, existingEmails, existingNames));
      setParseSource(source);
      setResultSummary(null);
      if (!rows.length) {
        setError("No se detectaron filas válidas. Revisa que haya columna de nombre.");
      } else {
        setError(null);
      }
    },
    [existingEmails, existingNames]
  );

  async function parseFile(file: File) {
    setParsing(true);
    setError(null);
    setResultSummary(null);

    const name = file.name.toLowerCase();
    const isLocalText = /\.(csv|tsv|txt)$/i.test(name);

    try {
      if (isLocalText) {
        const text = await file.text();
        const rows = parseParticipantListFromText(text);
        applyRows(rows, "csv");
        return;
      }

      const formData = new FormData();
      formData.append("tripId", tripId);
      formData.append("file", file);

      const res = await fetch("/api/trip-participants/parse-list", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "No se pudo leer el archivo.");

      applyRows(payload.participants ?? [], payload.source ?? "archivo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al leer el archivo.");
      setDrafts([]);
    } finally {
      setParsing(false);
    }
  }

  async function parsePasted() {
    const text = pastedText.trim();
    if (!text) {
      setError("Pega una lista o sube un archivo.");
      return;
    }

    setParsing(true);
    setError(null);
    setResultSummary(null);

    try {
      const local = parseParticipantListFromText(text);
      if (local.length >= 2) {
        applyRows(local, "texto");
        return;
      }

      const res = await fetch("/api/trip-participants/parse-list", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, text }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "No se pudo interpretar el texto.");

      applyRows(payload.participants ?? [], payload.source ?? "texto");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al interpretar.");
      setDrafts([]);
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    const toCreate = drafts.filter((d) => d.selected && !d.warning);
    if (!toCreate.length) {
      setError("Selecciona al menos un participante nuevo.");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const res = await fetch("/api/trip-participants/bulk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          role: defaultRole,
          participants: toCreate.map((d) => ({
            display_name: d.display_name,
            email: d.email,
            phone: d.phone,
          })),
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "No se pudo importar.");

      const created = Number(payload.created ?? 0);
      const skipped = Number(payload.skipped ?? 0);
      const errCount = Array.isArray(payload.errors) ? payload.errors.length : 0;
      setResultSummary(
        `Importados: ${created}. Omitidos: ${skipped}${errCount ? ` (${errCount} con error)` : ""}.`
      );
      await onImported();
      if (created > 0 && errCount === 0) {
        setDrafts([]);
        setPastedText("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-white p-4 shadow-sm dark:border-violet-900/40 dark:from-violet-950/30 dark:to-[#0F1623]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
            <FileSpreadsheet className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">Importar lista</h3>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              Excel (.xlsx), CSV, imagen o PDF con nombres, correo y teléfono.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623]"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.tsv,.txt,image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void parseFile(file);
          }}
        />
        <button
          type="button"
          disabled={parsing}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-white px-4 py-3 text-sm font-semibold text-violet-900 transition hover:bg-violet-50 disabled:opacity-60 dark:border-violet-800 dark:bg-[#0F1623] dark:text-violet-200"
        >
          {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {parsing ? "Leyendo archivo…" : "Subir Excel, CSV o imagen"}
        </button>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
            O pega desde Excel / WhatsApp
          </label>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={4}
            placeholder={"Nombre;Email;Teléfono\nAna;ana@mail.com;600111222\nLuis;luis@mail.com;"}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
          />
          <button
            type="button"
            disabled={parsing || !pastedText.trim()}
            onClick={() => void parsePasted()}
            className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200"
          >
            Analizar texto pegado
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Rol por defecto</label>
          <select
            value={defaultRole}
            onChange={(e) => setDefaultRole(e.target.value as TripRole)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
          >
            {TRIP_ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      {resultSummary ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
          {resultSummary}
        </div>
      ) : null}

      {drafts.length > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              Vista previa ({drafts.length}) · {parseSource ? `origen: ${parseSource}` : ""}
            </span>
            <span>{selectedCount} seleccionados</span>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-[#334155]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-600 dark:bg-[#1E293B] dark:text-slate-300">
                <tr>
                  <th className="px-2 py-2 w-8" />
                  <th className="px-2 py-2">Nombre</th>
                  <th className="px-2 py-2 hidden sm:table-cell">Email</th>
                  <th className="px-2 py-2 hidden md:table-cell">Tel.</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-t border-slate-100 dark:border-[#334155] ${
                      row.warning ? "bg-amber-50/80 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        disabled={Boolean(row.warning)}
                        onChange={() =>
                          setDrafts((prev) =>
                            prev.map((d) =>
                              d.id === row.id ? { ...d, selected: !d.selected } : d
                            )
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-2 font-medium text-slate-900 dark:text-white">
                      {row.display_name}
                      {row.warning ? (
                        <span className="mt-0.5 block text-[10px] font-normal text-amber-800">
                          {row.warning}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2 text-slate-600 hidden sm:table-cell">{row.email ?? "—"}</td>
                    <td className="px-2 py-2 text-slate-600 hidden md:table-cell">{row.phone ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setDrafts((prev) => prev.map((d) => ({ ...d, selected: !d.warning })))
              }
              className="rounded-xl border px-3 py-2 text-xs font-semibold"
            >
              Seleccionar todos los nuevos
            </button>
            <button
              type="button"
              disabled={importing || selectedCount === 0}
              onClick={() => void handleImport()}
              className={`${btnPrimary} inline-flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60`}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {importing ? "Importando…" : `Añadir ${selectedCount} al viaje`}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
