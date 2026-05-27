export type ActivityReactionKind = "join" | "skip" | "maybe";

export type ActivityReactionRow = {
  id: string;
  user_id: string;
  display_name: string;
  reaction: ActivityReactionKind;
  comment: string | null;
  activity_id?: string;
};

export const REACTION_META: Record<
  ActivityReactionKind,
  { label: string; icon: string; chipClass: string }
> = {
  join: {
    label: "Sí",
    icon: "✅",
    chipClass: "bg-emerald-50 text-emerald-900 border-emerald-200",
  },
  skip: {
    label: "No",
    icon: "❌",
    chipClass: "bg-rose-50 text-rose-900 border-rose-200",
  },
  maybe: {
    label: "Quizás",
    icon: "🤔",
    chipClass: "bg-amber-50 text-amber-950 border-amber-200",
  },
};

export type ActivityReactionStats = {
  join: number;
  skip: number;
  maybe: number;
  total: number;
  joiners: ActivityReactionRow[];
  maybes: ActivityReactionRow[];
  skips: ActivityReactionRow[];
};

export function emptyReactionStats(): ActivityReactionStats {
  return { join: 0, skip: 0, maybe: 0, total: 0, joiners: [], maybes: [], skips: [] };
}

export function aggregateReactionsByActivity(
  reactions: ActivityReactionRow[]
): Map<string, ActivityReactionStats> {
  const map = new Map<string, ActivityReactionStats>();

  for (const r of reactions) {
    const activityId = r.activity_id;
    if (!activityId) continue;
    const prev = map.get(activityId) ?? emptyReactionStats();
    prev.total += 1;
    if (r.reaction === "join") {
      prev.join += 1;
      prev.joiners.push(r);
    } else if (r.reaction === "maybe") {
      prev.maybe += 1;
      prev.maybes.push(r);
    } else if (r.reaction === "skip") {
      prev.skip += 1;
      prev.skips.push(r);
    }
    map.set(activityId, prev);
  }

  return map;
}
