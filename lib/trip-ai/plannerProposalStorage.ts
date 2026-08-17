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

export function savePlannerProposalSnapshot(snapshot: PlannerProposalSnapshot): void {
  sessionStorage.setItem(PLANNER_PROPOSAL_STORAGE_KEY, JSON.stringify(snapshot));
}

export function loadPlannerProposalSnapshot(): PlannerProposalSnapshot | null {
  try {
    const raw = sessionStorage.getItem(PLANNER_PROPOSAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlannerProposalSnapshot;
    if (!parsed || !Array.isArray(parsed.days)) return null;
    return parsed;
  } catch {
    return null;
  }
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
