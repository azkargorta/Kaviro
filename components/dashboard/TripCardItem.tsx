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
  if (start && end) {
    const s = fmt(start);
    const e = fmt(end);
    // Omit year if same year as today
    return `${s} — ${e}`;
  }
  return start ? `Desde ${fmt(start)}` : `Hasta ${fmt(end!)}`;
}

function getCardGradient(badge: string): string {
  if (badge === "En curso")
    return "linear-gradient(135deg, #F87171 0%, #EF4444 55%, #DC2626 100%)";
  if (badge === "Próximo")
    return "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)";
  if (badge === "Finalizado")
    return "linear-gradient(135deg, #64748b 0%, #475569 100%)";
  if (badge === "Pendiente")
    return "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)";
  if (badge === "Grupo de gastos")
    return "linear-gradient(135deg, #10b981 0%, #047857 100%)";
  return "linear-gradient(135deg, #64748b 0%, #475569 100%)";
}

function computeCountdown(badge: string, startDate: string | null): string | null {
  if (badge !== "Próximo" || !startDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${startDate}T00:00:00`);
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return null;
  if (diff === 1) return "¡Mañana!";
  return `Faltan ${diff} días`;
}

export default function TripCardItem({
  trip,
  badge,
  accent: _accent,
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
      <div
        className={`overflow-hidden rounded-2xl border border-slate-200 shadow-[var(--shadow-card)] dark:border-[#1E293B] ${
          locked ? "opacity-80" : ""
        }`}
      >
        {/* ── Gradient header — click opens trip ── */}
        <div
          role={locked ? undefined : "link"}
          tabIndex={locked ? -1 : 0}
          onClick={openTrip}
          onKeyDown={(e) => {
            if (locked || editOpen || duplicateOpen) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openTrip();
            }
          }}
          className={`relative p-5 pb-7 ${locked ? "" : "cursor-pointer"}`}
          style={{ background: getCardGradient(badge) }}
        >
          {/* Top row: favorite star ← → status pill */}
          <div className="mb-3 flex items-start justify-between gap-2">
            {!isDemo ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleToggleFavorite();
                }}
                disabled={favoriteLoading}
                className="rounded-full p-1 transition hover:bg-white/20 disabled:opacity-60"
                title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                <Star
                  className={`h-4 w-4 transition-colors ${
                    isFavorite ? "fill-white text-white" : "fill-transparent text-white/50"
                  }`}
                />
              </button>
            ) : (
              <div />
            )}

            {/* Status / countdown pill */}
            {badge === "En curso" ? (
              <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />
                En curso
              </span>
            ) : locked ? (
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white">
                Premium
              </span>
            ) : countdown ? (
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                {countdown}
              </span>
            ) : badge === "Finalizado" ? (
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                Finalizado
              </span>
            ) : badge === "Pendiente" ? (
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white">
                Sin fechas
              </span>
            ) : null}
          </div>

          {/* Trip name */}
          <h3
            className="line-clamp-2 text-xl font-extrabold leading-tight tracking-tight text-white"
            title={trip.name}
          >
            {trip.name}
          </h3>

          {/* Destination or expense group label */}
          {isExpenseGroup ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/80">
              <Receipt className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Grupo de gastos
            </p>
          ) : trip.destination ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/80">
              <span className="text-sm leading-none" aria-hidden>📍</span>
              <span className="line-clamp-1">{trip.destination}</span>
            </p>
          ) : null}
        </div>

        {/* ── White / dark body ── */}
        <div
          className={`bg-white px-5 py-4 dark:bg-[#0F1623] ${locked ? "" : "cursor-pointer"}`}
          onClick={openTrip}
        >
          {/* Date + currency chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-[#1E293B] dark:text-slate-300">
              <Calendar className="h-3 w-3" aria-hidden />
              {formatRangeShort(trip.start_date, trip.end_date)}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-[#1E293B] dark:text-slate-300">
              {(trip.base_currency || "EUR").toUpperCase()}
            </span>
          </div>

          {/* Progress bar */}
          {timelineProgress !== null && (
            <div className="mt-3" aria-hidden>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1E293B]">
                <div
                  className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-500 ease-out"
                  style={{ width: `${timelineProgress}%` }}
                />
              </div>
              <p className="mt-1 text-right text-[10px] text-slate-400 dark:text-slate-500">
                {timelineProgress}% completado
              </p>
            </div>
          )}

          {/* Announcement badge (agency trips) */}
          {isAgencyManaged && unreadAnnouncements > 0 && (
            <Link
              href={`/trip/${encodeURIComponent(trip.id)}/announcements`}
              onClick={(e) => e.stopPropagation()}
              className="mt-3 flex min-h-9 items-center gap-2 rounded-xl border border-[#1e3a5f]/25 bg-[#1e3a5f]/8 px-3 py-2 text-xs font-semibold text-[#1e3a5f] transition hover:bg-[#1e3a5f]/12 dark:border-sky-800/40 dark:bg-sky-950/30 dark:text-sky-200"
            >
              <Megaphone className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {unreadAnnouncements === 1
                ? "1 aviso nuevo del organizador"
                : `${unreadAnnouncements} avisos nuevos del organizador`}
            </Link>
          )}

          {error && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800 dark:border-rose-400/30 dark:bg-rose-950/20 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Bottom actions row */}
          <div
            className="mt-4 flex items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: demo label or ··· menu */}
            <div>
              {isDemo ? (
                <span className="text-[11px] font-medium text-[var(--brand)] dark:text-[#FCA5A5]">
                  Viaje de práctica
                </span>
              ) : (
                <div ref={actionsRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setActionsMenuOpen((v) => !v)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#1E293B] dark:hover:text-slate-200"
                    title="Más opciones"
                    aria-label="Más opciones"
                    aria-expanded={actionsMenuOpen}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {actionsMenuOpen && (
                    <div className="absolute bottom-full left-0 z-20 mb-1.5 min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-[#1E293B] dark:bg-[#0F1623]">
                      <button
                        type="button"
                        onClick={() => {
                          setEditOpen(true);
                          setActionsMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#1E293B]"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDuplicateOpen(true);
                          setActionsMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-[#1E293B]"
                      >
                        <Copy className="h-4 w-4" aria-hidden />
                        Duplicar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void onDelete();
                          setActionsMenuOpen(false);
                        }}
                        disabled={deleting}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-950/20"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                        {deleting ? "Eliminando…" : "Eliminar"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Abrir → */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openTrip();
              }}
              disabled={locked}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)] disabled:opacity-50"
            >
              {locked ? "Premium" : "Abrir"}
              {!locked && <ArrowRight className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        </div>
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
    </>
  );
}
