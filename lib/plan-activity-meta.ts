export function normalizePlanKind(kind: unknown) {
  return typeof kind === "string" ? kind.trim().toLowerCase() : "";
}

export function isLodgingPlanActivity(a: {
  activity_type?: string | null;
  source?: string | null;
  linked_reservation_id?: string | null;
  activity_kind?: string | null;
}) {
  return (
    a.activity_type === "lodging" ||
    a.source === "reservation" ||
    Boolean(a.linked_reservation_id) ||
    normalizePlanKind(a.activity_kind) === "lodging"
  );
}

export function effectivePlanKind(a: {
  activity_type?: string | null;
  source?: string | null;
  linked_reservation_id?: string | null;
  activity_kind?: string | null;
}) {
  if (isLodgingPlanActivity(a)) return "lodging";
  return normalizePlanKind(a.activity_kind) || "visit";
}

export function getPlanActivityDisplayMeta(
  kindRaw: unknown,
  custom?: Map<string, { label: string; emoji?: string | null; color?: string | null }>
) {
  const kind = normalizePlanKind(kindRaw);
  const fromCustom = custom?.get(kind) || null;
  if (fromCustom) {
    return {
      key: kind,
      label: fromCustom.label || kind,
      icon: fromCustom.emoji || "•",
      color: fromCustom.color || "#64748b",
    };
  }
  if (kind === "culture") return { key: "culture", label: "Cultura", icon: "🏛️", color: "#f59e0b" };
  if (kind === "nature") return { key: "nature", label: "Naturaleza", icon: "🌿", color: "#10b981" };
  if (kind === "viewpoint") return { key: "viewpoint", label: "Mirador", icon: "🌄", color: "#0ea5e9" };
  if (kind === "neighborhood") return { key: "neighborhood", label: "Barrio", icon: "🧭", color: "#64748b" };
  if (kind === "market") return { key: "market", label: "Mercado", icon: "🧺", color: "#f97316" };
  if (kind === "excursion") return { key: "excursion", label: "Excursión", icon: "🚌", color: "#2563eb" };
  if (kind === "gastro_experience") return { key: "gastro_experience", label: "Gastronomía", icon: "🍷", color: "#db2777" };
  if (kind === "shopping") return { key: "shopping", label: "Compras", icon: "🛍️", color: "#a855f7" };
  if (kind === "night") return { key: "night", label: "Noche", icon: "🌙", color: "#334155" };
  if (kind === "museum") return { key: "museum", label: "Museo", icon: "🏛️", color: "#f59e0b" };
  if (kind === "restaurant") return { key: "restaurant", label: "Restaurante", icon: "🍽️", color: "#f97316" };
  if (kind === "transport") return { key: "transport", label: "Transporte", icon: "🚆", color: "#0ea5e9" };
  if (kind === "lodging") return { key: "lodging", label: "Alojamiento", icon: "🏨", color: "#8b5cf6" };
  if (kind === "activity") return { key: "activity", label: "Actividad", icon: "🎟️", color: "#10b981" };
  if (kind === "visit" || !kind) return { key: "visit", label: "Visita", icon: "📍", color: "#64748b" };
  const label = kind.slice(0, 1).toUpperCase() + kind.slice(1);
  return { key: kind, label, icon: "🏷️", color: "#475569" };
}

export function formatPlanDestinationLabel(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]!.toUpperCase()} · ${parts[1]!.toUpperCase()}`;
  return raw.toUpperCase();
}

export function planParticipantInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  if (parts.length === 1 && parts[0]!.length >= 2) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

/** Etiqueta corta de fecha para pestañas del plan (p. ej. «15 jun»). */
export function formatPlanDayTabDate(isoDate: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [y, m, d] = isoDate.split("-").map((part) => Number(part));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(dt).replace(/\.$/, "");
}

export function formatPlanDayTabLabel(isoDate: string, dayIndex: number): { day: string; date: string | null } {
  return {
    day: `Día ${dayIndex}`,
    date: formatPlanDayTabDate(isoDate),
  };
}

/** Una línea para chips del asistente: «Día 6 · 3 nov 2026». */
export function formatItineraryDayOneLine(dayIndex: number, isoDate: string | null | undefined): string {
  const base = `Día ${dayIndex}`;
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return base;
  const short = formatPlanDayTabDate(isoDate);
  const year = isoDate.slice(0, 4);
  return short ? `${base} · ${short} ${year}` : base;
}
