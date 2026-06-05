import { isAgencyBillingOnlyPath } from "@/lib/agency-plan-access";

/** Rutas que exigen membresía de agencia (incluye plan y panel; excluye setup/join). */
export function isAgencyPanelPath(pathname: string): boolean {
  if (pathname === "/agency") return true;
  if (!pathname.startsWith("/agency/")) return false;
  if (pathname === "/agency/setup" || pathname.startsWith("/agency/setup/")) return false;
  if (pathname.startsWith("/agency/join")) return false;
  return true;
}

export function isAgencyJoinPath(pathname: string): boolean {
  return pathname === "/agency/join" || pathname.startsWith("/agency/join/");
}

/** APIs del panel: exige membresía (excepto comprobar sesión e invitaciones). */
export function isProtectedAgencyApiPath(pathname: string): boolean {
  if (!pathname.startsWith("/api/agencies/")) return false;
  if (pathname === "/api/agencies/me") return false;
  if (pathname.startsWith("/api/agencies/invites/accept")) return false;
  if (pathname === "/api/agencies/register") return false;
  if (pathname === "/api/agencies/billing/checkout") return false;
  if (pathname === "/api/agencies/billing/status") return false;
  if (pathname === "/api/agencies/billing/portal") return false;
  return true;
}
