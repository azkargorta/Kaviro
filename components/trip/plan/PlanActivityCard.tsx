"use client";

import { Check, ExternalLink, Star, Ticket, CalendarPlus } from "lucide-react";
import PlanCardActions from "@/components/trip/plan/PlanCardActions";
import LongTextSheet from "@/components/ui/LongTextSheet";
import { activityLikelyNeedsTicket, buildTicketOfficialSearchUrl } from "@/lib/trip-plan-ticket-hints";
import { ActivityReactions } from "@/components/trip/plan/ActivityReactions";
import { useTripWorkspace } from "@/components/trip/TripWorkspaceContext";

type PlanActivity = {
  trip_id?: string;
  id: string;
  title: string;
  description?: string | null;
  rating?: number | null;
  comment?: string | null;
  activity_date?: string | null;
  activity_time?: string | null;
  place_name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  activity_type?: string | null;
  activity_kind?: string | null;
  source?: string | null;
};

type Props = {
  activity: PlanActivity;
  onEdit?: (activity: PlanActivity) => void;
  onDelete?: (activity: PlanActivity) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  /** Premium: aviso de entradas y botón para buscar venta oficial. */
  premiumEnabled?: boolean;
  /** P5: actividades pasadas (viaje activo) — reducir opacidad y mostrar check */
  isPast?: boolean;
  /** RSVP: necesario para mostrar ¿Te apuntas? dentro de la tarjeta */
  tripId?: string;
  currentUserId?: string | null;
  displayName?: string;
};

// Fondo unificado para todas las tarjetas: limpio sin gradientes de color
const CARD_BASE = "border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623]";

