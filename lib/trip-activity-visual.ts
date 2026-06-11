export type ActivityVisualState = "past" | "current" | "upcoming" | "default";

/** Minutos tras la hora de inicio en los que una actividad cuenta como «ahora». */
export const TODAY_CURRENT_WINDOW_MINUTES = 45;

export function todayYMD() {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

export function nowHHMM() {
  return new Date().toTimeString().slice(0, 5);
}

export function normalizeHHMM(time: string | null | undefined): string | null {
  const t = (time || "").trim().slice(0, 5);
  return /^\d{2}:\d{2}$/.test(t) ? t : null;
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesSince(activityTime: string, now: string): number {
  return timeToMinutes(now) - timeToMinutes(activityTime);
}

/** Actividad en curso: empezó hace menos de CURRENT_WINDOW minutos. */
export function isActivityInCurrentWindow(
  activityTime: string | null | undefined,
  now: string,
  windowMinutes = TODAY_CURRENT_WINDOW_MINUTES
): boolean {
  const t = normalizeHHMM(activityTime);
  if (!t || t > now) return false;
  return minutesSince(t, now) < windowMinutes;
}

type TimedActivity = {
  id: string;
  activity_time?: string | null;
};

export function sortActivitiesByTime<T extends TimedActivity>(activities: T[]): T[] {
  return [...activities].sort((a, b) => {
    const ta = normalizeHHMM(a.activity_time) ?? "99:99";
    const tb = normalizeHHMM(b.activity_time) ?? "99:99";
    return ta.localeCompare(tb);
  });
}

/** Timeline del día para la pestaña Hoy: spotlight, siguiente y estado visual. */
export function resolveTodayDayTimeline<T extends TimedActivity>(
  activities: T[],
  now: string,
  windowMinutes = TODAY_CURRENT_WINDOW_MINUTES
): {
  sorted: T[];
  spotlight: T | null;
  next: T | null;
  stateFor: (activity: T) => ActivityVisualState;
} {
  const sorted = sortActivitiesByTime(activities);

  let spotlight: T | null = null;
  for (const activity of sorted) {
    if (isActivityInCurrentWindow(activity.activity_time, now, windowMinutes)) {
      spotlight = activity;
    }
  }

  const next =
    sorted.find((activity) => {
      const t = normalizeHHMM(activity.activity_time);
      return t && t > now;
    }) ?? null;

  const stateFor = (activity: T): ActivityVisualState => {
    if (spotlight && activity.id === spotlight.id) return "current";
    const t = normalizeHHMM(activity.activity_time);
    if (!t) return "default";
    if (t > now) return "upcoming";
    return "past";
  };

  return { sorted, spotlight, next, stateFor };
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
  const time = normalizeHHMM(params.activityTime);

  if (!date) return "default";
  if (date < today) return "past";
  if (date > today) return "upcoming";

  if (!time) return "default";
  if (isActivityInCurrentWindow(time, now)) return "current";
  if (time <= now) return "past";
  return "upcoming";
}
