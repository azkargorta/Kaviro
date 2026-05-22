export type PushNotifyEvent =
  | "activity_added"
  | "activity_edited"
  | "expense_added"
  | "participant_joined"
  | "trip_starts_tomorrow"
  | "trip_invite";

export type PushNotificationPreferences = {
  enabled: boolean;
  activity_added: boolean;
  activity_edited: boolean;
  expense_added: boolean;
  participant_joined: boolean;
  trip_starts_tomorrow: boolean;
  trip_invite: boolean;
};

export const DEFAULT_PUSH_NOTIFICATION_PREFERENCES: PushNotificationPreferences = {
  enabled: true,
  activity_added: true,
  activity_edited: true,
  expense_added: true,
  participant_joined: true,
  trip_starts_tomorrow: true,
  trip_invite: true,
};

export const PUSH_NOTIFICATION_EVENT_OPTIONS: Array<{
  key: Exclude<keyof PushNotificationPreferences, "enabled">;
  label: string;
  description: string;
}> = [
  {
    key: "activity_added",
    label: "Nuevas actividades",
    description: "Cuando alguien añade algo al plan del viaje.",
  },
  {
    key: "activity_edited",
    label: "Actividades editadas",
    description: "Cuando se modifica una actividad existente.",
  },
  {
    key: "expense_added",
    label: "Nuevos gastos",
    description: "Cuando se registra un gasto compartido.",
  },
  {
    key: "participant_joined",
    label: "Nuevo participante",
    description: "Cuando alguien se une al viaje.",
  },
  {
    key: "trip_invite",
    label: "Invitaciones al viaje",
    description: "Cuando te invitan a un viaje.",
  },
  {
    key: "trip_starts_tomorrow",
    label: "Viaje empieza mañana",
    description: "Recordatorio un día antes de la salida.",
  },
];

const EVENT_KEYS = PUSH_NOTIFICATION_EVENT_OPTIONS.map((o) => o.key);

export function mergePushNotificationPreferences(
  row: Partial<PushNotificationPreferences> | null | undefined
): PushNotificationPreferences {
  if (!row) return { ...DEFAULT_PUSH_NOTIFICATION_PREFERENCES };
  return {
    enabled: row.enabled !== false,
    activity_added: row.activity_added !== false,
    activity_edited: row.activity_edited !== false,
    expense_added: row.expense_added !== false,
    participant_joined: row.participant_joined !== false,
    trip_starts_tomorrow: row.trip_starts_tomorrow !== false,
    trip_invite: row.trip_invite !== false,
  };
}

export function userWantsPushForEvent(
  prefs: PushNotificationPreferences,
  event: PushNotifyEvent
): boolean {
  if (!prefs.enabled) return false;
  return prefs[event] !== false;
}

export function filterUserIdsByPushPreferences(
  userIds: string[],
  rows: Array<{ user_id: string } & Partial<PushNotificationPreferences>>,
  event: PushNotifyEvent
): string[] {
  const byUser = new Map(rows.map((row) => [row.user_id, mergePushNotificationPreferences(row)]));
  return userIds.filter((userId) => {
    const prefs = byUser.get(userId) ?? DEFAULT_PUSH_NOTIFICATION_PREFERENCES;
    return userWantsPushForEvent(prefs, event);
  });
}

export function normalizePushPreferencesPatch(
  body: Record<string, unknown> | null | undefined
): Partial<PushNotificationPreferences> {
  const patch: Partial<PushNotificationPreferences> = {};
  if (!body) return patch;

  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
  for (const key of EVENT_KEYS) {
    if (typeof body[key] === "boolean") patch[key] = body[key];
  }
  return patch;
}