function getActivityMeta(kind?: string | null) {
  switch (kind) {
    case "culture":
      return { icon: "🏛️", label: "Cultura",       badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",   card: CARD_BASE, dot: "#f59e0b" };
    case "nature":
      return { icon: "🌿", label: "Naturaleza",     badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", card: CARD_BASE, dot: "#10b981" };
    case "viewpoint":
      return { icon: "🌄", label: "Mirador",        badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",       card: CARD_BASE, dot: "#0ea5e9" };
    case "neighborhood":
      return { icon: "🧭", label: "Barrio",         badge: "bg-slate-100 text-slate-700 dark:bg-[#1E293B] dark:text-slate-300",   card: CARD_BASE, dot: "#64748b" };
    case "market":
      return { icon: "🧺", label: "Mercado",        badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300", card: CARD_BASE, dot: "#f97316" };
    case "excursion":
      return { icon: "🚌", label: "Excursión",      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",     card: CARD_BASE, dot: "#2563eb" };
    case "gastro_experience":
      return { icon: "🍷", label: "Gastronomía",    badge: "bg-fuchsia-100 text-fuchsia-800",                                     card: CARD_BASE, dot: "#d946ef" };
    case "shopping":
      return { icon: "🛍️", label: "Compras",        badge: "bg-violet-100 text-violet-800",                                       card: CARD_BASE, dot: "#8b5cf6" };
    case "night":
      return { icon: "🌙", label: "Noche",          badge: "bg-slate-200 text-slate-800",                                         card: CARD_BASE, dot: "#475569" };
    case "museum":
      return { icon: "🏛️", label: "Museo",          badge: "bg-amber-100 text-amber-700",                                         card: CARD_BASE, dot: "#d97706" };
    case "restaurant":
      return { icon: "🍽️", label: "Restaurante",    badge: "bg-rose-100 text-rose-700",                                           card: CARD_BASE, dot: "#f43f5e" };
    case "transport":
      return { icon: "🚆", label: "Transporte",     badge: "bg-sky-100 text-sky-700",                                             card: CARD_BASE, dot: "#0284c7" };
    case "lodging":
      return { icon: "🏨", label: "Alojamiento",    badge: "bg-violet-100 text-violet-700",                                       card: CARD_BASE, dot: "#7c3aed" };
    case "activity":
      return { icon: "🎟️", label: "Actividad",      badge: "bg-emerald-100 text-emerald-700",                                     card: CARD_BASE, dot: "#059669" };
    case "visit":
    default:
      return { icon: "📍", label: "Visita",         badge: "bg-slate-100 text-slate-700 dark:bg-[#1E293B] dark:text-slate-300",   card: CARD_BASE, dot: "#64748b" };
  }
}

function buildGoogleMapsUrl(activity: PlanActivity) {
  if (typeof activity.latitude === "number" && typeof activity.longitude === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${activity.latitude},${activity.longitude}`;
  }
  const query = activity.address || activity.place_name || activity.title;
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildGoogleCalendarUrl(activity: PlanActivity): string | null {
  if (!activity.activity_date) return null;
  const d = activity.activity_date.replace(/-/g, "");
  const t = activity.activity_time
    ? activity.activity_time.replace(/:/g, "").slice(0, 6).padEnd(6, "0")
    : null;
  const start = t ? `${d}T${t}` : d;
  const end = t
    ? (() => {
        const [h, m] = (activity.activity_time ?? "09:00").split(":").map(Number);
        const tot = h * 60 + m + 90;
        return `${d}T${String(Math.floor(tot / 60) % 24).padStart(2, "0")}${String(tot % 60).padStart(2, "0")}00`;
      })()
    : (() => {
        const nd = new Date(`${activity.activity_date}T00:00:00`);
        nd.setDate(nd.getDate() + 1);
        return nd.toISOString().slice(0, 10).replace(/-/g, "");
      })();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: activity.title || activity.place_name || "Actividad",
    dates: `${start}/${end}`,
    ...(activity.place_name || activity.address
      ? { location: activity.place_name || activity.address || "" }
      : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function PlanActivityCard({
  activity,
  onEdit,
  onDelete,
  selectable,
  selected,
  onToggleSelect,
  premiumEnabled = false,
  isPast = false,
  tripId,
  currentUserId,
  displayName = "Yo",
}: Props) {
  const { hideSocialFeatures } = useTripWorkspace();
  const meta = getActivityMeta(activity.activity_kind);
  const googleMapsUrl = buildGoogleMapsUrl(activity);
  const rating = typeof activity.rating === "number" ? Math.max(1, Math.min(5, Math.round(activity.rating))) : null;
  const showTicketCta = Boolean(premiumEnabled && activityLikelyNeedsTicket(activity));
  const calendarUrl = buildGoogleCalendarUrl(activity);
  const ticketSearchUrl = showTicketCta ? buildTicketOfficialSearchUrl(activity) : null;

  return (
    <div
      className={`relative rounded-2xl border shadow-sm transition-all ${meta.card} ${isPast ? "opacity-55" : ""} ${selectable ? "cursor-pointer ring-offset-2 transition hover:ring-2 hover:ring-violet-300/80" : ""} ${selected ? "ring-2 ring-violet-500" : ""}`}
      onClick={selectable && onToggleSelect ? () => onToggleSelect() : undefined}
      onKeyDown={
        selectable && onToggleSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggleSelect();
              }
            }
          : undefined
      }
      role={selectable ? "button" : undefined}
      tabIndex={selectable ? 0 : undefined}
    >
      {selectable ? (
        <button
          type="button"
          className={`absolute left-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-sm ${
            selected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white text-transparent"
          }`}
          aria-label={selected ? "Quitar selección" : "Seleccionar"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
        >
          <Check className="h-4 w-4 stroke-[3]" />
        </button>
      ) : null}
      {/* Icono + contenido; acciones en fila propia para evitar solapes con hora/título */}
      <div className="flex items-start gap-3 p-3.5">
        <div
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/80"
          style={{ backgroundColor: meta.dot ? `${meta.dot}18` : "#f1f5f9", color: meta.dot || "#64748b" }}
          aria-hidden
        >
          <span style={{ fontSize: 18 }}>{meta.icon}</span>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}>
              {meta.label}
            </span>
            {isPast ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <Check className="h-2.5 w-2.5" aria-hidden />
                Realizado
              </span>
            ) : null}
            {activity.activity_time ? (
              <span className="ml-auto shrink-0 inline-flex items-center rounded-lg bg-[#F87171]/10 px-2.5 py-1 text-[12px] font-bold tabular-nums text-[#EF4444] dark:bg-[#F87171]/20 dark:text-[#F87171]">
                {activity.activity_time.slice(0, 5)}
              </span>
            ) : null}
          </div>

          <PlanCardActions
            placement="inline"
            googleMapsUrl={googleMapsUrl}
            onEdit={onEdit}
            onDelete={onDelete}
            item={activity}
            accent="emerald"
            stopPropagation={Boolean(selectable)}
          />

          <div className="text-[14px] font-semibold leading-snug text-slate-900 dark:text-white" role="heading" aria-level={4}>
            <LongTextSheet
              text={activity.title}
              modalTitle="Actividad"
              minLength={40}
              lineClamp={3}
              className="font-semibold text-slate-900"
            />
          </div>

          <div className="mt-1.5 space-y-0.5 text-sm text-slate-600">
            {activity.place_name ? (
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <span aria-hidden className="text-slate-300">📍</span>
                {activity.place_name}
              </p>
            ) : null}
            {activity.address ? (
              <div className="text-xs text-slate-400">
                <LongTextSheet text={activity.address} modalTitle="Dirección" minLength={48} lineClamp={1} />
              </div>
            ) : null}
            {activity.description ? (
              <div className="mt-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 dark:border-[#1E293B] dark:bg-[#1E293B]/40 dark:text-slate-300">
                <LongTextSheet text={activity.description} modalTitle="Detalles" minLength={80} lineClamp={3} />
              </div>
            ) : null}
            {rating ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                <div className="flex items-center gap-1" aria-label={`${rating} de 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < rating ? "fill-current text-amber-500" : "text-amber-200"}`}
                      aria-hidden
                    />
                  ))}
                </div>
                <span className="text-amber-900/70">{rating}/5</span>
              </div>
            ) : null}
            {activity.comment ? (
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-[#1E293B] dark:bg-[#080C14] dark:text-slate-300">
                <LongTextSheet text={activity.comment} modalTitle="Comentario" minLength={48} lineClamp={2} />
              </div>
            ) : null}
            {showTicketCta && ticketSearchUrl ? (
              <div className="mt-3">
                <a
                  href={ticketSearchUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  title="Abre una búsqueda para localizar la web oficial de entradas; revisa que el dominio sea el del recinto."
                  className="inline-flex min-h-[36px] items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-950 shadow-sm transition hover:bg-amber-100"
                  onClick={selectable ? (e) => e.stopPropagation() : undefined}
                >
                  <Ticket className="h-4 w-4 shrink-0" aria-hidden />
                  Entrada
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                </a>
                <p className="mt-1 text-[10px] leading-snug text-slate-500">
                  Búsqueda orientada a la venta oficial; comprueba siempre la URL antes de pagar.
                </p>
              </div>
            ) : null}
            {calendarUrl ? (
              <div className="mt-2">
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[36px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-300 dark:hover:bg-[#334155]"
                  onClick={selectable ? (e) => e.stopPropagation() : undefined}
                  title="Añadir esta actividad a Google Calendar"
                >
                  <CalendarPlus className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
                  Añadir al calendario
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* RSVP — solo en viajes personales (Kaviro), no en Kaviro Trips */}
      {tripId && !hideSocialFeatures ? (
        <div
          className="border-t border-slate-100 px-3.5 pb-3 pt-2.5 dark:border-[#1E293B]"
          onClick={selectable ? (e) => e.stopPropagation() : undefined}
        >
          <ActivityReactions
            tripId={tripId}
            activityId={activity.id}
            currentUserId={currentUserId ?? null}
            displayName={displayName}
          />
        </div>
      ) : null}
    </div>
  );
}
