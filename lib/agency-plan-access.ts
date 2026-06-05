import type { AgencyRow } from "@/lib/agency";
import { isAgencyPlanActive } from "@/lib/agency-plan";

/** Rutas accesibles aunque el plan esté inactivo (trial expirado, suspendido, etc.). */
export function isAgencyBillingOnlyPath(pathname: string): boolean {
  if (pathname === "/agency/plan" || pathname.startsWith("/agency/plan/")) return true;
  if (pathname === "/api/agencies/billing/checkout") return true;
  if (pathname === "/api/agencies/billing/status") return true;
  if (pathname === "/api/agencies/billing/portal") return true;
  return false;
}

/** Panel operativo: requiere plan activo (excluye setup, join y facturación). */
export function isAgencyWorkspacePath(pathname: string): boolean {
  if (pathname === "/agency") return true;
  if (!pathname.startsWith("/agency/")) return false;
  if (pathname === "/agency/setup" || pathname.startsWith("/agency/setup/")) return false;
  if (pathname.startsWith("/agency/join")) return false;
  if (isAgencyBillingOnlyPath(pathname)) return false;
  return true;
}

export function agencyHasWorkspaceAccess(agency: Pick<AgencyRow, "plan" | "plan_active_until">): boolean {
  return isAgencyPlanActive(agency);
}
