/** Modo de aplicación: Kaviro personal (B2C) vs Kaviro Trips (B2B). */
export type WorkspaceMode = "personal" | "agency";

export const WORKSPACE_MODE_STORAGE_KEY = "kaviro_workspace_mode";

export function isAgencyPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/agency" || pathname.startsWith("/agency/");
}

export function isPersonalAppPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (isAgencyPath(pathname)) return false;
  if (pathname === "/empresa" || pathname.startsWith("/empresa/")) return false;
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/trip/") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/trips/")
  );
}

export function defaultLoginNext(mode: WorkspaceMode): string {
  return mode === "agency" ? "/agency" : "/dashboard";
}

export function parseWorkspaceModeParam(value: string | null | undefined): WorkspaceMode {
  if (value === "agency" || value === "empresa" || value === "business") return "agency";
  return "personal";
}
