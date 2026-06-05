import type { TripAiDiffOperation } from "@/lib/trip-ai/diff-types";

export type DiffEntityActivity = {
  title?: string | null;
  activity_date?: string | null;
  activity_time?: string | null;
};

export type DiffEntityRoute = {
  title?: string | null;
  route_name?: string | null;
  name?: string | null;
  route_day?: string | null;
  departure_time?: string | null;
};

export type DiffDisplayContext = {
  activitiesById?: Map<string, DiffEntityActivity>;
  routesById?: Map<string, DiffEntityRoute>;
};

export type DiffOpDisplay = {
  kind: "activity" | "route" | "unknown";
  title: string;
  subtitle: string | null;
  date: string | null;
  tone: "good" | "warn" | "neutral";
  details: string | null;
  raw: TripAiDiffOperation;
};

export function diffOpKey(op: TripAiDiffOperation, idx: number): string {
  return `${String(op.op || "op")}-${String(op.id || op.fields?.title || idx)}`;
}

export function diffOpDisplay(op: TripAiDiffOperation, ctx: DiffDisplayContext): DiffOpDisplay {
  const rawOp = typeof op.op === "string" ? op.op.trim() : "";
  const normalized = rawOp.toLowerCase();
  const id = typeof op.id === "string" ? op.id : null;

  const act = id && ctx.activitiesById ? ctx.activitiesById.get(id) : null;
  const route = id && ctx.routesById ? ctx.routesById.get(id) : null;

  if (normalized === "update_activity") {
    const patch = op.patch || {};
    const beforeTitle = String(act?.title || "").trim() || "Plan";
    const nextTitle = typeof patch.title === "string" && patch.title.trim() ? patch.title.trim() : beforeTitle;
    const beforeDate = typeof act?.activity_date === "string" ? act.activity_date : null;
    const afterDate =
      typeof patch.activity_date === "string" ? patch.activity_date : patch.activity_date === null ? null : beforeDate;
    const beforeTime = typeof act?.activity_time === "string" ? act.activity_time : null;
    const afterTime =
      typeof patch.activity_time === "string" ? patch.activity_time : patch.activity_time === null ? null : beforeTime;

    const changes: string[] = [];
    if (nextTitle !== beforeTitle) changes.push(`Título: “${beforeTitle}” → “${nextTitle}”`);
    if (afterDate !== beforeDate) changes.push(`Fecha: ${beforeDate || "—"} → ${afterDate || "—"}`);
    if (afterTime !== beforeTime) changes.push(`Hora: ${beforeTime || "—"} → ${afterTime || "—"}`);
    if (typeof patch.address === "string") changes.push("Dirección actualizada");
    if (typeof patch.place_name === "string") changes.push("Lugar actualizado");
    if (typeof patch.activity_kind === "string") changes.push("Tipo actualizado");

    return {
      kind: "activity",
      title: `Actualizar plan: ${nextTitle}`,
      subtitle: changes.length ? changes.join(" · ") : "Cambio menor",
      date: afterDate || beforeDate,
      tone: "neutral",
      details: null,
      raw: op,
    };
  }

  if (normalized === "create_activity") {
    const f = op.fields || {};
    const title = String(f.title || "").trim() || "Nuevo plan";
    const date = typeof f.activity_date === "string" ? f.activity_date : null;
    const time = typeof f.activity_time === "string" ? f.activity_time : null;
    const where = String(f.place_name || f.address || "").trim();
    return {
      kind: "activity",
      title: `Añadir plan: ${title}`,
      subtitle: [date, time, where].filter(Boolean).join(" · ") || null,
      date,
      tone: "good",
      details: null,
      raw: op,
    };
  }

  if (normalized === "delete_activity") {
    const title = String(act?.title || "").trim() || "Plan";
    const date = typeof act?.activity_date === "string" ? act.activity_date : null;
    return {
      kind: "activity",
      title: `Eliminar plan: ${title}`,
      subtitle: date ? `Fecha: ${date}` : null,
      date,
      tone: "warn",
      details: "Revisa bien los borrados antes de aplicar.",
      raw: op,
    };
  }

  if (normalized === "update_route") {
    const patch = op.patch || {};
    const beforeTitle = String(route?.title || route?.route_name || route?.name || "").trim() || "Ruta";
    const nextTitle = typeof patch.title === "string" && patch.title.trim() ? patch.title.trim() : beforeTitle;
    const beforeDay = typeof route?.route_day === "string" ? route.route_day : null;
    const afterDay =
      typeof patch.route_day === "string" ? patch.route_day : patch.route_day === null ? null : beforeDay;
    const beforeTime = typeof route?.departure_time === "string" ? route.departure_time : null;
    const afterTime =
      typeof patch.departure_time === "string"
        ? patch.departure_time
        : patch.departure_time === null
          ? null
          : beforeTime;

    const changes: string[] = [];
    if (nextTitle !== beforeTitle) changes.push(`Título: “${beforeTitle}” → “${nextTitle}”`);
    if (afterDay !== beforeDay) changes.push(`Día: ${beforeDay || "—"} → ${afterDay || "—"}`);
    if (afterTime !== beforeTime) changes.push(`Salida: ${beforeTime || "—"} → ${afterTime || "—"}`);
    if (typeof patch.travel_mode === "string") changes.push(`Modo: ${patch.travel_mode}`);
    if (typeof patch.notes === "string") changes.push("Notas actualizadas");

    return {
      kind: "route",
      title: `Actualizar ruta: ${nextTitle}`,
      subtitle: changes.length ? changes.join(" · ") : null,
      date: afterDay || beforeDay,
      tone: "neutral",
      details: null,
      raw: op,
    };
  }

  if (normalized === "create_route") {
    const f = op.fields || {};
    const title = String(f.title || "").trim() || "Nueva ruta";
    const date = typeof f.route_day === "string" ? f.route_day : null;
    const time = typeof f.departure_time === "string" ? f.departure_time : null;
    const travelMode = typeof f.travel_mode === "string" ? f.travel_mode : null;
    const origin = String(f.origin_name || f.origin_address || "").trim();
    const destination = String(f.destination_name || f.destination_address || "").trim();
    const path = [origin, destination].filter(Boolean).join(" → ");
    const duration = typeof f.duration_text === "string" ? f.duration_text.trim() : "";
    return {
      kind: "route",
      title: `Añadir ruta: ${title}`,
      subtitle: [date, time, travelMode, path, duration].filter(Boolean).join(" · ") || null,
      date,
      tone: "good",
      details: null,
      raw: op,
    };
  }

  return {
    kind: "unknown",
    title: `Operación no reconocida: ${rawOp || "unknown"}`,
    subtitle: null,
    date: null,
    tone: "warn",
    details: "El asistente personal devolvió un formato distinto al esperado. Puedes descartarlo.",
    raw: op,
  };
}
