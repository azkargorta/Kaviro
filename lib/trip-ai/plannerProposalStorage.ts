import type { PlannerBrief } from "@/lib/trip-ai/plannerBrief";

export const PLANNER_PROPOSAL_STORAGE_KEY = "kaviro_planner_proposal_v1";

export type PlannerProposalSnapshot = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  briefSummary: string[];
  days: Array<{
    day: number;
    date: string;
    base?: string;
    items: Array<{
      title: string;
      activity_time: string | null;
      place_name: string | null;
      description: string | null;
      activity_kind: string | null;
    }>;
  }>;
  generatedAt: string;
};

function storageOk(store: Storage | undefined): store is Storage {
  return Boolean(store && typeof store.getItem === "function");
}

function parseSnapshot(raw: string | null): PlannerProposalSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PlannerProposalSnapshot;
    if (!parsed || !Array.isArray(parsed.days) || parsed.days.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** localStorage: la pestaña del PDF no comparte sessionStorage con el planificador. */
export function savePlannerProposalSnapshot(snapshot: PlannerProposalSnapshot): boolean {
  if (typeof window === "undefined") return false;
  const raw = JSON.stringify(snapshot);
  let ok = false;
  try {
    if (storageOk(window.localStorage)) {
      window.localStorage.setItem(PLANNER_PROPOSAL_STORAGE_KEY, raw);
      ok = true;
    }
  } catch {
    /* quota / modo privado */
  }
  try {
    if (storageOk(window.sessionStorage)) {
      window.sessionStorage.setItem(PLANNER_PROPOSAL_STORAGE_KEY, raw);
      ok = true;
    }
  } catch {
    /* ignore */
  }
  return ok;
}

export function loadPlannerProposalSnapshot(): PlannerProposalSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const fromLocal = storageOk(window.localStorage)
      ? parseSnapshot(window.localStorage.getItem(PLANNER_PROPOSAL_STORAGE_KEY))
      : null;
    if (fromLocal) return fromLocal;
  } catch {
    /* ignore */
  }
  try {
    const fromSession = storageOk(window.sessionStorage)
      ? parseSnapshot(window.sessionStorage.getItem(PLANNER_PROPOSAL_STORAGE_KEY))
      : null;
    if (fromSession) return fromSession;
  } catch {
    /* ignore */
  }
  return null;
}

export function snapshotFromPlannerDraft(params: {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  brief: PlannerBrief | null;
  days: Array<{
    day: number;
    date: string;
    base?: string;
    items: Array<{
      title: string;
      activity_time: string | null;
      place_name: string | null;
      description: string | null;
      activity_kind: string | null;
    }>;
  }>;
}): PlannerProposalSnapshot {
  return {
    title: params.title,
    destination: params.destination,
    startDate: params.startDate,
    endDate: params.endDate,
    briefSummary: params.brief
      ? [
          params.brief.sleepBases.length ? `Bases: ${params.brief.sleepBases.join(" · ")}` : "",
          params.brief.arrival.time || params.brief.arrival.place
            ? `Llegada: ${[params.brief.arrival.place, params.brief.arrival.date, params.brief.arrival.time].filter(Boolean).join(" · ")}`
            : "",
          params.brief.departure.time || params.brief.departure.place
            ? `Salida: ${[params.brief.departure.place, params.brief.departure.date, params.brief.departure.time].filter(Boolean).join(" · ")}`
            : "",
        ].filter(Boolean)
      : [],
    days: params.days,
    generatedAt: new Date().toISOString(),
  };
}
