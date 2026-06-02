"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

type Trip = { id: string; name: string };

export default function DuplicateTripDialog({
  trip,
  open,
  onClose,
}: {
  trip: Trip | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && trip) {
      setName(`Copia de ${trip.name}`);
      setError(null);
      const t = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(t);
    }
  }, [open, trip]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trip) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("El nombre no puede estar vacío.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch(`/api/trips/${encodeURIComponent(trip.id)}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: trimmed }),
      });
      const payload = await resp.json().catch(() => null);
      if (!resp.ok) {
        if (resp.status === 409) {
          setError(payload?.error ?? `Ya tienes un viaje llamado "${trimmed}". Elige un nombre diferente.`);
          return;
        }
        throw new Error(payload?.error || `Error ${resp.status}`);
      }
      toast.success("Viaje duplicado", `"${trimmed}" está listo. Plan, rutas y listas copiados.`);
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo duplicar el viaje.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || !open || !trip) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dup-trip-title"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700/60 dark:bg-slate-950"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 pb-4 pt-5 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-light)]">
              <Copy className="h-5 w-5 text-[var(--brand-text)]" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id="dup-trip-title" className="text-base font-bold text-slate-950 dark:text-slate-50">
                Duplicar viaje
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Copia el plan, las rutas y las listas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700/60 dark:text-slate-400 dark:hover:bg-slate-900/40"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-4">
          <div>
            <label htmlFor="dup-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nombre del nuevo viaje <span className="text-rose-500" aria-hidden>*</span>
            </label>
            <input
              ref={inputRef}
              id="dup-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Nombre único para el viaje"
              maxLength={120}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-[var(--brand)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-border)] dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-50 dark:placeholder:text-slate-500"
              autoComplete="off"
              spellCheck
            />
            <div className="mt-1.5 min-h-[1.25rem]">
              {error ? (
                <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  No puede coincidir con el nombre de otro viaje tuyo.
                </p>
              )}
            </div>
          </div>

          {/* Descripción de qué se copia */}
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-700/40 dark:bg-slate-900/30">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Se copia:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
              <li>✓ Plan de actividades</li>
              <li>✓ Rutas en el mapa</li>
              <li>✓ Listas (items sin marcar)</li>
            </ul>
            <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">No se copia:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
              <li>✗ Gastos</li>
              <li>✗ Participantes</li>
              <li>✗ Fechas (quedará sin fechas para que las ajustes)</li>
            </ul>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700/60 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-900/40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)] disabled:pointer-events-none disabled:opacity-60"
            >
              <Copy className="h-4 w-4" aria-hidden />
              {loading ? "Duplicando…" : "Duplicar viaje"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
