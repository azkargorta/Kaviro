"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, MapPin, Pencil, Trash2, Star } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import LongTextSheet from "@/components/ui/LongTextSheet";
import TripDashboardEditDialog from "@/components/dashboard/TripDashboardEditDialog";
import DuplicateTripDialog from "@/components/dashboard/DuplicateTripDialog";

type Trip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string | null;
  is_favorite?: boolean;
};

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatRange(start: string | null, end: string | null) {
  if (!start && !end) return "Fechas por definir";
  if (start && end) return `${formatDate(start)} — ${formatDate(end)}`;
  return start ? `Desde ${formatDate(start)}` : `Hasta ${formatDate(end)}`;
}

export default function TripCardItem({
  trip,
  badge,
  accent,
  locked,
  isDemo = false,
}: {
  trip: Trip;
  badge: string;
  accent: string;
  locked: boolean;
  isDemo?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(trip.is_favorite ?? false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  async function onDelete() {
    setError(null);
    const ok = window.confirm(
      `¿Eliminar viaje "${trip.name}"?\n\nEsta acción no se puede deshacer.`
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const resp = await fetch(`/api/trips/${encodeURIComponent(trip.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(payload?.error || `Error ${resp.status}`);
      toast.success("Viaje eliminado", `Se eliminó "${trip.name}".`);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo eliminar el viaje.";
      setError(msg);
      toast.error("No se pudo eliminar", msg);
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleFavorite() {
    if (favoriteLoading) return;
    const newValue = !isFavorite;
    setIsFavorite(newValue);
    setFavoriteLoading(true);
    try {
      const resp = await fetch(`/api/trips/${encodeURIComponent(trip.id)}/favorite`, {
        method: "POST",
        credentials: "include",
      });
      if (!resp.ok) {
        setIsFavorite(!newValue);
        toast.error("Error", "No se pudo actualizar favorito.");
      } else {
        router.refresh();
      }
    } catch {
      setIsFavorite(!newValue);
      toast.error("Error", "No se pudo actualizar favorito.");
    } finally {
      setFavoriteLoading(false);
    }
  }

  function openTrip() {
    if (locked) return;
    router.push(`/trip/${encodeURIComponent(trip.id)}`);
  }

  return (
    <div
      role={locked ? undefined : "link"}
      tabIndex={locked ? -1 : 0}
      onClick={openTrip}
      onKeyDown={(e) => {
        if (locked) return;
        if (e.key === "Enter" || e.key === " ") openTrip();
      }}
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--shadow-card)] dark:border-[#1E293B] dark:bg-[#0F1623] ${
        locked ? "opacity-80" : "cursor-pointer transition hover:-translate-y-0.5 hover:border-[var(--brand-border)] hover:shadow-[var(--shadow-raised)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] bg-gradient-to-br ${accent}`}>
            {badge}
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50" role="heading" aria-level={3}>
              <LongTextSheet
                text={trip.name}
                modalTitle="Viaje"
                minLength={40}
                lineClamp={3}
                className="font-bold text-slate-950 dark:text-slate-50"
              />
            </div>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-400" aria-hidden />
              <span className="min-w-0 flex-1">
                <LongTextSheet
                  text={trip.destination || "Destino pendiente"}
                  modalTitle="Destino"
                  minLength={48}
                  lineClamp={3}
                  className="text-sm text-slate-600 dark:text-slate-300"
                />
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {!isDemo ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void handleToggleFavorite();
              }}
              disabled={favoriteLoading}
              className="group rounded-full p-1.5 transition-colors hover:bg-amber-50 disabled:opacity-60 dark:hover:bg-amber-950/30"
              title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
              aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              <Star
                className={`h-5 w-5 transition-colors ${
                  isFavorite
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-slate-300 group-hover:text-amber-300"
                }`}
              />
            </button>
          ) : null}
          {locked ? (
            <div className="rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-[#1E293B] dark:text-slate-200">
              Premium
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-white/50 p-4 dark:bg-[#080C14]/60 dark:border dark:border-[#1E293B]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-[#F87171]/80">Fechas y moneda</p>
        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{formatRange(trip.start_date, trip.end_date)}</p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          Moneda base: <span className="font-semibold">{(trip.base_currency || "EUR").toUpperCase()}</span>
        </p>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>{trip.destination || "Viaje"}</span>
        {locked ? (
          <span className="text-xs font-semibold text-amber-950">
            Funciones premium bloqueadas. Hazte Premium para desbloquear.
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {!isDemo ? (
          <>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditOpen(true);
          }}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
          title="Editar destino, fechas y moneda"
        >
          <Pencil className="h-4 w-4" aria-hidden />
          Editar
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDuplicateOpen(true);
          }}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-light)] px-4 py-2 text-xs font-semibold text-[var(--brand-text)] transition hover:border-[var(--brand)] dark:border-[#F87171]/30 dark:bg-[#F87171]/10 dark:text-[#FCA5A5]"
          title="Duplicar viaje (copia el plan, rutas y listas)"
        >
          <Copy className="h-4 w-4" aria-hidden />
          Duplicar
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void onDelete();
          }}
          disabled={deleting}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-400/30 dark:bg-[#0F1623] dark:text-rose-300 dark:hover:bg-rose-950/20"
          title="Eliminar viaje"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {deleting ? "Eliminando…" : "Eliminar viaje"}
        </button>
          </>
        ) : (
          <span className="text-xs font-medium text-[var(--brand-text)] dark:text-[#FCA5A5]">Viaje de práctica · no se elimina</span>
        )}
      </div>

      <TripDashboardEditDialog
        trip={editOpen ? trip : null}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => router.refresh()}
      />
      <DuplicateTripDialog
        trip={duplicateOpen ? trip : null}
        open={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
      />
    </div>
  );
}
