/** Rutas reservadas a administradores de plataforma (Kaviro Ops). */

export function isPlatformOpsPath(pathname: string): boolean {
  if (pathname === "/api/admin/me") return false;
  if (pathname.startsWith("/api/admin/")) return true;
  if (pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/")) return true;
  if (pathname === "/ops" || pathname.startsWith("/ops/")) return true;
  if (pathname.startsWith("/api/ops/")) return true;
  return false;
}
