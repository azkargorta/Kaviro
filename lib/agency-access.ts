/** Rutas del panel Kaviro Trips (solo miembros de agencia). */
export function isAgencyPanelPath(pathname: string): boolean {
  if (pathname === "/agency") return true;
  if (!pathname.startsWith("/agency/")) return false;
  return !pathname.startsWith("/agency/join");
}

export function isAgencyJoinPath(pathname: string): boolean {
  return pathname === "/agency/join" || pathname.startsWith("/agency/join/");
}

/** APIs del panel: exige membresía (excepto comprobar sesión e invitaciones). */
export function isProtectedAgencyApiPath(pathname: string): boolean {
  if (!pathname.startsWith("/api/agencies/")) return false;
  if (pathname === "/api/agencies/me") return false;
  if (pathname.startsWith("/api/agencies/invites/accept")) return false;
  return true;
}
