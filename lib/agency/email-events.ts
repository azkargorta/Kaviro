export const AGENCY_EMAIL_EVENTS = [
  "deposit_reminder",
  "final_reminder",
  "pretravel_invite",
  "nps_invite",
] as const;

export type AgencyEmailEvent = (typeof AGENCY_EMAIL_EVENTS)[number];

export const AGENCY_EMAIL_EVENT_LABELS: Record<AgencyEmailEvent, string> = {
  deposit_reminder: "Recordatorio de señal",
  final_reminder: "Recordatorio de pago final",
  pretravel_invite: "Encuesta pre-viaje",
  nps_invite: "Encuesta NPS post-viaje",
};

export const AGENCY_EMAIL_EVENT_DESCRIPTIONS: Record<AgencyEmailEvent, string> = {
  deposit_reminder: "Enlace de pago de la señal a viajeros con señal pendiente.",
  final_reminder: "Enlace del pago final (solo si la señal ya está pagada).",
  pretravel_invite: "Formulario pre-viaje pendiente de completar.",
  nps_invite: "Encuesta de satisfacción tras el viaje.",
};

export function isAgencyEmailEvent(value: unknown): value is AgencyEmailEvent {
  return typeof value === "string" && (AGENCY_EMAIL_EVENTS as readonly string[]).includes(value);
}

export type EmailAutomationSettings = {
  remindDeposit: boolean;
  remindFinal: boolean;
  pretravelInvite: boolean;
  npsInvite: boolean;
};

export const DEFAULT_EMAIL_AUTOMATION: EmailAutomationSettings = {
  remindDeposit: true,
  remindFinal: true,
  pretravelInvite: true,
  npsInvite: false,
};

export function eventEnabledForSettings(
  event: AgencyEmailEvent,
  settings: EmailAutomationSettings
): boolean {
  switch (event) {
    case "deposit_reminder":
      return settings.remindDeposit;
    case "final_reminder":
      return settings.remindFinal;
    case "pretravel_invite":
      return settings.pretravelInvite;
    case "nps_invite":
      return settings.npsInvite;
    default:
      return false;
  }
}
