import type { AgencyMemberRow, AgencyRow } from "@/lib/agency";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export function canManageAgencyBranding(
  agency: Pick<AgencyRow, "owner_id">,
  membership: AgencyMemberRow,
  userId: string
): boolean {
  return membership.role === "admin" || agency.owner_id === userId;
}

export function normalizeBrandColor(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!HEX_COLOR.test(withHash)) return null;
  return withHash.toLowerCase();
}

export function normalizeAgencyContactEmail(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

export const AGENCY_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const AGENCY_LOGO_BUCKET = "agency-logos";

export const AGENCY_LOGO_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

export function agencyLogoExtension(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    default:
      return "png";
  }
}

export function agencyLogoStoragePath(agencyId: string, mime: string) {
  return `${agencyId}/logo.${agencyLogoExtension(mime)}`;
}
