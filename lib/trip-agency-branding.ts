import type { TripWorkspaceMeta } from "@/lib/load-trip-workspace";

/** Viajes de agencia: aplicar logo y color de marca de la empresa (no solo vista cliente). */
export function shouldUseAgencyBranding(meta: Pick<TripWorkspaceMeta, "isAgencyManaged" | "agencyBranding">) {
  return meta.isAgencyManaged && Boolean(meta.agencyBranding);
}
