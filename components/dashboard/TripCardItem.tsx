"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Copy,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Receipt,
  Star,
  Trash2,
} from "lucide-react";
import { isExpenseGroupTrip } from "@/lib/dashboard-trip-types";
import { useTripAnnouncementUnreadCount } from "@/components/dashboard/DashboardAnnouncementUnreadContext";
import { useToast } from "@/components/ui/toast";
import TripDashboardEditDialog from "@/components/dashboard/TripDashboardEditDialog";
import DuplicateTripDialog from "@/components/dashboard/DuplicateTripDialog";
import TripStatusBadge from "@/components/dashboard/TripStatusBadge";
import { tripTimelineProgress } from "@/lib/trip-timeline-progress";

type Trip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string | null;
  is_favorite?: boolean;
  agency_id?: string | null;
  trip_mode?: "travel" | "expenses" | string | null;
};

function formatRangeShort(start: string | null, end: string | null) {
  if (!start && !end) return "Fechas por definir";
  const fmt = (v: string) =>
    new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(
      new Date(`${v}T00:00:00`)
    );
  if (start && end) return `${fmt(start)} — ${fmt(end)}`;
  return start ? `Desde ${fmt(start)}` : `Hasta ${fmt(end!)}`;
}

function computeCountdown(badge: string, startDate: string | null): string | null {
  if (badge !== "Próximo" || !startDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${startDate}T00:00:00`);
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return null;
  if (diff === 1) return "Mañana";
  return `${diff} días`;
}

export default function TripCardItem({
  trip,
  badge,
  accent: _accent,
  locked,
  isDemo = false,
  compact = false,
}: {
  trip: Trip;
  badge: string;
  accent: string;
  locked: boolean;
  isDemo?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(trip.is_favorite ?? false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const unreadAnnouncements = useTripAnnouncementUnreadCount(trip.id);
  const isAgencyManaged = Boolean(trip.agency_id);

  useEffect(() => {
    if (!actionsMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [actionsMenuOpen]);

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

  const isExpenseGroup = isExpenseGroupTrip(trip);
  const timelineProgress = tripTimelineProgress(trip.start_date, trip.end_date);
  const countdown = computeCountdown(badge, trip.start_date);

  function openTrip() {
    if (locked || editOpen || duplicateOpen) return;
    router.push(
      isExpenseGroup
        ? `/trip/${encodeURIComponent(trip.id)}/summary`
        : `/trip/${encodeURIComponent(trip.id)}`
    );
  }

  return (
    <>
      <article
        className={`group flex flex-col rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-px hover:border-slate-300 hover:shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] dark:hover:border-slate-600 ${
          locked ? "opacity-80" : "cursor-pointer"
        } ${compact ? "p-3" : "p-4"}`}
        onClick={openTrip}
        onKeyDown={(e) => {
          if (locked || editOpen || duplicateOpen) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openTrip();
          }
        }}
        role={locked ? undefined : "button"}
        tabIndex={locked ? -1 : 0}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <TripStatusBadge badge={badge} />
              {locked ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Premium</span>
              ) : countdown ? (
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{countdown}</span>
              ) : null}
            </div>
            <h3
              className={`mt-2 font-semibold leading-snug tracking-tight text-slate-900 dark:text-white ${
                compact ? "line-clamp-1 text-sm" : "line-clamp-2 text-base"
              }`}
              title={trip.name}
            >
              {trip.name}
            </h3>
            {isExpenseGroup ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Receipt className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Grupo de gastos
              </p>
            ) : trip.destination ? (
              <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{trip.destination}</p>
            ) : null}
          </div>

          {!isDemo ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void handleToggleFavorite();
              }}
              disabled={favoriteLoading}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-amber-500 disabled:opacity-60 dark:hover:bg-[#1E293B]"
              title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
              aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              <Star
                className={`h-4 w-4 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`}
              />
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 font-medium dark:bg-[#1E293B]">
            <Calendar className="h-3 w-3" aria-hidden />
            {formatRangeShort(trip.start_date, trip.end_date)}
          </span>
          <span className="rounded-md bg-slate-50 px-2 py-1 font-medium dark:bg-[#1E293B]">
            {(trip.base_currency || "EUR").toUpperCase()}
          </span>
        </div>

        {timelineProgress !== null && badge === "En curso" && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1E293B]">
              <div
                className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-500"
                style={{ width: `${timelineProgress}%` }}
              />
            </div>
            <p className="mt-1 text-right text-[10px] text-slate-400">{timelineProgress}% del viaje</p>
          </div>
        )}

        {isAgencyManaged && unreadAnnouncements > 0 && (
          <Link
            href={`/trip/${encodeURIComponent(trip.id)}/announcements`}
            onClick={(e) => e.stopPropagation()}
            className="mt-3 flex min-h-8 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-[#1E293B] dark:text-slate-200"
          >
            <Megaphone className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {unreadAnnouncements === 1 ? "1 aviso nuevo" : `${unreadAnnouncements} avisos nuevos`}
          </Link>
        )}

        {error && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-400/30 dark:bg-rose-950/20 dark:text-rose-300">
            {error}
          </div>
        )}

        <div
          className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {isDemo ? (
            <span className="text-[11px] font-medium text-slate-400">Viaje de práctica</span>
          ) : (
            <div ref={actionsRef} className="relative">
              <button
                type="button"
                onClick={() => setActionsMenuOpen((v) => !v)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#1E293B]"
                aria-label="Más opciones"
                aria-expanded={actionsMenuOpen}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {actionsMenuOpen && (
                <div className="absolute bottom-full left-0 z-20 mb-1 min-w-[150px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-[#1E293B] dark:bg-[#0F1623]">
                  <button
                    type="button"
                    onClick={() => {
                      setEditOpen(true);
                      setActionsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#1E293B]"
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDuplicateOpen(true);
                      setActionsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#1E293B]"
                  >
                    <Copy className="h-4 w-4" /> Duplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void onDelete();
                      setActionsMenuOpen(false);
                    }}
                    disabled={deleting}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" /> {deleting ? "Eliminando…" : "Eliminar"}
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={openTrip}
            disabled={locked}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)] transition hover:text-[var(--brand-hover)] disabled:opacity-50"
          >
            {locked ? "Premium" : "Abrir"}
            {!locked && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </article>

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
    </>
  );
}
