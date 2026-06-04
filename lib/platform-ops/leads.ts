export const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "rejected"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Cualificado",
  converted: "Convertido",
  rejected: "Descartado",
};

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}
