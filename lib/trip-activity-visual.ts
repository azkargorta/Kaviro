export type ActivityVisualState = "past" | "current" | "upcoming" | "default";

export function todayYMD() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

export function nowHHMM() {
  return new Date().toTimeString().slice(0, 5);
}

export function resolveActivityVisualState(params: {
  activityDate: string | null | undefined;
  activityTime: string | null | undefined;
  today?: string;
  now?: string;
}): ActivityVisualState {
  const today = params.today ?? todayYMD();
  const now = params.now ?? nowHHMM();
  const date = (params.activityDate || "").trim();
  const time = (params.activityTime || "").trim().slice(0, 5);

  if (!date) return "default";
  if (date < today) return "past";
  if (date > today) return "upcoming";

  if (!time || !/^\d{2}:\d{2}$/.test(time)) return "default";
  if (time < now) return "past";
  if (time === now) return "current";
  return "upcoming";
}
